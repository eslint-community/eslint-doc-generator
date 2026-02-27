import {
  parseConfigEmojiOptions,
  parseRuleListColumnsOption,
  parseRuleDocNoticesOption,
} from '../../lib/option-parsers.js';
import { mockPlugin } from '../../lib/mock-plugin.js';

describe('option-parsers', function () {
  describe('parseConfigEmojiOptions', function () {
    it('handles undefined configEmoji and returns default emojis', function () {
      const result = parseConfigEmojiOptions(mockPlugin, undefined);

      // Should return default emojis for recognized configs.
      expect(result).toContainEqual({ config: 'recommended', emoji: '✅' });
      expect(result).toContainEqual({ config: 'all', emoji: '🌐' });
    });
  });

  describe('parseRuleListColumnsOption', function () {
    it('handles undefined input', function () {
      const result = parseRuleListColumnsOption(undefined);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('parseRuleDocNoticesOption', function () {
    it('handles undefined input', function () {
      const result = parseRuleDocNoticesOption(undefined);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
