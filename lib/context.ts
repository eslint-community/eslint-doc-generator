import { mockPlugin } from './mock-plugin.js';
import { detectEndOfLine, getEndOfLine } from './eol.js';
import { getResolvedOptions } from './options.js';
import type { ResolvedGenerateOptions } from './options.js';
import { getPluginName, loadPlugin } from './package-json.js';
import type { ConfigsToRules, GenerateOptions, Plugin } from './types.js';
import { getPluginPrefix } from './plugin-prefix.js';
import { resolveConfigsToRules } from './plugin-config-resolution.js';

/**
 * Context about the current invocation of the program, like what end-of-line
 * character to use.
 */
export interface Context {
  configsToRules: ConfigsToRules;
  endOfLine: string;
  options: ResolvedGenerateOptions;
  path: string;
  plugin: Plugin;
  pluginPrefix: string;
}

export async function getContext(
  path: string,
  userOptions?: GenerateOptions,
  useMockPlugin = false,
): Promise<Context> {
  const endOfLine = await getEndOfLine();
  const plugin = useMockPlugin ? mockPlugin : await loadPlugin(path);
  const pluginPrefix = getPluginPrefix(
    plugin.meta?.name ?? (await getPluginName(path)),
  );

  const configsToRules = await resolveConfigsToRules(plugin);
  const options = getResolvedOptions(plugin, userOptions);

  return {
    configsToRules,
    endOfLine,
    options,
    path,
    plugin,
    pluginPrefix,
  };
}

/**
 * Create a copy of the context that uses the end of line already predominant
 * in the given file contents, if any. This way, updating an existing file
 * preserves the file's current line endings even when they differ from the
 * configured end of line (such as when another tool like Prettier rewrote the
 * file with different line endings). The configured end of line still applies
 * to files without any line breaks.
 */
export function getContextForFileContents(
  context: Context,
  contents: string,
): Context {
  return {
    ...context,
    endOfLine: detectEndOfLine(contents) ?? context.endOfLine,
  };
}
