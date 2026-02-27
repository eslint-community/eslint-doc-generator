# test/no-foo

📝 Disallow using foo.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

⚙️ This rule is configurable.

💭 This rule requires [type information](https://typescript-eslint.io/linting/typed-linting).

❗ This rule identifies problems that could cause errors or unexpected behavior.

<!-- end auto-generated rule header -->

## Rule details

Description of the rule would normally go here.

## Examples

Examples would normally go here.

## Options

<!-- begin auto-generated rule options list -->

| Name  | Description                   | Type    | Choices           | Default  | Required | Deprecated |
| :---- | :---------------------------- | :------ | :---------------- | :------- | :------- | :--------- |
| `bar` | Choose how to use the rule.   | String  | `always`, `never` | `always` | Yes      |            |
| `foo` | Enable some kind of behavior. | Boolean |                   | `false`  |          | Yes        |

<!-- end auto-generated rule options list -->

For the purpose of this example, below is the `meta.schema` that would generate the above rule options table:

```json
[{
    "type": "object",
    "properties": {
        "foo": {
            "type": "boolean",
            "description": "Enable some kind of behavior.",
            "deprecated": true,
            "default": false
        },
        "bar": {
            "description": "Choose how to use the rule.",
            "type": "string",
            "enum": ["always", "never"],
            "default": "always"
        }
    },
    "required": ["bar"],
    "additionalProperties": false
}]
```
