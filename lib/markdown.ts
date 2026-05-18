// General helpers for dealing with markdown files / content.

import { END_RULE_HEADER_MARKER, formatComment } from './comment-markers.js';
import type { Context } from './context.js';
import type { FRAMEWORK_TYPE } from './types.js';

export function extractFrontmatter(context: Context, markdown: string) {
  const { endOfLine } = context;
  const lines = markdown.split(endOfLine);
  const frontMatterStart = lines.indexOf('---');

  // Frontmatter must start at the beginning of the file to be considered valid, so if we don't find '---' at the beginning, we want to ignore it.
  if (frontMatterStart !== 0) {
    return undefined;
  }
  const frontMatterEnd = lines.indexOf('---', frontMatterStart + 1);
  if (frontMatterEnd !== -1) {
    return lines.slice(frontMatterStart, frontMatterEnd + 1).join(endOfLine);
  }
  return undefined;
}

/**
 * Replace the frontmatter, if present.  If not and we have newFrontmatter to add, then add it at the beginning.
 * @param context - execution context
 * @param markdown - doc content
 * @param newFrontmatter - new frontmatter
 */
export function replaceOrCreateFrontmatter(
  context: Context,
  markdown: string,
  newFrontmatter: string | undefined,
): string {
  // If we don't have any frontmatter coming in, then just return the original markdown
  if (!newFrontmatter) {
    return markdown;
  }

  const { endOfLine } = context;

  const lines = markdown.split(endOfLine);

  const frontmatterStartIndex = lines.indexOf('---');

  // If there's no existing frontmatter, just add it to the top.
  if (frontmatterStartIndex !== 0) {
    return [newFrontmatter, markdown].join(endOfLine);
  }

  const frontmatterEndIndex = lines.indexOf('---', frontmatterStartIndex + 1);
  const postFrontmatter = lines.slice(frontmatterEndIndex + 1).join(endOfLine);
  return [newFrontmatter, postFrontmatter].join(endOfLine);
}

/**
 * Replace the header of a doc up to and including the specified marker.
 * Insert at beginning if header doesn't exist.
 * @param context - execution context
 * @param markdown - doc content
 * @param newHeader - new header including marker
 * @param isMdx - is the file we're working on mdx or just regular md
 */
export function replaceOrCreateHeader(
  context: Context,
  markdown: string,
  newHeader: string,
  isMdx: boolean,
) {
  const { endOfLine } = context;

  const lines = markdown.split(endOfLine);

  const titleLineIndex = lines.findIndex((line) => line.startsWith('# '));
  const markerLineIndex = lines.indexOf(
    formatComment(END_RULE_HEADER_MARKER, isMdx),
  );
  const dashesLineIndex1 = lines.indexOf('---');
  const dashesLineIndex2 = lines.indexOf('---', dashesLineIndex1 + 1);

  // Any YAML front matter or anything else above the title should be kept as-is ahead of the new header.
  const preHeader = lines
    .slice(0, Math.max(titleLineIndex, dashesLineIndex2 + 1))
    .join(endOfLine);

  // Anything after the marker comment, title, or YAML front matter should be kept as-is after the new header.
  const postHeader = lines
    .slice(
      Math.max(markerLineIndex + 1, titleLineIndex + 1, dashesLineIndex2 + 1),
    )
    .join(endOfLine);

  return `${
    preHeader ? `${preHeader}${endOfLine}` : ''
  }${newHeader}${endOfLine}${postHeader}`;
}

/**
 * Find the section most likely to be the top-level section for a given string.
 */
export function findSectionHeader(
  context: Context,
  markdown: string,
  str: string,
): string | undefined {
  const { endOfLine } = context;

  // Get all the matching strings.
  const regexp = new RegExp(`## .*${str}.*${endOfLine}`, 'giu');
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
    endOfLine,
    options: { framework },
  } = context;

  const lines = str.split(endOfLine);
  const finalHeader = lines
    .toReversed()
    .find((line) => line.match('^(#+) .+$'));

  if (finalHeader) {
    return finalHeader.indexOf(' ');
  }
  // If the framework is `starlight` and there's frontmatter at the top, treat that as an H1
  else if (framework === 'starlight' && extractFrontmatter(context, str)) {
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
  context: Context,
  contentName: string,
  contents: string,
  possibleHeaders: readonly string[],
  expected: boolean,
) {
  const found = possibleHeaders.some((header) =>
    findSectionHeader(context, contents, header),
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
