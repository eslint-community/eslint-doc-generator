import { getAllNamedOptions } from '../../lib/rule-options.js';

describe('rule options', function () {
  describe('#getAllNamedOptions', function () {
    it('handles null', function () {
      expect(getAllNamedOptions(null)).toMatchInlineSnapshot('[]'); // eslint-disable-line unicorn/no-null
    });

    it('handles undefined', function () {
      expect(getAllNamedOptions(undefined)).toMatchInlineSnapshot('[]');
    });

    it('handles empty array', function () {
      expect(getAllNamedOptions([])).toMatchInlineSnapshot('[]');
    });

    it('handles array of empty object', function () {
      expect(getAllNamedOptions([{}])).toMatchInlineSnapshot('[]');
    });

    it('handles empty object', function () {
      expect(getAllNamedOptions({})).toMatchInlineSnapshot('[]');
    });

    it('handles object', function () {
      expect(
        getAllNamedOptions({
          type: 'object',
          properties: {
            optionToDoSomething1: {
              type: 'boolean',
              default: false,
              deprecated: true,
            },
            optionToDoSomething2: {
              type: 'string',
              enum: ['always', 'never'],
            },
            optionToDoSomething3: {
              required: true,
            },
          },
          required: ['optionToDoSomething'],
          additionalProperties: false,
        }),
      ).toMatchInlineSnapshot(`
        [
          {
            "default": false,
            "deprecated": true,
            "name": "optionToDoSomething1",
            "type": "Boolean",
          },
          {
            "enum": [
              "always",
              "never",
            ],
            "name": "optionToDoSomething2",
            "type": "String",
          },
          {
            "name": "optionToDoSomething3",
            "required": true,
          },
        ]
      `);
    });

    it('handles object in JS array', function () {
      expect(
        getAllNamedOptions([
          {
            type: 'object',
            properties: {
              optionToDoSomething: {
                type: 'boolean',
                default: false,
              },
            },
            additionalProperties: false,
          },
        ]),
      ).toMatchInlineSnapshot(`
        [
          {
            "default": false,
            "name": "optionToDoSomething",
            "type": "Boolean",
          },
        ]
      `);
    });

    it('handles multiple objects in JS array', function () {
      expect(
        getAllNamedOptions([
          {
            type: 'object',
            properties: {
              optionToDoSomething1: {
                type: 'boolean',
                default: false,
              },
            },
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              optionToDoSomething2: {
                type: 'boolean',
                default: false,
              },
            },
            additionalProperties: false,
          },
        ]),
      ).toMatchInlineSnapshot(`
        [
          {
            "default": false,
            "name": "optionToDoSomething1",
            "type": "Boolean",
          },
          {
            "default": false,
            "name": "optionToDoSomething2",
            "type": "Boolean",
          },
        ]
      `);
    });

    it('handles object in array schema', function () {
      expect(
        getAllNamedOptions([
          {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                optionToDoSomething: {
                  type: 'boolean',
                  default: false,
                },
              },
              additionalProperties: false,
            },
          },
        ]),
      ).toMatchInlineSnapshot(`
        [
          {
            "default": false,
            "name": "optionToDoSomething",
            "type": "Boolean",
          },
        ]
      `);
    });

    it('handles array in object', function () {
      expect(
        getAllNamedOptions([
          {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                optionToDoSomething: {
                  type: 'boolean',
                  default: false,
                },
              },
              additionalProperties: false,
            },
          },
        ]),
      ).toMatchInlineSnapshot(`
        [
          {
            "default": false,
            "name": "optionToDoSomething",
            "type": "Boolean",
          },
        ]
      `);
    });

    it('handles object in array in object', function () {
      expect(
        getAllNamedOptions([
          {
            type: 'object',
            properties: {
              optionToDoSomething1: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    optionToDoSomething2: {
                      type: 'boolean',
                      default: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              optionToDoSomething2: {
                type: 'array',
              },
            },
            additionalProperties: false,
          },
        ]),
      ).toMatchInlineSnapshot(`
        [
          {
            "name": "optionToDoSomething1",
            "type": "Object[]",
          },
          {
            "name": "optionToDoSomething2",
            "type": "Array",
          },
          {
            "default": false,
            "name": "optionToDoSomething2",
            "type": "Boolean",
          },
        ]
      `);
    });

    it('handles when type is an array', function () {
      expect(
        getAllNamedOptions([
          {
            type: 'object',
            properties: {
              optionToDoSomething1: {
                type: 'array',
                items: {
                  type: ['boolean', 'string'],
                },
              },
              optionToDoSomething2: {
                type: ['boolean', 'string'],
              },
              optionToDoSomething3: {
                type: ['boolean'],
              },
            },
            additionalProperties: false,
          },
        ]),
      ).toMatchInlineSnapshot(`
        [
          {
            "name": "optionToDoSomething1",
            "type": "(Boolean, String)[]",
          },
          {
            "name": "optionToDoSomething2",
            "type": "Boolean, String",
          },
          {
            "name": "optionToDoSomething3",
            "type": "Boolean",
          },
        ]
      `);
    });

    describe('with meta.defaultOptions', function () {
      it('uses defaultOptions over schema defaults', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  foo: {
                    type: 'boolean',
                    default: false, // This should be overridden
                  },
                  bar: {
                    type: 'string',
                    enum: ['always', 'never'],
                    default: 'always', // This should be overridden
                  },
                  baz: {
                    type: 'number',
                    // No schema default
                  },
                },
                additionalProperties: false,
              },
            ],
            [{ foo: true, bar: 'never', baz: 42 }], // meta.defaultOptions takes priority
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": true,
              "name": "foo",
              "type": "Boolean",
            },
            {
              "default": "never",
              "enum": [
                "always",
                "never",
              ],
              "name": "bar",
              "type": "String",
            },
            {
              "default": 42,
              "name": "baz",
              "type": "Number",
            },
          ]
        `);
      });

      it('falls back to schema defaults when defaultOptions does not contain the option', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  foo: {
                    type: 'boolean',
                    default: false,
                  },
                  bar: {
                    type: 'string',
                    default: 'always',
                  },
                },
                additionalProperties: false,
              },
            ],
            [{ foo: true }], // Only overrides foo, bar should use schema default
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": true,
              "name": "foo",
              "type": "Boolean",
            },
            {
              "default": "always",
              "name": "bar",
              "type": "String",
            },
          ]
        `);
      });

      it('handles empty defaultOptions', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  foo: {
                    type: 'boolean',
                    default: false,
                  },
                },
                additionalProperties: false,
              },
            ],
            [{}], // Empty defaultOptions object
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": false,
              "name": "foo",
              "type": "Boolean",
            },
          ]
        `);
      });

      it('handles undefined defaultOptions', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  foo: {
                    type: 'boolean',
                    default: false,
                  },
                },
                additionalProperties: false,
              },
            ],
            undefined, // No defaultOptions
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": false,
              "name": "foo",
              "type": "Boolean",
            },
          ]
        `);
      });

      it('handles multiple schema items with defaultOptions array', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  foo: {
                    type: 'boolean',
                    default: false,
                  },
                },
                additionalProperties: false,
              },
              {
                type: 'object',
                properties: {
                  bar: {
                    type: 'string',
                    default: 'original',
                  },
                },
                additionalProperties: false,
              },
            ],
            [{ foo: true }, { bar: 'overridden' }], // defaultOptions for each schema item
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": true,
              "name": "foo",
              "type": "Boolean",
            },
            {
              "default": "overridden",
              "name": "bar",
              "type": "String",
            },
          ]
        `);
      });

      it('handles nested object properties in defaultOptions', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  reporting: {
                    type: 'object',
                    properties: {
                      verbose: {
                        type: 'boolean',
                        default: false,
                      },
                      format: {
                        type: 'string',
                        default: 'text',
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
            ],
            [{ reporting: { verbose: true, format: 'json' } }],
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": {
                "format": "json",
                "verbose": true,
              },
              "name": "reporting",
              "type": "Object",
            },
            {
              "default": true,
              "name": "verbose",
              "type": "Boolean",
            },
            {
              "default": "json",
              "name": "format",
              "type": "String",
            },
          ]
        `);
      });

      it('gracefully ignores non-array defaultOptions when schema is an array', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  foo: {
                    type: 'boolean',
                    default: false,
                  },
                },
                additionalProperties: false,
              },
            ],
            { foo: true }, // Malformed: should be an array to match the schema array
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": false,
              "name": "foo",
              "type": "Boolean",
            },
          ]
        `);
      });

      it('preserves other properties when using defaultOptions', function () {
        expect(
          getAllNamedOptions(
            [
              {
                type: 'object',
                properties: {
                  foo: {
                    type: 'boolean',
                    description: 'A boolean option',
                    deprecated: true,
                    enum: [true, false],
                    default: false,
                  },
                },
                required: ['foo'],
                additionalProperties: false,
              },
            ],
            [{ foo: true }], // defaultOptions overrides default
          ),
        ).toMatchInlineSnapshot(`
          [
            {
              "default": true,
              "deprecated": true,
              "description": "A boolean option",
              "enum": [
                true,
                false,
              ],
              "name": "foo",
              "required": true,
              "type": "Boolean",
            },
          ]
        `);
      });
    });
  });
});
