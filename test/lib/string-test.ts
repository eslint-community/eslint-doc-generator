import {
  addTrailingPeriod,
  removeTrailingPeriod,
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
});
