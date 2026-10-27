#!/usr/bin/env node
// Read-only heuristic audit of the mechanical rules in code-principles.
// It never edits files. Findings are hints to review, not verdicts: judgment rules
// (cohesion, coupling, naming quality) stay with the reader.
//
// Usage: node audit-code.mjs [paths...] [--max-function-lines N] [--max-file-lines N]
//                            [--max-parameters N] [--max-nesting N] [--repeated-string N]
//                            [--json] [--no-fail]

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const DEFAULTS = {
  maxFunctionLines: 40,
  maxFileLines: 300,
  maxParameters: 4,
  maxNesting: 3,
  repeatedStringCount: 3,
  minimumStringLength: 5,
};

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORED_DIRECTORIES = new Set([
  "node_modules", "dist", "build", ".next", ".turbo", "coverage", ".git", "out", ".local",
]);
const TEST_FILE_PATTERN = /\.(test|spec|eval)\.[cm]?[jt]sx?$|[\\/](tests?|__tests__)[\\/]/;
const GRAB_BAG_FILE_NAMES = new Set(["utils", "util", "helpers", "helper", "common", "misc", "stuff"]);
const VAGUE_IDENTIFIER_PATTERN =
  /\b(?:const|let|var|function)\s+(data|info|tmp|temp|util|utils|helper|helpers|stuff|handle|thing|obj|manager)\b/;
const ANY_TYPE_PATTERN = /:\s*any\b|\bas\s+any\b|<any>|\bany\[\]/;
const COMMENTED_CODE_PATTERN =
  /^\s*\/\/\s*(?:(?:const|let|var|import|export|return|if|for|while|await|throw)\b|[\w.$]+\([^)]*\);?\s*$|.*;\s*$)/;
const TOP_LEVEL_LITERAL_CONSTANT = /^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:-?[\d_.]+|(["'`]).*\2|\/.*\/[a-z]*)\s*;?\s*$/;
const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9_]*$/;
const NESTED_NUMBER_CONSTANT = /^\s+const\s+[\w$]+\s*(?::[^=]+)?=\s*(-?\d[\d_.]*)\s*;?\s*$/;
const PRIVATE_METHOD_PATTERN = /^(\s+)(?:static\s+)?(?:async\s+)?(?:private|protected)\s+(?:static\s+)?(?:async\s+)?[\w$]+\s*\([^)]*\)[^{]*\{\s*$/;
const PUBLIC_METHOD_PATTERN = /^(\s+)(?:public\s+|static\s+|async\s+|get\s+|set\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{\s*$/;
const CLASS_START_PATTERN = /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\b/;
const NON_METHOD_NAMES = new Set(["constructor", "if", "for", "while", "switch", "catch", "else", "return", "function"]);
const NUMBER_PATTERN = /(?<![\w.$#-])-?\d[\d_]*(?:\.\d+)?(?![\w.$])/g;
const ALLOWED_NUMBERS = new Set(["0", "1", "-1"]);
const NAMED_CONSTANT_LINE = /^\s*(?:export\s+)?(?:const|readonly|static)\s+[\w$]+\s*(?::[^=]+)?=|^\s*[\w$"']+\s*:\s*-?[\d_.]+,?\s*$|^\s*\w+\s*=\s*-?[\d_.]+,?\s*$/;
const NON_CODE_LINE = /^\s*(?:import\b|export\s+.*\bfrom\b|\}?\s*from\s)|^\s*(?:type|interface)\s/;
const STRING_LITERAL_PATTERN = /(["'])((?:\\.|(?!\1).)+)\1/g;
const FUNCTION_START_PATTERNS = [
  /\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(/,
  /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>\s*\{\s*$/,
  /^\s*(?:async\s+|static\s+|public\s+|private\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{\s*$/,
  // Callbacks such as route handlers: a factory that registers many of them is not one long, deep function.
  /(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>\s*\{\s*$/,
];
const PARAMETER_PROPERTY_LINE = /^\s*(?:private|public|protected)\s+(?:readonly\s+)?[\w$]+\s*\??:[^=;(]*,\s*$/;
const PARAMETER_PROPERTY_INLINE = /constructor\s*\([^)]*\b(?:private|public|protected|readonly)\s/;
const CONTROL_KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "else", "return"]);

function parseArguments(argv) {
  const options = { ...DEFAULTS, paths: [], json: false, failOnFindings: true };
  const numberFlags = {
    "--max-function-lines": "maxFunctionLines",
    "--max-file-lines": "maxFileLines",
    "--max-parameters": "maxParameters",
    "--max-nesting": "maxNesting",
    "--repeated-string": "repeatedStringCount",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--no-fail") options.failOnFindings = false;
    else if (numberFlags[argument]) {
      index += 1;
      options[numberFlags[argument]] = Number(argv[index]);
    } else options.paths.push(argument);
  }
  if (options.paths.length === 0) options.paths.push(process.cwd());
  return options;
}

function collectSourceFiles(path, files = []) {
  const stats = statSync(path);
  if (stats.isFile()) {
    if (SOURCE_EXTENSIONS.has(extname(path))) files.push(path);
    return files;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    collectSourceFiles(join(path, entry.name), files);
  }
  return files;
}

// Blanks out comments and string contents so that braces and numbers inside them
// are not mistaken for code. Keeps the line's length and the quotes.
function toCodeOnlyLines(lines) {
  let insideBlockComment = false;
  return lines.map((line) => {
    let result = "";
    let quote = null;
    for (let position = 0; position < line.length; position += 1) {
      const character = line[position];
      const next = line[position + 1];
      if (insideBlockComment) {
        if (character === "*" && next === "/") { insideBlockComment = false; position += 1; }
        continue;
      }
      if (quote) {
        if (character === "\\") { position += 1; continue; }
        if (character === quote) { quote = null; result += character; }
        continue;
      }
      if (character === "/" && next === "*") { insideBlockComment = true; position += 1; continue; }
      if (character === "/" && next === "/") break;
      if (character === '"' || character === "'" || character === "`") { quote = character; result += character; continue; }
      result += character;
    }
    return result;
  });
}

function countParameters(signature) {
  const open = signature.indexOf("(");
  const close = signature.indexOf(")", open);
  if (open === -1 || close === -1) return 0;
  const parameters = signature.slice(open + 1, close).trim();
  if (parameters === "" || parameters.includes("{")) return 0;
  return parameters.split(",").filter((part) => part.trim() !== "").length;
}

function findFunctionStart(codeLine) {
  for (const pattern of FUNCTION_START_PATTERNS) {
    const match = codeLine.match(pattern);
    if (!match || !codeLine.trimEnd().endsWith("{")) continue;
    const name = match[1] ?? "(anonymous)";
    if (CONTROL_KEYWORDS.has(name)) continue;
    return name;
  }
  return null;
}

function auditFunctions(codeLines, report, options) {
  const stack = [];
  let depth = 0;
  codeLines.forEach((codeLine, lineIndex) => {
    const name = findFunctionStart(codeLine);
    if (name) stack.push({ name, startLine: lineIndex + 1, depthBefore: depth, maxDepth: depth, signature: codeLine, nestedLines: 0 });
    for (const character of codeLine) {
      if (character === "{") depth += 1;
      else if (character === "}") depth -= 1;
      // Only the innermost function owns the depth: a factory returning methods is not "deeply nested".
      if (stack.length > 0) stack[stack.length - 1].maxDepth = Math.max(stack[stack.length - 1].maxDepth, depth);
    }
    while (stack.length > 0 && depth <= stack[stack.length - 1].depthBefore) {
      const closed = stack.pop();
      const totalLines = lineIndex + 1 - closed.startLine + 1;
      if (stack.length > 0) stack[stack.length - 1].nestedLines += totalLines;
      const length = totalLines - closed.nestedLines;
      const nesting = closed.maxDepth - closed.depthBefore - 1;
      if (length > options.maxFunctionLines)
        report(closed.startLine, "long-function", `${closed.name} is ${length} lines (max ${options.maxFunctionLines}); split it into steps at one level of abstraction`);
      if (nesting > options.maxNesting)
        report(closed.startLine, "deep-nesting", `${closed.name} nests ${nesting} levels deep (max ${options.maxNesting}); use early returns or extract`);
      const parameterCount = countParameters(closed.signature);
      if (parameterCount > options.maxParameters)
        report(closed.startLine, "many-parameters", `${closed.name} takes ${parameterCount} parameters (max ${options.maxParameters}); group them into a named object`);
    }
  });
}

function auditLines(lines, codeLines, report, isTestFile) {
  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const codeLine = codeLines[lineIndex];
    if (COMMENTED_CODE_PATTERN.test(line)) report(lineNumber, "commented-out-code", "commented-out code; delete it, version control remembers");
    if (VAGUE_IDENTIFIER_PATTERN.test(codeLine)) report(lineNumber, "vague-name", `vague name "${codeLine.match(VAGUE_IDENTIFIER_PATTERN)[1]}"; say what the thing is or does`);
    if (PARAMETER_PROPERTY_LINE.test(codeLine) || PARAMETER_PROPERTY_INLINE.test(codeLine))
      report(lineNumber, "parameter-property", "constructor parameter property; declare the field at the top of the class and assign it in the constructor");
    if (ANY_TYPE_PATTERN.test(codeLine)) report(lineNumber, "any-type", "`any` defeats the type system; use a real type or `unknown` plus validation");
    const topLevelConstant = line.match(TOP_LEVEL_LITERAL_CONSTANT);
    if (topLevelConstant && !UPPER_SNAKE_CASE.test(topLevelConstant[1]))
      report(lineNumber, "constant-not-uppercase", `constant ${topLevelConstant[1]} should be UPPER_SNAKE_CASE`);
    const nestedConstant = codeLine.match(NESTED_NUMBER_CONSTANT);
    if (nestedConstant && !ALLOWED_NUMBERS.has(nestedConstant[1]))
      report(lineNumber, "constant-not-at-top", `numeric constant ${nestedConstant[1]} declared inside a function; move it to the top of the file in UPPER_SNAKE_CASE`);
    if (isTestFile || NON_CODE_LINE.test(codeLine) || NAMED_CONSTANT_LINE.test(codeLine) || nestedConstant) return;
    for (const match of codeLine.matchAll(NUMBER_PATTERN)) {
      if (ALLOWED_NUMBERS.has(match[0])) continue;
      report(lineNumber, "magic-number", `magic number ${match[0]}; name it as a constant with its unit`);
    }
  });
}

// Class layout: fields, constructor, public methods, private methods last.
function auditClassMemberOrder(codeLines, report) {
  let firstPrivate = null;
  codeLines.forEach((codeLine, lineIndex) => {
    if (CLASS_START_PATTERN.test(codeLine)) { firstPrivate = null; return; }
    const privateMatch = codeLine.match(PRIVATE_METHOD_PATTERN);
    if (privateMatch) { firstPrivate ??= { indent: privateMatch[1], line: lineIndex + 1 }; return; }
    const publicMatch = codeLine.match(PUBLIC_METHOD_PATTERN);
    if (!publicMatch || !firstPrivate || NON_METHOD_NAMES.has(publicMatch[2])) return;
    if (publicMatch[1] !== firstPrivate.indent) return;
    report(lineIndex + 1, "member-order", `public method ${publicMatch[2]} comes after a private method (line ${firstPrivate.line}); put private methods at the bottom of the class`);
  });
}

function auditRepeatedStrings(lines, report, options) {
  const occurrences = new Map();
  lines.forEach((line, lineIndex) => {
    if (NON_CODE_LINE.test(line) || /^\s*(?:\/\/|\*|\|)/.test(line) || /className|testid/i.test(line)) return;
    for (const match of line.matchAll(STRING_LITERAL_PATTERN)) {
      const value = match[2];
      if (value.length < options.minimumStringLength || /^[\w-]+$/.test(value) && !/[-_/:.]/.test(value)) continue;
      const lineNumbers = occurrences.get(value) ?? [];
      lineNumbers.push(lineIndex + 1);
      occurrences.set(value, lineNumbers);
    }
  });
  for (const [value, lineNumbers] of occurrences) {
    if (lineNumbers.length < options.repeatedStringCount) continue;
    report(lineNumbers[0], "repeated-string", `"${value}" appears ${lineNumbers.length} times (lines ${lineNumbers.join(", ")}); name it once, unless it is a member of a closed union`);
  }
}

function auditFile(path, root, options) {
  const findings = [];
  const displayPath = relative(root, path) || path;
  const report = (line, rule, message) => findings.push({ file: displayPath, line, rule, message });
  const isTestFile = TEST_FILE_PATTERN.test(path);
  const name = basename(path, extname(path)).toLowerCase();
  if (GRAB_BAG_FILE_NAMES.has(name)) report(1, "grab-bag-file", `"${basename(path)}" is a grab-bag name; name the domain concept the code belongs to`);

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  if (lines.length > options.maxFileLines) report(1, "long-file", `${lines.length} lines (max ${options.maxFileLines}); if you need "and" to describe it, split it`);
  const codeLines = toCodeOnlyLines(lines);
  auditLines(lines, codeLines, report, isTestFile);
  auditFunctions(codeLines, report, options);
  auditClassMemberOrder(codeLines, report);
  if (!isTestFile) auditRepeatedStrings(lines, report, options);
  return findings;
}

function printReport(findings, fileCount, options) {
  if (options.json) {
    console.log(JSON.stringify({ filesAudited: fileCount, findings }, null, 2));
    return;
  }
  for (const finding of findings) console.log(`${finding.file}:${finding.line}  [${finding.rule}]  ${finding.message}`);
  const byRule = findings.reduce((counts, { rule }) => ({ ...counts, [rule]: (counts[rule] ?? 0) + 1 }), {});
  console.log(`\n${fileCount} files audited, ${findings.length} findings`);
  for (const [rule, count] of Object.entries(byRule)) console.log(`  ${rule}: ${count}`);
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  const files = options.paths.flatMap((path) => collectSourceFiles(path));
  const findings = files.flatMap((file) => auditFile(file, root, options));
  printReport(findings, files.length, options);
  if (findings.length > 0 && options.failOnFindings) process.exitCode = 1;
}

main();
