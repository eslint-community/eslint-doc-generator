/**
 * Construct the plugin prefix out of the plugin's name.
 */
export function getPluginPrefix(name: string): string {
  if (name.endsWith('/eslint-plugin')) {
    const scope = name.split('/')[0];
    // Scoped plugin name like @my-scope/eslint-plugin.
    return scope ?? name;
  }
  // Unscoped name like eslint-plugin-foo or scoped name like @my-scope/eslint-plugin-foo.
  return name.replace('eslint-plugin-', '');
}
