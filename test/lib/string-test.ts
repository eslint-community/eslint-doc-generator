import {
  addTrailingPeriod,
  escapeRegExp,
  removeTrailingPeriod,
  toSentenceCase,
} from '../../lib/string.js';

describe('strings', function () {
  describe('#escapeRegExp', function () {
    it('escapes regex metacharacters', function () {
      expect(escapeRegExp('Options [x')).toBe(String.raw`Options \[x`);
      expect(escapeRegExp('Options (advanced)')).toBe(
        String.raw`Options \(advanced\)`,
      );
      expect(escapeRegExp('C++')).toBe(String.raw`C\+\+`);
      expect(escapeRegExp('Options .')).toBe(String.raw`Options \.`);
    });

    it('leaves ordinary characters unchanged', function () {
      expect(escapeRegExp('rules')).toBe('rules');
    });
  });

  describe('#addTrailingPeriod', function () {
    it('handles when already has period', function () {
      expect(addTrailingPeriod('foo.')).toStrictEqual('foo.');
    });

    it('handles when does not have period', function () {
      expect(addTrailingPeriod('foo')).toStrictEqual('foo.');
    });
  });

  describe('#removeTrailingPeriod', function () {
    it('handles when already has period', function () {
      expect(removeTrailingPeriod('foo.')).toStrictEqual('foo');
    });

    it('handles when does not have period', function () {
      expect(removeTrailingPeriod('foo')).toStrictEqual('foo');
    });
  });

  describe('#toSentenceCase', function () {
    it('handles when lowercase first letter', function () {
      expect(toSentenceCase('hello world')).toStrictEqual('Hello world');
    });

    it('handles when uppercase first letter', function () {
      expect(toSentenceCase('Hello World')).toStrictEqual('Hello World');
    });
  });
});
