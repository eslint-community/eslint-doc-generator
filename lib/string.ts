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

/**
 * Neutralize characters that would be parsed as JSX / expressions in MDX.
 * `{` must be replaced before `<` so the braces introduced for `<` are not
 * re-escaped.
 */
function sanitizeMdxText(text: string): string {
  return text.replaceAll('{', "{'{'}").replaceAll('<', "{'<'}");
}

/**
 * Strip embedded newlines so an interpolated value cannot fork an ATX heading.
 */
export function sanitizeMarkdownHeading(text: string): string {
  return text.replaceAll(/\r?\n/gu, '');
}

function sanitizeMarkdownTableCell(text: string, isMdx: boolean): string {
  // Handle CRLF line endings too since cell text can come from rule metadata.
  // Escape MDX-sensitive characters before inserting `<br/>` so the break tag
  // itself is not neutralized.
  let result = text.replaceAll('|', String.raw`\|`);
  if (isMdx) {
    result = sanitizeMdxText(result);
  }
  return result.replaceAll(/\r?\n/gu, '<br/>');
}

export function sanitizeMarkdownTable(
  text: readonly (readonly string[])[],
  isMdx = false,
): readonly (readonly string[])[] {
  return text.map((row) =>
    row.map((col) => sanitizeMarkdownTableCell(col, isMdx)),
  );
}
