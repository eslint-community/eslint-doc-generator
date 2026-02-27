import { vi } from 'vitest';
import type * as NodeOs from 'node:os';

// Stub os.EOL to always be '\n' for testing/snapshot purposes.
vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof NodeOs>();
  return {
    ...original,
    EOL: '\n',
  };
});
