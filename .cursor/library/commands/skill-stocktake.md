---
description: Audit Cursor/ECC skills and commands for quality using the skill-stocktake workflow.
---

# Skill Stocktake

Run a catalog quality audit using the **skill-stocktake** skill.

## Usage

```
/skill-stocktake
/skill-stocktake full
```

## Scan paths (Cursor template)

| Path | Description |
|------|-------------|
| `.cursor/skills/` | Canonical template skills |
| `.cursor/.agents/skills/` | ECC plugin subset |
| `.cursor/commands/` | Slash command shims |
| `~/.claude/skills/` | User-global skills (if present) |

## Workflow

1. Read `.cursor/skills/skill-stocktake/SKILL.md` and follow its Quick Scan or Full Stocktake flow.
2. When run from this repo, include `.cursor/skills/` and `.cursor/commands/` in the inventory.
3. Write results to the path documented in the skill (default under `~/.claude/skills/skill-stocktake/`).

## Related

- `agent-sort` — classify DAILY vs LIBRARY
- `/harness-audit` — harness readiness scorecard
- `/ecc-guide find: <topic>` — discover skills
