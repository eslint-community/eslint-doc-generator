// General helpers for dealing with markdown files / content.
// All markdown content is processed using LF (`\n`) line endings. The desired
// end of line for each file is only applied when writing the file.

import { END_RULE_HEADER_MARKER, formatComment } from './comment-markers.js';
import type { Context } from './context.js';
import { escapeRegExp } from './string.js';

export function extractFrontmatter(markdown: string) {
  const lines = markdown.split('\n');
  const frontMatterStart = lines.indexOf('---');

  // Frontmatter must start at the beginning of the file to be considered valid, so if we don't find '---' at the beginning, we want to ignore it.
  if (frontMatterStart !== 0) {
    return undefined;
  }
  const frontMatterEnd = lines.indexOf('---', frontMatterStart + 1);
  if (frontMatterEnd !== -1) {
    return lines.slice(frontMatterStart, frontMatterEnd + 1).join('\n');
  }
  return undefined;
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

  const frontmatterStartIndex = lines.indexOf('---');

  // If there's no existing frontmatter, just add it to the top.
  if (frontmatterStartIndex !== 0) {
    return [newFrontmatter, markdown].join('\n');
  }

  const frontmatterEndIndex = lines.indexOf('---', frontmatterStartIndex + 1);
  const postFrontmatter = lines.slice(frontmatterEndIndex + 1).join('\n');
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
 * CommonMark ATX heading: 0–3 leading spaces, 1–6 `#`, whitespace, text, optional closing hashes.
 * Operates on LF-normalized lines.
 */
const ATX_HEADING_REGEX = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/u;

function parseAtxHeading(
  line: string,
): { level: number; text: string } | undefined {
  const match = ATX_HEADING_REGEX.exec(line);
  const hashes = match?.[1];
  const text = match?.[2];
  if (!hashes || text === undefined) {
    return undefined;
  }
  return { level: hashes.length, text };
}

/**
 * Find the section most likely to be the top-level section for a given string.
 * Prefers level-2 ATX headings, then falls back to other levels; among ties, picks the shortest.
 */
export function findSectionHeader(
  markdown: string,
  str: string,
): string | undefined {
  const lines = markdown.split('\n');
  const needle = new RegExp(escapeRegExp(str), 'iu');
  const matches: { header: string; level: number }[] = [];

  for (const [i, line] of lines.entries()) {
    const heading = parseAtxHeading(line);
    if (!heading || !needle.test(heading.text)) {
      continue;
    }
    // Preserve whether this line had a trailing newline in the source.
    const header = i < lines.length - 1 ? `${line}\n` : line;
    matches.push({ header, level: heading.level });
  }

  if (matches.length === 0) {
    return undefined;
  }

  const level2Matches = matches.filter(({ level }) => level === 2);
  const candidates = level2Matches.length > 0 ? level2Matches : matches;

  // Otherwise assume the shortest match is the correct one.
  return candidates.toSorted((a, b) => a.header.length - b.header.length)[0]
    ?.header;
}

export function findFinalHeaderLevel(
  context: Context,
  str: string,
): number | undefined {
  const {
    options: { framework },
  } = context;

  const lines = str.split('\n');
  for (const line of lines.toReversed()) {
    const heading = parseAtxHeading(line);
    if (heading) {
      return heading.level;
    }
  }

  // If the framework is `starlight` and there's frontmatter at the top, treat that as an H1
  if (framework === 'starlight' && extractFrontmatter(str)) {
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
