'use strict';

const os = require('os');
const path = require('path');

function homeDir(env = process.env) {
  return env.HOME || env.USERPROFILE || os.homedir() || '.';
}

function defaultDbPath(env = process.env) {
  return path.join(homeDir(env), '.claude', 'ecc2.db');
}

function defaultStateDbPath(env = process.env) {
  return path.join(homeDir(env), '.claude', 'ecc', 'state.db');
}

module.exports = {
  defaultDbPath,
  defaultStateDbPath,
  homeDir,
};
