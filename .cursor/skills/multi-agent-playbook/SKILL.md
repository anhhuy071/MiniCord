---
name: multi-agent-playbook
description: Decision matrix and runbook for choosing multi-agent patterns with observability hooks in ECC Cursor harness.
metadata:
  origin: ECC
---

# Multi-Agent Playbook

Activate before spawning 2+ agents.

## Decision matrix

| Task | Pattern | Command / skill |
|------|---------|-----------------|
| Independent reviews | Parallel subagents | Task tool |
| Ambiguous decision | Council | `council` skill |
| Unknown codebase context | Iterative retrieval | `iterative-retrieval` skill |
| Build + score loop | GAN | `/gan-build` |
| Spec → TDD pipeline | Orch | `/orch-*` |
| Codex + Gemini | Multi-model workflow | `/workflow` |
| Isolated parallel workers | Worktrees | `orchestrate-worktrees.js` |
| Long autonomous work | Managed loop | `/loop-start` |

## Runbook template

```markdown
## Multi-agent runbook
- Pattern:
- Agents:
- Parallel: yes/no
- Stop condition:
- Observability: npm run observability:ready && npm run observability:inspect
```

## Anti-patterns

- Sequential independent reviews
- Full transcript to subagents
- Council for code review
- External models writing files
- Spawning without stop conditions

## Observability

Log sinks under `~/.claude/metrics/` — see `/observability` command.
