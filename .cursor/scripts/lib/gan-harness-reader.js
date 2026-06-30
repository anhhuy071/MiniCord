'use strict';

const fs = require('fs');
const path = require('path');

function readGanHarnessState(cwd = process.cwd()) {
  const root = path.join(cwd, 'gan-harness');
  if (!fs.existsSync(root)) {
    return { exists: false, root, iterations: [], latestScore: null, plateau: false };
  }

  const feedbackDir = path.join(root, 'feedback');
  const iterations = [];
  if (fs.existsSync(feedbackDir)) {
    for (const file of fs.readdirSync(feedbackDir).filter(name => /^feedback-\d+\.md$/i.test(name)).sort()) {
      const content = fs.readFileSync(path.join(feedbackDir, file), 'utf8');
      const scoreMatch = content.match(/(?:total|weighted)[^\d]*(\d+(?:\.\d+)?)/i);
      iterations.push({
        file,
        score: scoreMatch ? Number(scoreMatch[1]) : null,
      });
    }
  }

  const scores = iterations.map(item => item.score).filter(score => score !== null);
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;
  const plateau = scores.length >= 3
    && scores.slice(-3).every(score => score === scores[scores.length - 1]);

  return {
    exists: true,
    root,
    hasSpec: fs.existsSync(path.join(root, 'spec.md')),
    hasRubric: fs.existsSync(path.join(root, 'eval-rubric.md')),
    iterations,
    iterationCount: iterations.length,
    latestScore,
    plateau,
  };
}

module.exports = { readGanHarnessState };
