import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { getAllNamedOptions, hasOptions } from './rule-options.js';
import {
  getPluginRoot,
  getPathWithExactFileNameCasing,
} from './package-json.js';
import { updateRulesList } from './rule-list.js';
import { updateConfigsList } from './config-list.js';
import { generateRuleHeaderLines } from './rule-doc-notices.js';
import {
  BEGIN_RULE_OPTIONS_LIST_MARKER,
  END_RULE_OPTIONS_LIST_MARKER,
  formatComment,
} from './comment-markers.js';
import {
  extractFrontmatter,
  replaceOrCreateHeader,
  expectContentOrFail,
  expectSectionHeaderOrFail,
  replaceOrCreateFrontmatter,
} from './markdown.js';
import { diff } from 'jest-diff';
import type { GenerateOptions, RuleModule } from './types.js';
import { replaceRulePlaceholder } from './rule-link.js';
import { updateRuleOptionsList } from './rule-options-list.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { getContext } from './context.js';
import { createEndOfLineResolver, normalizeEndOfLine } from './eol.js';
import { generateSuggestedEmojis } from './suggest-emojis.js';
import { generateFrontmatterLines } from './frontmatter.js';
import { sanitizeMarkdownHeading } from './string.js';

function isMdx(path: string): boolean {
  return extname(path).toLowerCase() === '.mdx';
}

function resolveDocPath(configuredPath: string): string | undefined {
  if (existsSync(configuredPath)) {
    return configuredPath;
  }

  // If the configured path ends in .md, see if an .mdx version exists
  if (configuredPath.endsWith('.md')) {
    const mdxPath = configuredPath.replace(/\.md$/iu, '.mdx');
    if (existsSync(mdxPath)) {
      return mdxPath;
    }
  }

  // If the configured path ends in .mdx, see if an .md version exists
  if (configuredPath.endsWith('.mdx')) {
    const mdPath = configuredPath.replace(/\.mdx$/iu, '.md');
    if (existsSync(mdPath)) {
      return mdPath;
    }
  }

  // If neither exist, return nothing.  The configured path will be created if `--init-rule-docs` is enabled.
  return undefined;
}

// eslint-disable-next-line complexity
export async function generate(path: string, userOptions?: GenerateOptions) {
  const context = await getContext(path, userOptions);
  const { options, plugin } = context;
  const endOfLineResolver = createEndOfLineResolver();

  // Markdown is processed with LF internally; each file's write end of line
  // comes from `endOfLineResolver` (see `lib/eol.ts`).

  // Destructure options that are only used in this function. Other options are passed around using
  // the "context" object.
  const {
    check,
    ignoreDeprecatedRules,
    initRuleDocs,
    suggestEmojis,
    pathRuleDoc,
    pathRuleList,
    postprocess,
    ruleDocSectionExclude,
    ruleDocSectionInclude: ruleDocSectionIncludeRaw,
    ruleDocSectionOptions,
  } = options;

  // Strip embedded newlines so init headings and section checks stay aligned.
  const ruleDocSectionInclude = ruleDocSectionIncludeRaw.map((title) =>
    sanitizeMarkdownHeading(title),
  );

  if (suggestEmojis) {
    await generateSuggestedEmojis(context);
    return;
  }

  if (!plugin.rules) {
    throw new Error('Could not find exported `rules` object in ESLint plugin.');
  }

  // Gather the normalized list of rules.
  const ruleNamesAndRules = Object.entries(plugin.rules)
    .map(([name, ruleModule]) => {
      // Convert deprecated function-style rules to object-style rules so that we don't have to handle function-style rules everywhere throughout the codebase.
      // @ts-expect-error -- this type unfortunately requires us to choose a `meta.type` even though the deprecated function-style rule won't have one.
      const ruleModuleAsObject: RuleModule =
        typeof ruleModule === 'function'
          ? {
              // Deprecated function-style rule don't support most of the properties that object-style rules support, so we'll just use the bare minimum.
              meta: {
                // @ts-expect-error -- type is missing for this property
                schema: ruleModule.schema, // eslint-disable-line @typescript-eslint/no-unsafe-assignment -- type is missing for this property
                // @ts-expect-error -- type is missing for this property
                deprecated: ruleModule.deprecated, // eslint-disable-line @typescript-eslint/no-unsafe-assignment -- type is missing for this property
              },
              create: ruleModule,
            }
          : ruleModule;
      const tuple: [string, RuleModule] = [name, ruleModuleAsObject];
      return tuple;
    })
    .filter(
      // Filter out deprecated rules from being checked, displayed, or updated if the option is set.
      ([, rule]) => !ignoreDeprecatedRules || !rule.meta?.deprecated,
    )
    .toSorted(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // Update rule doc for each rule.
  let initializedRuleDoc = false;
  for (const [name, rule] of ruleNamesAndRules) {
    const schema = rule.meta?.schema;
    const metaDefaultOptions = rule.meta?.defaultOptions;
    const description = rule.meta?.docs?.description;
    const pathCurrentPage = replaceRulePlaceholder(pathRuleDoc, name);
    const configuredPathToDoc = join(path, pathCurrentPage);
    let pathToDoc = resolveDocPath(configuredPathToDoc);
    const ruleHasOptions = hasOptions(schema);

    if (!pathToDoc) {
      if (!initRuleDocs) {
        throw new Error(
          `Could not find rule doc (run with --init-rule-docs to create): ${relative(
            getPluginRoot(path),
            configuredPathToDoc,
          )}`,
        );
      }

      pathToDoc = configuredPathToDoc;

      // Determine content for fresh rule doc, including any mandatory sections.
      // The rule doc header will be added later.
      const isRuleDocMdx = isMdx(pathToDoc);
      let newRuleDocContents = [
        ruleDocSectionInclude.length > 0
          ? ruleDocSectionInclude.map((title) => `## ${title}`).join('\n\n')
          : undefined,
        /* istanbul ignore next -- both branches tested but coverage has instrumentation issue with ternary in array */
        ruleHasOptions
          ? `## Options\n\n${formatComment(BEGIN_RULE_OPTIONS_LIST_MARKER, isRuleDocMdx)}\n${formatComment(END_RULE_OPTIONS_LIST_MARKER, isRuleDocMdx)}`
          : undefined,
      ]
        .filter((section) => section !== undefined)
        .join('\n\n');
      /* istanbul ignore next -- V8 branch coverage doesn't detect this branch is tested */
      if (newRuleDocContents !== '') {
        newRuleDocContents = `\n${newRuleDocContents}\n`;
      }

      await mkdir(dirname(pathToDoc), { recursive: true });
      const newDocEndOfLine = await endOfLineResolver.resolve(
        pathToDoc,
        undefined,
      );
      await writeFile(
        pathToDoc,
        normalizeEndOfLine(newRuleDocContents, newDocEndOfLine),
      );
      initializedRuleDoc = true;
    }

    const isRuleDocMdx = isMdx(pathToDoc);
    const contentsOld = await readFile(pathToDoc, 'utf8');

    // Normalize to LF for processing; restore this file's end of line before write.
    const endOfLine = await endOfLineResolver.resolve(pathToDoc, contentsOld);
    const contentsOldNormalized = normalizeEndOfLine(contentsOld, '\n');

    const frontmatterOld = extractFrontmatter(contentsOldNormalized);

    // Regenerate the header (title/notices) and frontmatter of each rule doc.
    const newHeaderLines = generateRuleHeaderLines(
      context,
      description,
      name,
      isRuleDocMdx,
    );
    const newFrontmatterLines = generateFrontmatterLines(
      context,
      name,
      description,
      frontmatterOld,
    );

    // Generate the new content for the rule doc by replacing the header and frontmatter, and updating the rule options list if necessary.
    let contentsNew = replaceOrCreateFrontmatter(
      contentsOldNormalized,
      newFrontmatterLines,
    );
    contentsNew = replaceOrCreateHeader(
      contentsNew,
      newHeaderLines,
      isRuleDocMdx,
    );
    contentsNew = updateRuleOptionsList(contentsNew, rule, isRuleDocMdx);

    // Convert to the doc's end of line before postprocessing and writing.
    contentsNew = normalizeEndOfLine(contentsNew, endOfLine);
    contentsNew = await postprocess(contentsNew, resolve(pathToDoc));

    // LF-normalized copy of the final contents for the content checks below.
    const contentsNewNormalized = normalizeEndOfLine(contentsNew, '\n');

    if (check) {
      /* istanbul ignore next -- V8 branch coverage doesn't detect this branch is tested */
      if (contentsNew !== contentsOld) {
        console.error(
          `Please run eslint-doc-generator. A rule doc is out-of-date: ${relative(
            getPluginRoot(path),
            pathToDoc,
          )}`,
        );
        console.error(diff(contentsNew, contentsOld, { expand: false }));
        process.exitCode = 1;
      }
    } else {
      await writeFile(pathToDoc, contentsNew);
    }

    // Check for potential issues with the rule doc.

    // Check for required sections.
    for (const section of ruleDocSectionInclude) {
      expectSectionHeaderOrFail(
        `\`${name}\` rule doc`,
        contentsNewNormalized,
        [section],
        true,
      );
    }

    // Check for disallowed sections.
    for (const section of ruleDocSectionExclude) {
      expectSectionHeaderOrFail(
        `\`${name}\` rule doc`,
        contentsNewNormalized,
        [section],
        false,
      );
    }

    if (ruleDocSectionOptions) {
      // Options section.
      expectSectionHeaderOrFail(
        `\`${name}\` rule doc`,
        contentsNewNormalized,
        ['Options', 'Config'],
        ruleHasOptions,
      );
      for (const { name: namedOption } of getAllNamedOptions(
        schema,
        metaDefaultOptions,
      )) {
        expectContentOrFail(
          `\`${name}\` rule doc`,
          'rule option',
          contentsNewNormalized,
          namedOption,
          true,
        ); // Each rule option is mentioned.
      }
    }
  }

  if (initRuleDocs && !initializedRuleDoc) {
    throw new Error(
      '--init-rule-docs was enabled, but no rule doc file needed to be created.',
    );
  }

  for (const pathRuleListItem of pathRuleList) {
    // Find the exact filename.
    const pathToFile = await getPathWithExactFileNameCasing(
      join(path, pathRuleListItem),
    );
    if (!pathToFile || !existsSync(pathToFile)) {
      throw new Error(
        `Could not find ${String(pathRuleList)} in ESLint plugin.`,
      );
    }

    const isRuleListMdx = isMdx(pathToFile);

    // Update the rules list in this file.
    const fileContents = await readFile(pathToFile, 'utf8');

    // Normalize to LF for processing; restore this file's end of line before write.
    const endOfLine = await endOfLineResolver.resolve(pathToFile, fileContents);
    const fileContentsNormalized = normalizeEndOfLine(fileContents, '\n');

    const rulesList = updateRulesList(
      context,
      ruleNamesAndRules,
      fileContentsNormalized,
      pathToFile,
    );
    const fileContentsNew = await postprocess(
      normalizeEndOfLine(
        updateConfigsList(context, rulesList, isRuleListMdx),
        endOfLine,
      ),
      resolve(pathToFile),
    );

    if (check) {
      /* istanbul ignore next -- V8 branch coverage doesn't detect this branch is tested */
      if (fileContentsNew !== fileContents) {
        console.error(
          `Please run eslint-doc-generator. The rules table in ${relative(
            getPluginRoot(path),
            pathToFile,
          )} is out-of-date.`,
        );
        console.error(diff(fileContentsNew, fileContents, { expand: false }));
        process.exitCode = 1;
      }
    } else {
      await writeFile(pathToFile, fileContentsNew, 'utf8');
    }
  }
}
