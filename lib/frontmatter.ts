import {
  Document,
  Pair,
  Scalar,
  isMap,
  isScalar,
  parseDocument,
  type YAMLMap,
} from 'yaml';
import type { Context } from './context.js';
import { makeRuleDocTitle } from './rule-doc-title.js';

/** Create a double-quoted YAML scalar (matches prior frontmatter quoting style). */
function quotedScalar(doc: Document, value: string): Scalar {
  const node = doc.createNode(value);
  if (isScalar(node)) {
    node.type = Scalar.QUOTE_DOUBLE;
    return node;
  }
  const scalar = new Scalar(value);
  scalar.type = Scalar.QUOTE_DOUBLE;
  return scalar;
}

function ensureMap(doc: Document): YAMLMap {
  if (isMap(doc.contents)) {
    return doc.contents;
  }
  const map = doc.createNode({});
  if (!isMap(map)) {
    throw new TypeError('Expected YAML map for frontmatter');
  }
  // Document.contents is the mutable AST root for round-tripping.
  // eslint-disable-next-line no-param-reassign -- yaml Document API
  doc.contents = map;
  return map;
}

function keyEquals(pair: Pair, key: string): boolean {
  return isScalar(pair.key) && pair.key.value === key;
}

/**
 * Set a top-level frontmatter string property via the YAML Document API so
 * unrelated keys/comments keep their existing formatting.
 */
function setFrontmatterString(
  doc: Document,
  key: 'title' | 'description',
  value: string,
): void {
  const map = ensureMap(doc);
  const valueNode = quotedScalar(doc, value);

  if (doc.has(key)) {
    doc.set(key, valueNode);
    return;
  }

  const pair = new Pair(doc.createNode(key), valueNode);
  if (key === 'title') {
    // Match prior behavior: insert missing title at the top of the map.
    map.items.unshift(pair);
    return;
  }

  const titleIndex = map.items.findIndex((item) => keyEquals(item, 'title'));
  if (titleIndex === -1) {
    map.items.unshift(pair);
  } else {
    map.items.splice(titleIndex + 1, 0, pair);
  }
}

function serializeFrontmatterDocument(
  doc: Document,
  openingFence: string,
  closingFence: string,
): string {
  const body = doc.toString({ lineWidth: 0 }).replace(/\n$/u, '');
  if (body === '') {
    return `${openingFence}\n${closingFence}`;
  }
  return `${openingFence}\n${body}\n${closingFence}`;
}

/**
 * Generate yml frontmatter for a particular rule.
 * Only YAML frontmatter (`---` … `---` / `...`) is supported; TOML `+++` and
 * JSON frontmatter are not.
 * @returns new frontmatter lines (including ---)
 */
export function generateFrontmatterLines(
  context: Context,
  name: string,
  description: string | undefined,
  frontmatterOld: string | undefined,
): string {
  const {
    options: { framework },
  } = context;
  const title = makeRuleDocTitle(context, name, description);

  // If the framework is 'none', then just bail out and return the old frontmatter.
  // We don't want to change anything.
  if (framework === 'none') {
    return frontmatterOld ?? '';
  }

  // If there is currently no frontmatter, then create a new one with the title and description.
  if (!frontmatterOld) {
    const doc = new Document();
    ensureMap(doc);
    setFrontmatterString(doc, 'title', title);
    if (description) {
      setFrontmatterString(doc, 'description', description);
    }
    return serializeFrontmatterDocument(doc, '---', '---');
  }

  const lines = frontmatterOld.split('\n');
  const openingFence = lines[0] ?? '---';
  const closingFence = lines.at(-1) ?? '---';
  const body = lines.slice(1, -1).join('\n');

  const doc = parseDocument(body);
  setFrontmatterString(doc, 'title', title);
  if (description) {
    setFrontmatterString(doc, 'description', description);
  }
  return serializeFrontmatterDocument(doc, openingFence, closingFence);
}
