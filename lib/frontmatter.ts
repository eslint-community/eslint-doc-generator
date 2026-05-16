import type { Context } from './context.js';
import { makeRuleDocTitle } from './rule-doc-title.js';

function formatFrontmatterProperty(key: string, value: string): string {
  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', String.raw`\"`);
  return `${key}: "${escaped}"`;
}

/**
 * Generate yml frontmatter for a particular rule.
 * @returns new frontmatter lines (including ---)
 */
export function generateFrontmatterLines(
  context: Context,
  name: string,
  description: string | undefined,
  frontmatterOld: string | undefined,
): string {
  const {
    endOfLine,
    options: { framework },
  } = context;
  const title = makeRuleDocTitle(context, name, description);

  const oldFrontmatterLines = frontmatterOld
    ? frontmatterOld.split(endOfLine)
    : [];

  // If the framework is 'none', then just bail out and return the old frontmatter.
  // We don't want to change anything.
  if (framework === 'none') {
    return oldFrontmatterLines.join(endOfLine);
  }

  // If there is currently no frontmatter, then create a new one with the title and description.
  if (oldFrontmatterLines.length === 0) {
    const newFrontmatter = ['---', formatFrontmatterProperty('title', title)];
    if (description) {
      newFrontmatter.push(
        formatFrontmatterProperty('description', description),
      );
    }
    newFrontmatter.push('---');
    return newFrontmatter.join(endOfLine);
  }

  const newFrontmatter = [];
  let titleSeen = false;
  let descriptionSeen = false;
  for (const line of oldFrontmatterLines) {
    if (line.startsWith('title:')) {
      newFrontmatter.push(formatFrontmatterProperty('title', title));
      titleSeen = true;
    } else if (line.startsWith('description:') && description) {
      newFrontmatter.push(
        formatFrontmatterProperty('description', description),
      );
      descriptionSeen = true;
    } else {
      newFrontmatter.push(line);
    }
  }

  // If the old frontmatter didn't have a 'title', then add it to the beginning of the frontmatter (after the opening ---).
  if (!titleSeen) {
    newFrontmatter.splice(1, 0, formatFrontmatterProperty('title', title));
  }
  // If the old frontmatter didn't have a 'description' but we have one, then add it after the title.
  if (description && !descriptionSeen) {
    const titleIndex = newFrontmatter.findIndex((line) =>
      line.startsWith('title:'),
    );
    newFrontmatter.splice(
      titleIndex + 1,
      0,
      formatFrontmatterProperty('description', description),
    );
  }
  return newFrontmatter.join(endOfLine);
}
