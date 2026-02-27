// This file uses actual test fixtures on the file system.

import { generate } from '../../../lib/generator.js';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const FIXTURE_ROOT = join('test', 'fixtures'); // Relative to project root.

describe('generate (cjs)', function () {
  describe('basic', function () {
    it('generates the documentation', async function () {
      const FIXTURE_PATH = join(FIXTURE_ROOT, 'cjs');

      await generate(FIXTURE_PATH);

      expect(
        readFileSync(join(FIXTURE_PATH, 'README.md'), 'utf8'),
      ).toMatchSnapshot();

      expect(
        readFileSync(join(FIXTURE_PATH, 'docs/rules/no-foo.md'), 'utf8'),
      ).toMatchSnapshot();
    });
  });

  describe('plugin with minimal package.json', function () {
    it('loads correctly', async function () {
      const FIXTURE_PATH = join(FIXTURE_ROOT, 'cjs-missing-main');
      await expect(generate(FIXTURE_PATH)).resolves.toBeUndefined();
    });
  });

  describe('package.json `main` field points to directory', function () {
    it('finds entry point', async function () {
      const FIXTURE_PATH = join(FIXTURE_ROOT, 'cjs-main-directory');
      await expect(generate(FIXTURE_PATH)).resolves.toBeUndefined();
    });
  });

  describe('config that extends another config', function () {
    it('generates the documentation', async function () {
      const FIXTURE_PATH = join(FIXTURE_ROOT, 'cjs-config-extends');
      await generate(FIXTURE_PATH);
      expect(
        readFileSync(join(FIXTURE_PATH, 'README.md'), 'utf8'),
      ).toMatchSnapshot();
      expect(
        readFileSync(join(FIXTURE_PATH, 'docs/rules/no-foo.md'), 'utf8'),
      ).toMatchSnapshot();
      expect(
        readFileSync(join(FIXTURE_PATH, 'docs/rules/no-bar.md'), 'utf8'),
      ).toMatchSnapshot();
      expect(
        readFileSync(join(FIXTURE_PATH, 'docs/rules/no-baz.md'), 'utf8'),
      ).toMatchSnapshot();
      expect(
        readFileSync(join(FIXTURE_PATH, 'docs/rules/no-biz.md'), 'utf8'),
      ).toMatchSnapshot();
    });
  });

  describe('package.json `main` field points to non-existent file', function () {
    it('throws an error', async function () {
      const FIXTURE_PATH = join(FIXTURE_ROOT, 'cjs-main-file-does-not-exist');
      await expect(generate(FIXTURE_PATH)).rejects.toThrow(
        /Cannot find module/u,
      );
    });
  });
});
