# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main`  | Yes       |

## Reporting a vulnerability

Do **not** open a public issue for security-sensitive findings.

1. Email the maintainers privately with a description, reproduction steps, and impact.
2. Allow reasonable time for a fix before disclosure.

## Project expectations

- Secrets live in environment variables (`.env` is gitignored; use `.env.example` as reference).
- JWT auth on REST and Socket.IO connections.
- Input validation at API and socket boundaries.
- Run `/security-scan` before releases when changing auth or hooks.

## Dependency updates

Dependabot is configured under `.github/dependabot.yml` for npm ecosystems.
