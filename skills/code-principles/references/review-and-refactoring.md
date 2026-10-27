# Review and refactoring

## Contents
- Reviewing code
- Refactoring safely
- Splitting a file or function
- When not to touch code
- Running the audit script

## Reviewing code

Review in this order, because the early questions are the expensive ones:
1. **Correctness**: does it do what was asked, including edges and failures?
2. **Boundaries**: is each piece in the right module, with dependencies pointing inward and no cycles? Is business logic free of HTTP/SQL/framework?
3. **Cohesion and coupling**: one reason to change per unit? Dependencies injected and small?
4. **Readability**: names, size, nesting, magic values, comments that say *why*.
5. **Tests**: is the behavior covered, are the tests readable and deterministic?
6. **Security and data**: input validated, secrets and personal data kept out of logs and bundles, authorization checked at the right layer.

Report findings with file and line, the rule it breaks, and the concrete fix. Separate must-fix from nice-to-have. Praise what is good; reviews that only list faults teach nothing.

## Refactoring safely

- Tests first. If the behavior is not covered, add a characterization test before moving anything.
- Small steps, each leaving the code working and tests green. Rename, then extract, then move; do not mix.
- Do not change behavior and structure in the same commit.
- Refactor what you are touching. Unrelated mess gets mentioned to the user, not fixed in this change; it hides the real diff and widens the risk.

## Splitting a file or function

Signals: you need "and" to describe it; it has sections separated by comment banners; unrelated tests need unrelated setup; it changes for two different reasons.
1. Name each responsibility in the domain's words.
2. Move one responsibility at a time into a file named after it, inside the same feature folder.
3. Leave the original as a thin orchestrator or delete it.
4. Check that imports still point inward and no cycle appeared.

A function over ~40 lines is usually several steps at the same level: extract each step with a name that reads like the outline of the original.

## When not to touch code

- Do not add abstractions for hypothetical futures. Duplication twice is cheaper than the wrong abstraction.
- Do not reformat or rename files you are not otherwise changing.
- Do not "fix" a project convention that differs from these principles on your own; flag it and let the owner decide.

## Running the audit script

`scripts/audit-code.mjs` is a read-only heuristic checker for the mechanical rules (magic numbers, repeated strings, `any`, long functions, deep nesting, many parameters, grab-bag file names, commented-out code, long files, constants not in UPPER_SNAKE_CASE or not at the top, public methods after private ones, constructor parameter properties).

```
node <skill-dir>/scripts/audit-code.mjs <paths...>          # default: current directory
node <skill-dir>/scripts/audit-code.mjs src --json          # machine-readable
node <skill-dir>/scripts/audit-code.mjs src --max-function-lines 30 --no-fail
```

Run it on the files you wrote or changed, before finishing. Treat every finding as a prompt to look, not a verdict: it cannot know that a repeated string is a member of a closed union or that a number is an identity. Fix real ones, and for the rest decide consciously. It cannot judge cohesion, coupling or naming quality; that is your job, using the checklist in SKILL.md.
