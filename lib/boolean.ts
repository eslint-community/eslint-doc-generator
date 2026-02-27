// Originally from: https://www.npmjs.com/package/boolean

export function boolean(value: unknown): boolean {
  switch (typeof value) {
    case 'string': {
      return ['true', 't', 'yes', 'y', 'on', '1'].includes(
        value.trim().toLowerCase(),
      );
    }

    case 'number': {
      return value.valueOf() === 1;
    }

    case 'boolean': {
      return value.valueOf();
    }

    default: {
      return false;
    }
  }
}

export function isBooleanable(value: unknown): boolean {
  switch (typeof value) {
    case 'string': {
      return [
        'true',
        't',
        'yes',
        'y',
        'on',
        '1',
        'false',
        'f',
        'no',
        'n',
        'off',
        '0',
      ].includes(value.trim().toLowerCase());
    }

    case 'number': {
      return [0, 1].includes(value);
    }

    case 'boolean': {
      return true;
    }

    default: {
      return false;
    }
  }
}
