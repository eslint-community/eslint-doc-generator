import { table } from 'table';
import type { Context } from './context.js';
import { getBuiltinEmojiSuggestions } from './init-emojis-builtin.js';
import { applyAiEmojiSuggestions } from './init-emojis-ai.js';
import { SUGGEST_EMOJIS_ENGINE } from './types.js';

function formatSuggestionTable(
  configNames: readonly string[],
  emojiByConfig: ReadonlyMap<string, string>,
): string {
  const rows = [
    ['Config', 'Emoji'],
    ...configNames.map((configName) => [
      configName,
      emojiByConfig.get(configName) as string,
    ]),
  ];
  return table(rows, {
    columns: [{ alignment: 'left' }, { alignment: 'left' }],
  });
}

export async function generateSuggestedEmojis(context: Context): Promise<void> {
  const { configNames, emojiByConfig, generatedConfigNames } =
    getBuiltinEmojiSuggestions(context);

  if (context.options.suggestEmojisEngine === SUGGEST_EMOJIS_ENGINE.AI) {
    await applyAiEmojiSuggestions(generatedConfigNames, emojiByConfig, {
      aiProvider: context.options.aiProvider,
      aiModel: context.options.aiModel,
    });
  }

  console.log(formatSuggestionTable(configNames, emojiByConfig));
}
