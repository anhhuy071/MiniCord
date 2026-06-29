---
description: Choose the right multi-agent pattern before spawning subagents — includes observability runbook.
---

# /multi-agent

Before launching 2+ agents, run this decision flow:

1. **Isolated git/build parallelism needed?** → `orchestrate-worktrees` (tmux/WSL) else in-process Task subagents
2. **Build until rubric passes?** → `/gan-build`
3. **Structured spec → TDD pipeline?** → `/orch-*`
4. **Ambiguous tradeoff?** → `council` skill
5. **Codex + Gemini?** → `/workflow` (requires ccg-workflow)
6. **Long autonomous iteration?** → `/loop-start` + loop-operator
7. **Default** → parallel Task subagents (independent reviews)

Always define stop conditions (max iterations, pass threshold, human gate).

## Observability before spawn

Run:

```bash
npm run observability:ready
npm run observability:inspect
```

During run, tail logs:

```bash
node scripts/session-inspect.js --live
node scripts/orchestration-status.js --watch --session <name>
```

See skill `multi-agent-playbook` for full matrix and anti-patterns.
