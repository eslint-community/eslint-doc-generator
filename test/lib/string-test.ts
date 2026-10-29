import {
  addTrailingPeriod,
  removeTrailingPeriod,
  sanitizeMarkdownHeading,
  sanitizeMarkdownTable,
  toSentenceCase,
} from '../../lib/string.js';

describe('strings', function () {
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

  describe('#sanitizeMarkdownHeading', function () {
    it('strips embedded newlines', function () {
      expect(sanitizeMarkdownHeading('Foo\nBar')).toStrictEqual('FooBar');
      expect(sanitizeMarkdownHeading('Foo\r\nBar')).toStrictEqual('FooBar');
    });
  });

  describe('#sanitizeMarkdownTable', function () {
    it('escapes pipes and converts newlines for plain markdown', function () {
      expect(sanitizeMarkdownTable([['a|b', 'line1\nline2']])).toStrictEqual([
        [String.raw`a\|b`, 'line1<br/>line2'],
      ]);
    });

    it('neutralizes MDX container characters without breaking br tags', function () {
      expect(
        sanitizeMarkdownTable(
          [['Disallow <Foo> and {bar}', 'line1\nline2']],
          true,
        ),
      ).toStrictEqual([
        ["Disallow {'<'}Foo> and {'{'}bar}", 'line1<br/>line2'],
      ]);
    });

    it('leaves MDX characters alone for plain markdown', function () {
      expect(
        sanitizeMarkdownTable([['Disallow <Foo> and {bar}']]),
      ).toStrictEqual([['Disallow <Foo> and {bar}']]);
    });
  });
});
