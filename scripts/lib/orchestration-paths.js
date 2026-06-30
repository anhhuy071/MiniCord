'use strict';

const fs = require('fs');
const path = require('path');

function resolveCoordinationRoot(cwd = process.cwd(), env = process.env) {
  if (env.ECC_ORCHESTRATION_ROOT && String(env.ECC_ORCHESTRATION_ROOT).trim()) {
    return path.resolve(String(env.ECC_ORCHESTRATION_ROOT).trim());
  }

  const repoRoot = path.resolve(cwd);
  const primary = path.join(repoRoot, '.orchestration');
  const fallback = path.join(repoRoot, '.claude', 'orchestration');

  if (fs.existsSync(primary)) {
    return primary;
  }
  if (fs.existsSync(fallback)) {
    return fallback;
  }
  return primary;
}

function resolveSessionCoordinationDir(sessionName, cwd = process.cwd(), env = process.env) {
  return path.join(resolveCoordinationRoot(cwd, env), sessionName);
}

function listOrchestrationSessions(cwd = process.cwd(), env = process.env) {
  const root = resolveCoordinationRoot(cwd, env);
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => {
      const sessionDir = path.join(root, name);
      try {
        return fs.readdirSync(sessionDir).some(child => {
          const workerDir = path.join(sessionDir, child);
          return fs.statSync(workerDir).isDirectory()
            && ['status.md', 'task.md', 'handoff.md'].some(file => fs.existsSync(path.join(workerDir, file)));
        });
      } catch {
        return false;
      }
    })
    .sort();
}

module.exports = {
  listOrchestrationSessions,
  resolveCoordinationRoot,
  resolveSessionCoordinationDir,
};
