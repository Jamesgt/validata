import { DateTime } from 'luxon';
import { asArray, isArray, maybeArray, maybeAsArray } from './array';
import { asBoolean, isBoolean, maybeAsBoolean, maybeBoolean } from './boolean';
import { checkAsync } from './check';
import { asNullable, isNullable } from './common';
import { asDate, isDate, maybeAsDate, maybeDate } from './date';
import { asDateTime, isDateTime, maybeAsDateTime, maybeDateTime } from './date-time';
import { asNumber, isNumber, maybeAsNumber, maybeNumber } from './number';
import { asObject, isObject, maybeAsObject, maybeObject } from './object';
import { isRecord, maybeRecord } from './record';
import { asString, isString, maybeAsString, maybeString } from './string';
import { expectValue } from './test-helpers';
import { isTuple, maybeTuple } from './tuple';
import { AsyncValueProcessor, ValueProcessor } from './types';
import { asUrl, isUrl, maybeAsUrl, maybeUrl } from './url';

describe('common tests', () => {
  const dateTime = DateTime.local();
  const date = new Date();
  const url = new URL('http://localhost');

  const testCases = [
    [isArray, ['a', 'b']],
    [maybeArray, undefined],
    [asArray, 'a'],
    [maybeAsArray, undefined],

    [isBoolean, true],
    [maybeBoolean, undefined],
    [asBoolean, 'false'],
    [maybeAsBoolean, undefined],

    [isDateTime, dateTime],
    [maybeDateTime, undefined],
    [asDateTime, dateTime.toISO()],
    [maybeAsDateTime, undefined],

    [isDate, date],
    [maybeDate, undefined],
    [asDate, date.toISOString()],
    [maybeAsDate, undefined],

    [isNumber, 5],
    [maybeNumber, undefined],
    [asNumber, '5'],
    [maybeAsNumber, undefined],

    [isObject, { a: 1, b: '2' }],
    [maybeObject, undefined],
    [asObject, '{ "a": 42 }', { a: isNumber() }],
    [maybeAsObject, undefined],

    [isRecord, { a: 1, b: '2' }],
    [maybeRecord, undefined],

    [isString, 'asd'],
    [maybeString, undefined],
    [asString, 'asd'],
    [maybeAsString, undefined],

    [isTuple, [2], [isNumber()]],
    [maybeTuple, undefined],

    [isUrl, url],
    [maybeUrl, undefined],
    [asUrl, url.toString()],
    [maybeAsUrl, undefined],
  ] as const;

  describe('createNullableCheck', () => {
    it.each(testCases)('createIsNullableCheck %#', (
      check: (...args: any[]) => ValueProcessor<unknown>,
      value: unknown,
      contract: unknown = undefined
    ) => {
      const fut = check(contract);
      const futNull = isNullable(check(contract));
      expectValue(futNull, null, null);
      expect(fut.process(value)).toEqual(futNull.process(value));
    });

    it.each([
      [maybeArray],
      [maybeArray, undefined, [1, 2, 3]],
      [maybeArray, [1, 2, 3], null, [1, 2, 3]],

      [maybeAsArray],
      [maybeAsArray, undefined, [1, 2, 3]],
      [maybeAsArray, [1, 2, 3], null, [1, 2, 3]],

      [maybeBoolean],
      [maybeBoolean, undefined, true],
      [maybeBoolean, true, null, true],
      [maybeAsBoolean],
      [maybeAsBoolean, undefined, true],
      [maybeAsBoolean, 'true', null, true],

      [maybeDateTime],
      [maybeDateTime, undefined, dateTime],
      [maybeDateTime, dateTime, null, dateTime],
      [maybeAsDateTime],
      [maybeAsDateTime, undefined, dateTime],
      [maybeAsDateTime, dateTime, null, dateTime],

      [maybeDate],
      [maybeDate, undefined, date],
      [maybeDate, date, null, date],
      [maybeAsDate],
      [maybeAsDate, undefined, date],
      [maybeAsDate, date.toISOString(), null, date],

      [maybeNumber],
      [maybeNumber, undefined, 5],
      [maybeNumber, 5, null, 5],
      [maybeAsNumber],
      [maybeAsNumber, undefined, 5],
      [maybeAsNumber, undefined, () => 5, 5],
      [maybeAsNumber, '5', null, 5],

      [maybeObject],
      [maybeObject, undefined, { key: 'value' }],
      [maybeObject, { key: 'value' }, null, { key: 'value' }],
      [maybeAsObject],
      [maybeAsObject, undefined, { key: 'value' }],
      [maybeAsObject, { key: 'value' }, null, { key: 'value' }],

      [maybeRecord],
      [maybeRecord, undefined, { key: 'value' }],
      [maybeRecord, { key: 'value' }, null, { key: 'value' }],

      [maybeString],
      [maybeString, undefined, 'string'],
      [maybeString, 'string', null, 'string'],
      [maybeAsString],
      [maybeAsString, undefined, 'string'],
      [maybeAsString, 'string', null, 'string'],

      [maybeTuple],
      [maybeTuple, undefined, [1, 'text'], [1, 'text'], [isNumber(), isString()]],
      [maybeTuple, [1, 'text'], null, [1, 'text'], [isNumber(), isString()]],

      [maybeUrl],
      [maybeUrl, undefined, url],
      [maybeUrl, url, null, url],
      [maybeAsUrl],
      [maybeAsUrl, undefined, url],
      [maybeAsUrl, url.toString(), null, url],
    ])('createAsNullableCheck %#', (
      check: (...args: any[]) => ValueProcessor<unknown>,
      value: unknown = undefined,
      defaultValue: unknown = null,
      expectedValue: unknown = defaultValue,
      contract: unknown = undefined) => {
      const futNull = asNullable(check(contract), { default: defaultValue });
      expect(futNull.process(value)).toEqual({ value: expectedValue });
    });

    it('result is intact during an issue detection', () => {
      const fut = isObject({ key: isBoolean() });
      const futNull = isObject({ key: asNullable(isBoolean()) });
      const result = fut.process({ key: [] });
      const resultNull = futNull.process({ key: [] });

      expect(result).toEqual(resultNull);
    });
  });

  describe('checkAsync', () => {
    it.each(testCases)('async check run %#', async (
      check: (...args: any[]) => ValueProcessor<unknown>,
      value: unknown,
      contract: unknown = undefined
    ) => {
      const futAsync: AsyncValueProcessor<unknown> = {
        process: (value) => Promise.resolve(check(contract).process(value)),
      };
      const result = checkAsync(futAsync, () => Promise.resolve(value));
      await expect(result).resolves.not.toThrow();
    });
  });
});
