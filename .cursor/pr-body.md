## Summary

Adds MiniCord as a full-stack Discord-style chat app (React + Express/Socket.IO + Prisma/MongoDB) with JWT auth, real-time channel messaging, server/channel management, and direct-message infrastructure. Also integrates the ECC Cursor harness (hooks, observability CLI, skills/commands, CI) and documents agent workflows.

## Related artifacts

- TDD evidence: `.cursor/tdd/dm-user-chat.tdd.md`
- TDD evidence: `.cursor/tdd/delete-own-message.tdd.md`

## Test plan

- [ ] `cd backend && npm test`
- [ ] `cd frontend && npm test`
- [ ] `npm run test` (harness)
- [ ] Manual smoke (if UI/socket changes)

## Checklist

- [ ] No secrets or `.env` files committed
- [ ] Patterns match existing codebase
- [x] TDD evidence updated when behavior changed
