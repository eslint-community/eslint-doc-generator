import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

// TODO: Replace with `cp` from 'node:fs/promises' when minimum Node.js version is 22.3.0+
/** Recursively copy a directory (using stable Node.js APIs) */
async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stats = await stat(srcPath);
    await (stats.isDirectory()
      ? copyDir(srcPath, destPath)
      : copyFile(srcPath, destPath));
  }
}

export interface SetupFixtureOptions {
  /** Name of the fixture directory in test/fixtures/ (e.g., 'esm-base') */
  fixture: string;
  /** Optional file overrides: path relative to fixture root -> content (string or object to JSON.stringify) */
  overrides?: Record<string, string | object>;
}

export interface FixtureContext {
  /** Absolute path to the temp directory containing the fixture */
  path: string;
  /** Clean up the temp directory */
  cleanup: () => Promise<void>;
  /** Read a file from the fixture (relative path) */
  readFile: (relativePath: string) => Promise<string>;
}

/**
 * Set up a test fixture by copying it to a unique temp directory.
 * Supports inline file overrides for test-specific modifications.
 */
export async function setupFixture(
  options: SetupFixtureOptions,
): Promise<FixtureContext> {
  const { fixture, overrides } = options;
  const sourceDir = join(FIXTURES_DIR, fixture);

  // Create a unique temp directory
  const tempDir = await mkdtemp(join(tmpdir(), 'eslint-doc-generator-test-'));

  // Copy the fixture to temp directory
  await copyDir(sourceDir, tempDir);

  // Apply any overrides
  if (overrides) {
    for (const [relativePath, content] of Object.entries(overrides)) {
      const filePath = join(tempDir, relativePath);
      // Ensure parent directory exists
      await mkdir(dirname(filePath), { recursive: true });
      const fileContent =
        typeof content === 'string' ? content : JSON.stringify(content);
      await writeFile(filePath, fileContent, 'utf8');
    }
  }

  return {
    path: tempDir,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
    // eslint-disable-next-line require-await
    readFile: async (relativePath: string) => {
      return readFile(join(tempDir, relativePath), 'utf8');
    },
  };
}
