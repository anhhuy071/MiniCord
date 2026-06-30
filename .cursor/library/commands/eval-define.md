---
description: Define a new eval spec and grader under .claude/evals/
---

# /eval define

Create eval artifacts:

```bash
node scripts/eval-runner.js define <eval-id>
```

Creates `.claude/evals/capability/<eval-id>.md`, grader script, and manifest entry.
