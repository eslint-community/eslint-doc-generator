import { EOL } from 'node:os';
import { resolve } from 'node:path';
import editorconfig from 'editorconfig';
import type { Cache as EditorConfigCache } from 'editorconfig';

type EndOfLine = '\n' | '\r\n';

type EditorConfigLineEndingProps = {
  endOfLine: EndOfLine | undefined;
  insertFinalNewline: boolean | undefined;
};

export type EndOfLineResolver = {
  /** EditorConfig `end_of_line` for the file path, if set. */
  getExplicitEndOfLine: (filePath: string) => Promise<EndOfLine | undefined>;
  /** EditorConfig `insert_final_newline` for the file path, if set. */
  getInsertFinalNewline: (filePath: string) => Promise<boolean | undefined>;
  /**
   * Write-time precedence: EditorConfig → detect(contents) → `os.EOL`.
   * New/empty docs pass `contents` as undefined (skip detection).
   */
  resolve: (
    filePath: string,
    contents: string | undefined,
  ) => Promise<EndOfLine>;
};

/**
 * Create a memoized end-of-line resolver scoped to one `generate()` run.
 * Cache keys are absolute file paths so sibling `.md`/`.mdx` files can differ.
 *
 * Write-time precedence for `resolve()`:
 * 1. Explicit EditorConfig `end_of_line`
 * 2. Predominant end of line in existing contents (skip when `contents` is undefined)
 * 3. `os.EOL`
 *
 * Prettier config is not read — run Prettier via `postprocess` if needed.
 */
export function createEndOfLineResolver(): EndOfLineResolver {
  const propsCache = new Map<string, Promise<EditorConfigLineEndingProps>>();
  /** Shared across files so EditorConfig does not re-read the same files. */
  const editorConfigFileCache: EditorConfigCache = new Map();

  function getEditorConfigLineEndingProps(
    filePath: string,
  ): Promise<EditorConfigLineEndingProps> {
    const absolutePath = resolve(filePath);
    let cached = propsCache.get(absolutePath);
    if (!cached) {
      cached = parseEditorConfigLineEndingProps(
        absolutePath,
        editorConfigFileCache,
      );
      propsCache.set(absolutePath, cached);
    }
    return cached;
  }

  async function getExplicitEndOfLine(
    filePath: string,
  ): Promise<EndOfLine | undefined> {
    const props = await getEditorConfigLineEndingProps(filePath);
    return props.endOfLine;
  }

  async function getInsertFinalNewline(
    filePath: string,
  ): Promise<boolean | undefined> {
    const props = await getEditorConfigLineEndingProps(filePath);
    return props.insertFinalNewline;
  }

  async function resolveFileEndOfLine(
    filePath: string,
    contents: string | undefined,
  ): Promise<EndOfLine> {
    return (
      (await getExplicitEndOfLine(filePath)) ??
      (contents === undefined ? undefined : detectEndOfLine(contents)) ??
      getFallbackEndOfLine()
    );
  }

  return {
    getExplicitEndOfLine,
    getInsertFinalNewline,
    resolve: resolveFileEndOfLine,
  };
}

async function parseEditorConfigLineEndingProps(
  filePath: string,
  cache: EditorConfigCache,
): Promise<EditorConfigLineEndingProps> {
  const editorConfigProps = await editorconfig.parse(filePath, { cache });

  let endOfLine: EndOfLine | undefined;
  if (editorConfigProps.end_of_line === 'lf') {
    endOfLine = '\n';
  } else if (editorConfigProps.end_of_line === 'crlf') {
    endOfLine = '\r\n';
  }

  let insertFinalNewline: boolean | undefined;
  if (editorConfigProps.insert_final_newline === true) {
    insertFinalNewline = true;
  } else if (editorConfigProps.insert_final_newline === false) {
    insertFinalNewline = false;
  }

  return { endOfLine, insertFinalNewline };
}

const UTF8_BOM = '\uFEFF';

/**
 * Detect and strip a leading UTF-8 BOM for processing.
 * Markdown is processed BOM-free; restore with {@link restoreBom} at write time.
 */
export function stripBom(contents: string): {
  hasBom: boolean;
  contents: string;
} {
  if (contents.startsWith(UTF8_BOM)) {
    return { hasBom: true, contents: contents.slice(UTF8_BOM.length) };
  }
  return { hasBom: false, contents };
}

/**
 * Re-prepend a UTF-8 BOM when the original file had one.
 * Call after EOL normalization and `insert_final_newline` policy.
 */
export function restoreBom(contents: string, hasBom: boolean): string {
  return hasBom ? `${UTF8_BOM}${contents}` : contents;
}

/**
 * Apply EditorConfig `insert_final_newline` at write time.
 * When unset (`undefined`), returns contents unchanged.
 */
export function applyInsertFinalNewline(
  contents: string,
  endOfLine: string,
  insertFinalNewline: boolean | undefined,
): string {
  if (insertFinalNewline === undefined) {
    return contents;
  }

  if (insertFinalNewline) {
    // Append one trailing EOL if absent; never trim existing trailing blank lines.
    if (contents.endsWith(endOfLine)) {
      return contents;
    }
    return contents + endOfLine;
  }

  // false: strip trailing EOLs so the file does not end with a newline.
  let result = contents;
  while (result.endsWith(endOfLine)) {
    result = result.slice(0, -endOfLine.length);
  }
  return result;
}

/**
 * Detect the predominant end of line in the given file contents.
 * Returns undefined if the contents have no line breaks.
 */
export function detectEndOfLine(contents: string): EndOfLine | undefined {
  const crlfCount = contents.split('\r\n').length - 1;
  // All LFs minus those that are part of a CRLF.
  const lfCount = contents.split('\n').length - 1 - crlfCount;

  if (crlfCount === 0 && lfCount === 0) {
    return undefined;
  }

  // A tie favors LF.
  return crlfCount > lfCount ? '\r\n' : '\n';
}

/**
 * Convert all line endings in the given contents to the given end of line.
 */
export function normalizeEndOfLine(
  contents: string,
  endOfLine: string,
): string {
  return contents.replaceAll(/\r\n|[\r\n]/gu, endOfLine);
}

/** Fallback when there is no config and no detectable end of line. */
export function getFallbackEndOfLine(): EndOfLine {
  return getNodeEOL();
}

/* istanbul ignore next */
/** `EOL` is typed as `string`, so we perform run-time validation to be safe. */
function getNodeEOL(): EndOfLine {
  if (EOL === '\n' || EOL === '\r\n') {
    return EOL;
  }

  throw new Error(
    `Failed to detect the end-of-line constant from the JavaScript runtime: ${EOL}`,
  );
}
