import traverse from 'json-schema-traverse';
import { getProperty, hasProperty } from 'dot-prop';
import type {
  JSONSchema4,
  JSONSchema4Type,
  JSONSchema4TypeName,
} from 'json-schema';
import { capitalizeOnlyFirstLetter } from './string.js';

export type RuleOption = {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enum?: readonly JSONSchema4Type[];
  default?: JSONSchema4Type;
  deprecated?: boolean;
};

function typeToString(
  type: JSONSchema4TypeName[] | JSONSchema4TypeName,
): string {
  return Array.isArray(type)
    ? type.map((item) => capitalizeOnlyFirstLetter(item)).join(', ')
    : capitalizeOnlyFirstLetter(type);
}

function hasObjectPath(
  object: unknown,
  path: readonly (string | number)[],
): object is Record<string, unknown> | unknown[] {
  return (
    (Array.isArray(object) ||
      (typeof object === 'object' && object !== null)) &&
    hasProperty(object, path)
  );
}

function getCurrentOptionPath(
  parentPath: readonly (string | number)[] | undefined,
  parentKeyword?: string,
  keyIndex?: string | number,
): readonly (string | number)[] {
  if (parentKeyword === 'properties' && typeof keyIndex === 'string') {
    return [...(parentPath ?? []), keyIndex];
  }

  if (parentKeyword === 'items' && typeof keyIndex === 'number') {
    return [...(parentPath ?? []), keyIndex];
  }

  return parentPath ?? [];
}

function collectNamedOptionsFromSchemaProperties(
  js: JSONSchema4,
  baseOptionPath: readonly (string | number)[],
  metaDefaultOptionForSchema: unknown,
  options: RuleOption[],
): void {
  for (const [key, value] of Object.entries(js.properties ?? {})) {
    const type =
      value.type === 'array' && !Array.isArray(value.items) && value.items?.type
        ? `${
            Array.isArray(value.items.type) && value.items.type.length > 1
              ? `(${typeToString(value.items.type)})`
              : typeToString(value.items.type)
          }[]`
        : value.type
          ? typeToString(value.type)
          : undefined;

    const required =
      typeof value.required === 'boolean'
        ? value.required
        : Array.isArray(js.required) && js.required.includes(key);

    // Property exists on future JSONSchema version but we can let it be used anyway.
    const deprecated =
      'deprecated' in value ? Boolean(value['deprecated']) : false;

    // Prefer `meta.defaultOptions` over schema `default`.
    let defaultValue = value.default;
    const optionPath = [...baseOptionPath, key] as const;
    if (hasObjectPath(metaDefaultOptionForSchema, optionPath)) {
      defaultValue = getProperty(metaDefaultOptionForSchema, optionPath);
    }

    const option: RuleOption = {
      name: key,
      ...(type !== undefined && { type }),
      ...(value.description !== undefined && {
        description: value.description,
      }),
      ...(defaultValue !== undefined && { default: defaultValue }),
      ...(value.enum !== undefined && { enum: value.enum }),
      ...(required && { required }),
      ...(deprecated && { deprecated }),
    };
    options.push(option);
  }
}

/**
 * Gather a list of named options from a rule schema.
 * @param jsonSchema - the JSON schema to check
 * @param metaDefaultOptions - the `meta.defaultOptions`, if any
 * @returns - list of named options we could detect from the schema
 */
export function getAllNamedOptions(
  jsonSchema: JSONSchema4 | readonly JSONSchema4[] | undefined | null,
  metaDefaultOptions?: unknown,
): readonly RuleOption[] {
  if (!jsonSchema) {
    return [];
  }

  if (Array.isArray(jsonSchema)) {
    const metaDefaultOptionsForItems = Array.isArray(metaDefaultOptions)
      ? metaDefaultOptions
      : undefined;

    return jsonSchema.flatMap((js: JSONSchema4, index: number) =>
      getAllNamedOptions(js, metaDefaultOptionsForItems?.[index]),
    );
  }

  const options: RuleOption[] = [];
  const optionPathBySchema = new WeakMap<
    JSONSchema4,
    readonly (string | number)[]
  >([[jsonSchema, []]]);

  traverse(
    // Cast needed because json-schema-traverse types don't account for exactOptionalPropertyTypes
    jsonSchema as Parameters<typeof traverse>[0],
    (
      js: JSONSchema4,
      _jsonPtr,
      _rootSchema,
      _parentJsonPtr,
      parentKeyword,
      parentSchema,
      keyIndex,
    ) => {
      const parentPath =
        parentSchema && optionPathBySchema.has(parentSchema)
          ? optionPathBySchema.get(parentSchema)
          : [];

      const currentPath = getCurrentOptionPath(
        parentPath,
        parentKeyword,
        keyIndex,
      );

      optionPathBySchema.set(js, currentPath);

      if (js.properties) {
        collectNamedOptionsFromSchemaProperties(
          js,
          currentPath,
          metaDefaultOptions,
          options,
        );
      }
    },
  );
  return options;
}

/**
 * Check if a rule schema is non-blank/empty and thus has actual options.
 * @param jsonSchema - the JSON schema to check
 * @returns - whether the schema has options
 */
export function hasOptions(
  jsonSchema: JSONSchema4 | readonly JSONSchema4[],
): boolean {
  return (
    (Array.isArray(jsonSchema) && jsonSchema.length > 0) ||
    (typeof jsonSchema === 'object' && Object.keys(jsonSchema).length > 0)
  );
}
