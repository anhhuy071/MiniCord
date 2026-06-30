---
description: Inspect orchestration sessions, worker grid, and handoff files.
---

# /orchestration-status

## Usage

```text
/orchestration-status --list
/orchestration-status --session <name>
/orchestration-status --watch --session <name>
```

Run via CLI:

```bash
node scripts/orchestration-status.js --list
node scripts/orchestration-status.js --session my-feature --json
npm run orchestration:status
```

Summarize worker states, handoff summaries, and validation notes for the user.
