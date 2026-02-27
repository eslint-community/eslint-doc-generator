import type { Context } from './context.js';

export function toSentenceCase(str: string) {
  return str.replace(/^\w/u, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export function addTrailingPeriod(str: string) {
  return str.replace(/\.?$/u, '.');
}

export function removeTrailingPeriod(str: string) {
  return str.replace(/\.$/u, '');
}

/**
 * Example: FOO => Foo, foo => Foo
 */
export function capitalizeOnlyFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function sanitizeMarkdownTableCell(context: Context, text: string): string {
  const { endOfLine } = context;

  return text
    .replaceAll('|', String.raw`\|`)
    .replaceAll(new RegExp(endOfLine, 'gu'), '<br/>');
}

export function sanitizeMarkdownTable(
  context: Context,
  text: readonly (readonly string[])[],
): readonly (readonly string[])[] {
  return text.map((row) =>
    row.map((col) => sanitizeMarkdownTableCell(context, col)),
  );
}
