/** Uppercase the first character of a string, leaving the rest unchanged. */
function upperFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toSentenceCase(str: string) {
  // Only uppercase a leading word character, leaving the rest of the string as-is.
  return str.replace(/^\w/u, (char) => char.toUpperCase());
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
  return upperFirst(str.toLowerCase());
}

function sanitizeMarkdownTableCell(text: string): string {
  // Handle CRLF line endings too since cell text can come from rule metadata.
  return text.replaceAll('|', String.raw`\|`).replaceAll(/\r?\n/gu, '<br/>');
}

export function sanitizeMarkdownTable(
  text: readonly (readonly string[])[],
): readonly (readonly string[])[] {
  return text.map((row) => row.map((col) => sanitizeMarkdownTableCell(col)));
}
