import { table } from 'table';
import type { Context } from './context.js';
import { getBuiltinEmojiSuggestions } from './suggest-emojis-builtin.js';
import { applyAiEmojiSuggestions } from './suggest-emojis-ai.js';

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
  const { configNames, emojiByConfig } = getBuiltinEmojiSuggestions(context);

  if (context.options.ai) {
    await applyAiEmojiSuggestions(configNames, emojiByConfig, {
      aiProvider: context.options.aiProvider,
      aiModel: context.options.aiModel,
    });
  }

  console.log(formatSuggestionTable(configNames, emojiByConfig));
}
