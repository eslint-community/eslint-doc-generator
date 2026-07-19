#!/usr/bin/env node
/* eslint n/hashbang:"off" -- shebang needed so compiled code gets interpreted as JS */
//
// rule was renamed in https://github.com/eslint-community/eslint-plugin-n/releases/tag/v17.0.0
// from n/shebang to n/hashbang

import { printCliError, run } from '../lib/cli.js';
import { generate } from '../lib/generator.js';

try {
  await run(process.argv, (path, options) => generate(path, options));
} catch (error: unknown) {
  printCliError(error);
  process.exitCode = 1;
}
