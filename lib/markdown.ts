// General helpers for dealing with markdown files / content.
// All markdown content is processed using LF (`\n`) line endings. The desired
// end of line for each file is only applied when writing the file.

import { END_RULE_HEADER_MARKER, formatComment } from './comment-markers.js';
import type { Context } from './context.js';

/** Opening YAML frontmatter fence (`---` with optional trailing whitespace). */
const FRONTMATTER_OPENING_FENCE = /^---\s*$/u;

/** Closing YAML frontmatter fence (`---` or `...` with optional trailing whitespace). */
const FRONTMATTER_CLOSING_FENCE = /^(---|\.\.\.)\s*$/u;

/**
 * Find a YAML frontmatter block at the start of the file.
 * Only YAML `---` fences are supported (not TOML `+++` or JSON frontmatter).
 * @returns inclusive start/end line indexes, or undefined if not found
 */
function findFrontmatterRange(
  lines: readonly string[],
): { start: number; end: number } | undefined {
  const firstLine = lines[0];
  if (firstLine === undefined || !FRONTMATTER_OPENING_FENCE.test(firstLine)) {
    return undefined;
  }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && FRONTMATTER_CLOSING_FENCE.test(line)) {
      return { start: 0, end: i };
    }
  }
  return undefined;
}

export function extractFrontmatter(markdown: string) {
  const lines = markdown.split('\n');
  const range = findFrontmatterRange(lines);
  if (!range) {
    return undefined;
  }
  return lines.slice(range.start, range.end + 1).join('\n');
}

/**
 * Replace the frontmatter, if present.  If not and we have newFrontmatter to add, then add it at the beginning.
 * @param markdown - doc content
 * @param newFrontmatter - new frontmatter
 */
export function replaceOrCreateFrontmatter(
  markdown: string,
  newFrontmatter: string | undefined,
): string {
  // If we don't have any frontmatter coming in, then just return the original markdown
  if (!newFrontmatter) {
    return markdown;
  }

  const lines = markdown.split('\n');
  const range = findFrontmatterRange(lines);

  // If there's no valid existing frontmatter, just add it to the top.
  if (!range) {
    return [newFrontmatter, markdown].join('\n');
  }

  const postFrontmatter = lines.slice(range.end + 1).join('\n');
  return [newFrontmatter, postFrontmatter].join('\n');
}

/**
 * Replace the header of a doc up to and including the specified marker.
 * Insert at beginning if header doesn't exist.
 * @param markdown - doc content
 * @param newHeader - new header including marker
 * @param isMdx - is the file we're working on mdx or just regular md
 */
export function replaceOrCreateHeader(
  markdown: string,
  newHeader: string,
  isMdx: boolean,
) {
  const lines = markdown.split('\n');

  const titleLineIndex = lines.findIndex((line) => line.startsWith('# '));
  const markerLineIndex = lines.indexOf(
    formatComment(END_RULE_HEADER_MARKER, isMdx),
  );
  const dashesLineIndex1 = lines.indexOf('---');
  const dashesLineIndex2 = lines.indexOf('---', dashesLineIndex1 + 1);

  // Any YAML front matter or anything else above the title should be kept as-is ahead of the new header.
  const preHeader = lines
    .slice(0, Math.max(titleLineIndex, dashesLineIndex2 + 1))
    .join('\n');

  // Anything after the marker comment, title, or YAML front matter should be kept as-is after the new header.
  const postHeader = lines
    .slice(
      Math.max(markerLineIndex + 1, titleLineIndex + 1, dashesLineIndex2 + 1),
    )
    .join('\n');

  return `${preHeader ? `${preHeader}\n` : ''}${newHeader}\n${postHeader}`;
}

/**
 * Find the section most likely to be the top-level section for a given string.
 */
export function findSectionHeader(
  markdown: string,
  str: string,
): string | undefined {
  // Get all the matching strings.
  const regexp = new RegExp(`## .*${str}.*\n`, 'giu');
  const sectionPotentialMatches = [...markdown.matchAll(regexp)].map(
    (match) => match[0],
  );

  if (sectionPotentialMatches.length === 0) {
    // No section found.
    return undefined;
  }

  if (sectionPotentialMatches.length === 1) {
    // If there's only one match, we can assume it's the section.
    return sectionPotentialMatches[0];
  }

  // Otherwise assume the shortest match is the correct one.
  return sectionPotentialMatches.toSorted(
    (a: string, b: string) => a.length - b.length,
  )[0];
}

export function findFinalHeaderLevel(
  context: Context,
  str: string,
): number | undefined {
  const {
    options: { framework },
  } = context;

  const lines = str.split('\n');
  const finalHeader = lines
    .toReversed()
    .find((line) => line.match('^(#+) .+$'));

  if (finalHeader) {
    return finalHeader.indexOf(' ');
  }
  // If the framework is `starlight` and there's frontmatter at the top, treat that as an H1
  else if (framework === 'starlight' && extractFrontmatter(str)) {
    return 1;
  }

  return undefined;
}

/**
 * Ensure a doc contains (or doesn't contain) some particular content.
 * Upon failure, output the failure and set a failure exit code.
 * @param docName - name of doc for error message
 * @param contentName - name of content for error message
 * @param contents - the doc's contents
 * @param content - the content we are checking for
 * @param expected - whether the content should be present or not present
 */
export function expectContentOrFail(
  docName: string,
  contentName: string,
  contents: string,
  content: string,
  expected: boolean,
) {
  // Check for the content and also the versions of the content with escaped quotes
  // in case escaping is needed where the content is referenced.
  const hasContent =
    contents.includes(content) ||
    contents.includes(content.replaceAll('"', String.raw`\"`)) ||
    contents.includes(content.replaceAll("'", String.raw`\'`));
  if (hasContent !== expected) {
    console.error(
      `${docName} should ${
        /* istanbul ignore next -- TODO: test !expected or remove parameter */
        expected ? '' : 'not '
      }have included ${contentName}: ${content}`,
    );
    process.exitCode = 1;
  }
}

export function expectSectionHeaderOrFail(
  contentName: string,
  contents: string,
  possibleHeaders: readonly string[],
  expected: boolean,
) {
  const found = possibleHeaders.some((header) =>
    findSectionHeader(contents, header),
  );
  if (found !== expected) {
    if (possibleHeaders.length > 1) {
      console.error(
        `${contentName} should ${expected ? '' : 'not '}have included ${
          expected ? 'one' : 'any'
        } of these headers: ${possibleHeaders.join(', ')}`,
      );
    } else {
      console.error(
        `${contentName} should ${
          expected ? '' : 'not '
        }have included the header: ${possibleHeaders.join(', ')}`,
      );
    }

    process.exitCode = 1;
  }
}
