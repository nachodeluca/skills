# skills

A collection of agent skills I've created and currently use for my projects. (for Claude Code and other agents that read `SKILL.md`).

## Install

```
npx skills add nachodeluca/skills                           # choose interactively
npx skills add nachodeluca/skills --skill code-principles   # one skill
npx skills add nachodeluca/skills -g                        # global, for every project
npx skills update                                           # update installed skills
```

Requires Node.js 22.20 or later.

## Skills

| Skill | What it does | Activates when |
|-|-|-|
| [`code-principles`](skills/code-principles/SKILL.md) | Opinionated coding standards: clean code, high cohesion, low coupling through interfaces, scalable and maintainable, fully typed, UPPER_SNAKE_CASE constants, fixed class member order, restrained comments, Gitflow commits. Includes references per topic, a feature template and a read-only audit script. | Writing, changing, refactoring or reviewing code, structuring a module, or creating a branch or commit |

## Notes

- `code-principles` ships `scripts/audit-code.mjs`, a **read-only** Node script that scans source files for mechanical rule breaks (magic numbers, `any`, long functions...). It never edits or sends anything.
- Skills are opinionated. A project's own `CLAUDE.md` or `AGENTS.md` wins on project-specific conventions.

## Layout

```
skills/
└── <skill-name>/
    ├── SKILL.md        (name + description frontmatter, instructions)
    ├── references/     (loaded on demand)
    ├── scripts/        (deterministic helpers)
    └── assets/         (templates and files used in output)
```

## License

MIT, see [LICENSE](LICENSE).
