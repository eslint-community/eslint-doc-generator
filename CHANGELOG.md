# Changelog

## [3.0.2](https://github.com/eslint-community/eslint-doc-generator/compare/v3.0.1...v3.0.2) (2026-01-02)


### Bug Fixes

* Enable TypeScript option `erasableSyntaxOnly` ([ec3b08e](https://github.com/eslint-community/eslint-doc-generator/commit/ec3b08e762c426e894e307a73081b519580f68a5))
* Modernize TypeScript config ([ddf74e3](https://github.com/eslint-community/eslint-doc-generator/commit/ddf74e3eb0604d11abb4a72f046967fa2ade9d49))
* Remove mock-fs due to Jest 30 incompatibility ([#841](https://github.com/eslint-community/eslint-doc-generator/issues/841)) ([bf79a57](https://github.com/eslint-community/eslint-doc-generator/commit/bf79a5710dc5eeacc47e5c2a7155f4cdda5f3933))
* Replace jest with vitest ([#844](https://github.com/eslint-community/eslint-doc-generator/issues/844)) ([af24353](https://github.com/eslint-community/eslint-doc-generator/commit/af243532edd03ca97824c26a04854d14fc7e06a1))
* Upgrade to Jest 30 ([8e6ecff](https://github.com/eslint-community/eslint-doc-generator/commit/8e6ecff8689da52d55943282cd2a6cf84b31cefc))
* Use tsgo instead of tsc for faster type-checking ([#847](https://github.com/eslint-community/eslint-doc-generator/issues/847)) ([3ae507b](https://github.com/eslint-community/eslint-doc-generator/commit/3ae507b22cb0e2f9de183a359e4216d617774439))

## [3.0.1](https://github.com/eslint-community/eslint-doc-generator/compare/v3.0.0...v3.0.1) (2026-01-02)


### Bug Fixes

* Rule doc notice for description should come first ([#839](https://github.com/eslint-community/eslint-doc-generator/issues/839)) ([bd4fccd](https://github.com/eslint-community/eslint-doc-generator/commit/bd4fccd9084b3bae164e5a1bb62472f43cb162a0))

## [3.0.0](https://github.com/eslint-community/eslint-doc-generator/compare/v2.4.0...v3.0.0) (2026-01-01)


### ⚠ BREAKING CHANGES

* Add default emoji for `base` config ([#828](https://github.com/eslint-community/eslint-doc-generator/pull/828))
* Remove implicit config badge fallback ([#827](https://github.com/eslint-community/eslint-doc-generator/pull/827))
* Require Node 20, 22, 24+ ([#794](https://github.com/eslint-community/eslint-doc-generator/pull/794))
* Update default rule doc title and notices to separate rule name and description ([#835](https://github.com/eslint-community/eslint-doc-generator/pull/835))
* Update dependencies ([#834](https://github.com/eslint-community/eslint-doc-generator/pull/834))


## [2.4.0](https://github.com/eslint-community/eslint-doc-generator/compare/v2.3.0...v2.4.0) (2025-12-05)


### Features

* receive plugin name via plugin metadata ([712417b](https://github.com/eslint-community/eslint-doc-generator/commit/712417b7d146eaf2c7cf541b9bfea1b7a6057e3f))


### Bug Fixes

* prettier peer dep should be optional ([#821](https://github.com/eslint-community/eslint-doc-generator/issues/821)) ([5b331cf](https://github.com/eslint-community/eslint-doc-generator/commit/5b331cf258516e8dad242be4ac8d0f9de019b2d0))

## [2.3.0](https://github.com/eslint-community/eslint-doc-generator/compare/v2.2.2...v2.3.0) (2025-10-06)


### Features

* use Prettier to detect end of line in addition to EditorConfig ([#803](https://github.com/eslint-community/eslint-doc-generator/issues/803)) ([c0ad58b](https://github.com/eslint-community/eslint-doc-generator/commit/c0ad58bd23d459f955e40ea04e739df20730f3f2))

## [2.2.2](https://github.com/eslint-community/eslint-doc-generator/compare/v2.2.1...v2.2.2) (2025-06-22)


### Bug Fixes

* no-op for testing release-please ([#751](https://github.com/eslint-community/eslint-doc-generator/issues/751)) ([ade5adf](https://github.com/eslint-community/eslint-doc-generator/commit/ade5adf161fc7bb9a6fbac65954370034a2d237f))

## [2.2.1](https://github.com/eslint-community/eslint-doc-generator/compare/v2.2.0...v2.2.1) (2025-06-22)


### Bug Fixes

* no-op for testing release-please ([#739](https://github.com/eslint-community/eslint-doc-generator/issues/739)) ([0492d97](https://github.com/eslint-community/eslint-doc-generator/commit/0492d97b56a0ffa42fdb8272b8f32c9ec7a9deca))
* no-op for testing release-please ([#745](https://github.com/eslint-community/eslint-doc-generator/issues/745)) ([d40250d](https://github.com/eslint-community/eslint-doc-generator/commit/d40250d8d2726be423f7871916e20aa590b9386b))


## v2.2.0 (2025-06-19)

#### :rocket: Enhancement
* [#709](https://github.com/eslint-community/eslint-doc-generator/pull/709) Enable flat configs ([@Hagobert](https://github.com/Hagobert))

#### :bug: Bug Fix
* [#731](https://github.com/eslint-community/eslint-doc-generator/pull/731) Fix csv spacing for deprecated rule replaced-by list ([@bmish](https://github.com/bmish))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- [@Hagobert](https://github.com/Hagobert)


## v2.1.2 (2025-03-16)

#### :bug: Bug Fix
* [#658](https://github.com/eslint-community/eslint-doc-generator/pull/658) Fix regression in ESM plugin loading ([@marcalexiei](https://github.com/marcalexiei))

#### :house: Internal
* [#654](https://github.com/eslint-community/eslint-doc-generator/pull/654) Use `.prettierrc.json` instead of `eslint` `prettier` rule to configure format options ([@marcalexiei](https://github.com/marcalexiei))

#### Committers: 1
- Marco Pasqualetti ([@marcalexiei](https://github.com/marcalexiei))


## v2.1.1 (2025-03-10)

#### :bug: Bug Fix
* [#648](https://github.com/eslint-community/eslint-doc-generator/pull/648) Fix ESM support in Node 22+ when the package includes the `main` property ([@marcalexiei](https://github.com/marcalexiei))

#### Committers: 1
- Marco Pasqualetti ([@marcalexiei](https://github.com/marcalexiei))


## v2.1.0 (2025-03-04)

#### :rocket: Enhancement
* [#598](https://github.com/eslint-community/eslint-doc-generator/pull/598) Support ESLint plugins with `"type": "module"` and `main` in package.json ([@y-hsgw](https://github.com/y-hsgw))

#### Committers: 1
- Yukihiro Hasegawa ([@y-hsgw](https://github.com/y-hsgw))


## v2.0.2 (2024-12-22)

#### :bug: Bug Fix
* [#597](https://github.com/eslint-community/eslint-doc-generator/pull/597) Replace deprecated `boolean` dependency ([@y-hsgw](https://github.com/y-hsgw))

#### Committers: 1
- Yukihiro Hasegawa ([@y-hsgw](https://github.com/y-hsgw))


## v2.0.1 (2024-12-12)

#### :bug: Bug Fix
* [#590](https://github.com/eslint-community/eslint-doc-generator/pull/590) Respect EOL character from `.editorconfig` ([@CloudNStoyan](https://github.com/CloudNStoyan))

#### :house: Internal
* [#591](https://github.com/eslint-community/eslint-doc-generator/pull/591) Switch to `change-case` ([@bmish](https://github.com/bmish))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Stoyan Kolev ([@CloudNStoyan](https://github.com/CloudNStoyan))


## v2.0.0 (2024-12-09)

#### :boom: Breaking Change
* [#582](https://github.com/eslint-community/eslint-doc-generator/pull/582) Drop support below ESLint v8 ([@bmish](https://github.com/bmish))
* [#575](https://github.com/eslint-community/eslint-doc-generator/pull/575) Require Node 18, 20, 22+ ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#577](https://github.com/eslint-community/eslint-doc-generator/pull/577) Use async file access ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#583](https://github.com/eslint-community/eslint-doc-generator/pull/583) Use top-level await for CLI ([@bmish](https://github.com/bmish))
* [#581](https://github.com/eslint-community/eslint-doc-generator/pull/581) Use ES2023 target for TypeScript ([@bmish](https://github.com/bmish))
* [#579](https://github.com/eslint-community/eslint-doc-generator/pull/579) chore(deps): update dot-prop to v9 ([@bmish](https://github.com/bmish))
* [#578](https://github.com/eslint-community/eslint-doc-generator/pull/578) chore(deps): Update dev dependencies and refresh lockfile ([@bmish](https://github.com/bmish))
* [#576](https://github.com/eslint-community/eslint-doc-generator/pull/576) chore(deps): Update to ESLint v9 flat config and TypeScript v5 ([@bmish](https://github.com/bmish))
* [#574](https://github.com/eslint-community/eslint-doc-generator/pull/574) Remove `typeRoots` and adjust types for Jest support ([@y-hsgw](https://github.com/y-hsgw))
* [#553](https://github.com/eslint-community/eslint-doc-generator/pull/553) chore(deps): update @release-it-plugins/lerna-changelog to 7.0.0 ([@MikeMcC399](https://github.com/MikeMcC399))
* [#547](https://github.com/eslint-community/eslint-doc-generator/pull/547) chore(deps): update ts-jest to 29.2.5 ([@MikeMcC399](https://github.com/MikeMcC399))
* [#540](https://github.com/eslint-community/eslint-doc-generator/pull/540) chore(deps): migrate to eslint-plugin-n@17.11.1 ([@MikeMcC399](https://github.com/MikeMcC399))
* [#544](https://github.com/eslint-community/eslint-doc-generator/pull/544) Revert "chore(deps-dev): Bump markdownlint-cli from 0.32.2 to 0.42.0" ([@ddzz](https://github.com/ddzz))
* [#541](https://github.com/eslint-community/eslint-doc-generator/pull/541) chore(deps): update eslint-plugin-unicorn to 56.0.0 ([@MikeMcC399](https://github.com/MikeMcC399))
* [#536](https://github.com/eslint-community/eslint-doc-generator/pull/536) ci: drop node.js 14.x and 16.x testing ([@MikeMcC399](https://github.com/MikeMcC399))
* [#539](https://github.com/eslint-community/eslint-doc-generator/pull/539) chore(deps): replace eslint-plugin-square ([@MikeMcC399](https://github.com/MikeMcC399))
* [#531](https://github.com/eslint-community/eslint-doc-generator/pull/531) chore(deps): update eslint-plugin-jest to 27.9.0 ([@MikeMcC399](https://github.com/MikeMcC399))
* [#530](https://github.com/eslint-community/eslint-doc-generator/pull/530) chore(deps): update eslint to 8.57.1 ([@MikeMcC399](https://github.com/MikeMcC399))

#### Committers: 4
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Darius Dzien ([@ddzz](https://github.com/ddzz))
- Mike McCready ([@MikeMcC399](https://github.com/MikeMcC399))
- Yukihiro Hasegawa ([@y-hsgw](https://github.com/y-hsgw))


## v1.7.1 (2024-05-08)

#### :bug: Bug Fix
* [#524](https://github.com/eslint-community/eslint-doc-generator/pull/524) OS-agnostic handling of end-of-line characters ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.7.0 (2024-02-28)

#### :rocket: Enhancement
* [#521](https://github.com/eslint-community/eslint-doc-generator/pull/521) Add emoji for additional `type-checked` config name variations ([@bmish](https://github.com/bmish))
* [#518](https://github.com/eslint-community/eslint-doc-generator/pull/518) Add emoji for `recommended-type-checked` config ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))
* [#516](https://github.com/eslint-community/eslint-doc-generator/pull/516) Add link to typed linting in generated docs ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))

#### :bug: Bug Fix
* [#509](https://github.com/eslint-community/eslint-doc-generator/pull/509) Update rule suggestions link to new docs page ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Josh Goldberg ✨ ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))


## v1.6.2 (2024-01-14)

#### :bug: Bug Fix
* [#508](https://github.com/eslint-community/eslint-doc-generator/pull/508) Support multiple potential property locations for config description ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.6.1 (2023-11-16)

#### :bug: Bug Fix
* [#503](https://github.com/eslint-community/eslint-doc-generator/pull/503) Better display of rule option default for array option ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.6.0 (2023-11-14)

#### :rocket: Enhancement
* [#502](https://github.com/eslint-community/eslint-doc-generator/pull/502) Support a user-defined function for `--path-rule-doc` option ([@hyoban](https://github.com/hyoban))

#### :bug: Bug Fix
* [#447](https://github.com/eslint-community/eslint-doc-generator/pull/447) Throw better exception when failing to load plugin ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))

#### :memo: Documentation
* [#500](https://github.com/eslint-community/eslint-doc-generator/pull/500) Deprecate README-defined badges ([@bmish](https://github.com/bmish))

#### Committers: 3
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Josh Goldberg ✨ ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))
- Stephen Zhou ([@hyoban](https://github.com/hyoban))


## v1.5.4 (2023-11-05)

#### :bug: Bug Fix
* [#498](https://github.com/eslint-community/eslint-doc-generator/pull/498) Handle when an option could have multiple types in rule option lists ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.5.3 (2023-10-31)

#### :bug: Bug Fix
* [#496](https://github.com/eslint-community/eslint-doc-generator/pull/496) Indicate type of array for array options in rule option lists ([@bmish](https://github.com/bmish))
* [#495](https://github.com/eslint-community/eslint-doc-generator/pull/495) Add hint about using `--init-rule-docs` when rule doc missing ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.5.2 (2023-10-15)

#### :bug: Bug Fix
* [#486](https://github.com/eslint-community/eslint-doc-generator/pull/486) Include any mandatory sections when generating new rule docs with `--init-rule-docs` and `--rule-doc-section-include` ([@bmish](https://github.com/bmish))
* [#485](https://github.com/eslint-community/eslint-doc-generator/pull/485) Initialize rule doc options section when using `--init-rule-docs` ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.5.1 (2023-10-13)

#### :bug: Bug Fix
* [#482](https://github.com/eslint-community/eslint-doc-generator/pull/482) Sanitize newlines and pipes from markdown table cells ([@bmish](https://github.com/bmish))
* [#484](https://github.com/eslint-community/eslint-doc-generator/pull/484) Don't exit with failure about missing mention of rule option when rule option list was just generated ([@bmish](https://github.com/bmish))
* [#483](https://github.com/eslint-community/eslint-doc-generator/pull/483) Show rule option list "Default" column even with only a falsy value ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.5.0 (2023-10-12)

#### :rocket: Enhancement
* [#481](https://github.com/eslint-community/eslint-doc-generator/pull/481) Support auto-generated rule options lists ([@bmish](https://github.com/bmish))
* [#480](https://github.com/eslint-community/eslint-doc-generator/pull/480) Support auto-generated config lists ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.4.3 (2023-02-04)

#### :bug: Bug Fix
* [#409](https://github.com/eslint-community/eslint-doc-generator/pull/409) Sort emojis before badges for configs in rules list for better aesthetics ([@bmish](https://github.com/bmish))
* [#411](https://github.com/eslint-community/eslint-doc-generator/pull/411) Fix loading of plugin with JSON entry point ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.4.2 (2023-01-10)

#### :bug: Bug Fix
* [#388](https://github.com/eslint-community/eslint-doc-generator/pull/388) Clarify error message when rule option is missing from rule doc ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#379](https://github.com/eslint-community/eslint-doc-generator/pull/379) Add column for default value to readme options table ([@bmish](https://github.com/bmish))
* [#326](https://github.com/eslint-community/eslint-doc-generator/pull/326) Mention markdownlint compatibility ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.4.1 (2022-12-27)

#### :bug: Bug Fix
* [#375](https://github.com/eslint-community/eslint-doc-generator/pull/375) Use concise relative paths for rule links ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.4.0 (2022-12-26)

#### :rocket: Enhancement
* [#369](https://github.com/eslint-community/eslint-doc-generator/pull/369) Support a user-defined function for `--url-rule-doc` option ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.3.0 (2022-12-23)

#### :bug: Bug Fix
* [#368](https://github.com/eslint-community/eslint-doc-generator/pull/368) Add new option `--config-format` ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.2.1 (2022-12-22)

#### :bug: Bug Fix
* [#367](https://github.com/eslint-community/eslint-doc-generator/pull/367) Ensure correct link used for deprecated rule replacement link when replacement rule is from ESLint core or third-party plugin ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.2.0 (2022-12-21)

#### :rocket: Enhancement
* [#365](https://github.com/eslint-community/eslint-doc-generator/pull/365) Support a user-defined function for `--rule-list-split` option ([@bmish](https://github.com/bmish))
* [#351](https://github.com/eslint-community/eslint-doc-generator/pull/351) Support splitting by multiple properties in `--rule-list-split` option ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#357](https://github.com/eslint-community/eslint-doc-generator/pull/357) Ensure `deprecated`/`schema` properties are detected from deprecated, function-style rules ([@bmish](https://github.com/bmish))
* [#355](https://github.com/eslint-community/eslint-doc-generator/pull/355) Improve type for `configEmoji` option ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#364](https://github.com/eslint-community/eslint-doc-generator/pull/364) Refactor functions for generating and splitting the rules list ([@bmish](https://github.com/bmish))
* [#356](https://github.com/eslint-community/eslint-doc-generator/pull/356) Refactor how rules are passed around in codebase ([@bmish](https://github.com/bmish))
* [#352](https://github.com/eslint-community/eslint-doc-generator/pull/352) Better normalize `pathRuleList` option internally ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.1.0 (2022-12-16)

#### :rocket: Enhancement
* [#350](https://github.com/eslint-community/eslint-doc-generator/pull/350) Add rule doc notice type for rule description ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#349](https://github.com/eslint-community/eslint-doc-generator/pull/349) Improve detection of named options to be mentioned in rule docs ([@bmish](https://github.com/bmish))
* [#344](https://github.com/eslint-community/eslint-doc-generator/pull/344) Hide stack trace when throwing exception ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#342](https://github.com/eslint-community/eslint-doc-generator/pull/342) Add table of contents to readme ([@bmish](https://github.com/bmish))
* [#336](https://github.com/eslint-community/eslint-doc-generator/pull/336) Add table documenting types of notices and columns ([@bmish](https://github.com/bmish))
* [#332](https://github.com/eslint-community/eslint-doc-generator/pull/332) Mention complementary rule `eslint-plugin/require-meta-docs-url` ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#345](https://github.com/eslint-community/eslint-doc-generator/pull/345) Enable type-aware linting ([@bmish](https://github.com/bmish))
* [#333](https://github.com/eslint-community/eslint-doc-generator/pull/333) Improve comments for emoji definitions ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.0.2 (2022-12-01)

#### :bug: Bug Fix
* [#322](https://github.com/eslint-community/eslint-doc-generator/pull/322) Use string union types instead of enums for better TypeScript compatibility with public config file type ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.0.1 (2022-12-01)

#### :bug: Bug Fix
* [#317](https://github.com/eslint-community/eslint-doc-generator/pull/317) More robust handling of boolean-equivalent strings for parsing boolean CLI options and boolean properties in `--rule-list-split` ([@bmish](https://github.com/bmish))
* [#314](https://github.com/eslint-community/eslint-doc-generator/pull/314) Handle additional types of variable casing when creating sub-list headers with `--rule-list-split` ([@bmish](https://github.com/bmish))
* [#309](https://github.com/eslint-community/eslint-doc-generator/pull/309) Fully utilize `readonly` modifier for nested array types ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#312](https://github.com/eslint-community/eslint-doc-generator/pull/312) Add semantic versioning policy ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#316](https://github.com/eslint-community/eslint-doc-generator/pull/316) Use external library to retrieve an arbitrary property from a rule ([@bmish](https://github.com/bmish))
* [#313](https://github.com/eslint-community/eslint-doc-generator/pull/313) Avoid recreating `readonly` array when passing to markdown-table ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v1.0.0 (2022-11-28)

Now considered stable and already successfully adopted in many of the top ESLint plugins.


## v0.28.1 (2022-11-28)

#### :bug: Bug Fix
* [#303](https://github.com/eslint-community/eslint-doc-generator/pull/303) Use TypeScript `readonly` modifier for external/array types ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#302](https://github.com/eslint-community/eslint-doc-generator/pull/302) Tweak README ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.28.0 (2022-11-27)

#### :boom: Breaking Change
* [#301](https://github.com/eslint-community/eslint-doc-generator/pull/301) Rename `--split-by` option to `--rule-list-split` ([@bmish](https://github.com/bmish))
* [#300](https://github.com/eslint-community/eslint-doc-generator/pull/300) Use arrays instead of CSV strings for config file types ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#299](https://github.com/eslint-community/eslint-doc-generator/pull/299) Add JSDocs for exported `GenerateOptions` type ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.27.1 (2022-11-27)

#### :bug: Bug Fix
* [#298](https://github.com/eslint-community/eslint-doc-generator/pull/298) Use correct path for exported types ([@SimenB](https://github.com/SimenB))

#### Committers: 1
- Simen Bekkhus ([@SimenB](https://github.com/SimenB))


## v0.27.0 (2022-11-27)

#### :rocket: Enhancement
* [#285](https://github.com/eslint-community/eslint-doc-generator/pull/285) Add `postprocess` config file option (useful for applying prettier formatting) ([@G-Rath](https://github.com/G-Rath))
* [#296](https://github.com/eslint-community/eslint-doc-generator/pull/296) Always display plugin prefix in deprecated rule replacement rule name ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#286](https://github.com/eslint-community/eslint-doc-generator/pull/286) Remove extra closing quote from error message ([@G-Rath](https://github.com/G-Rath))

#### :house: Internal
* [#287](https://github.com/eslint-community/eslint-doc-generator/pull/287) Require full function coverage ([@G-Rath](https://github.com/G-Rath))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Gareth Jones ([@G-Rath](https://github.com/G-Rath))


## v0.26.1 (2022-11-25)

#### :bug: Bug Fix
* [#279](https://github.com/eslint-community/eslint-doc-generator/pull/279) Ensure deprecated rule replacement link respects `--path-rule-doc` ([@bmish](https://github.com/bmish))
* [#280](https://github.com/eslint-community/eslint-doc-generator/pull/280) Fix default rules list path of `README.md` ([@bmish](https://github.com/bmish))
* [#275](https://github.com/eslint-community/eslint-doc-generator/pull/275) Fix rule links when specifying a rule list file in a subdirectory with `--path-rule-list` ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#283](https://github.com/eslint-community/eslint-doc-generator/pull/283) Add empty `prettier` config ([@G-Rath](https://github.com/G-Rath))
* [#282](https://github.com/eslint-community/eslint-doc-generator/pull/282) Harden CI workflows ([@G-Rath](https://github.com/G-Rath))
* [#281](https://github.com/eslint-community/eslint-doc-generator/pull/281) Ensure TypeScript is checked by CodeQL ([@G-Rath](https://github.com/G-Rath))
* [#278](https://github.com/eslint-community/eslint-doc-generator/pull/278) Enable unicode regexp flag ([@G-Rath](https://github.com/G-Rath))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Gareth Jones ([@G-Rath](https://github.com/G-Rath))


## v0.26.0 (2022-11-23)

#### :rocket: Enhancement
* [#271](https://github.com/eslint-community/eslint-doc-generator/pull/271) Use correct header level when splitting rules list into sub-lists with `--split-by` ([@bmish](https://github.com/bmish))
* [#270](https://github.com/eslint-community/eslint-doc-generator/pull/270) Allow specifying multiple rules lists with `--path-rule-list` ([@bmish](https://github.com/bmish))
* [#269](https://github.com/eslint-community/eslint-doc-generator/pull/269) Allow content above rule doc title ([@bmish](https://github.com/bmish))
* [#264](https://github.com/eslint-community/eslint-doc-generator/pull/264) Export type for config file ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#263](https://github.com/eslint-community/eslint-doc-generator/pull/263) Reorganize files and functions ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.25.0 (2022-11-21)

#### :rocket: Enhancement
* [#262](https://github.com/eslint-community/eslint-doc-generator/pull/262) Add new option `--url-rule-doc` ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.24.0 (2022-11-19)

#### :boom: Breaking Change
* [#259](https://github.com/eslint-community/eslint-doc-generator/pull/259) Add prefix to link name for readme config badge ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#243](https://github.com/eslint-community/eslint-doc-generator/pull/243) Add test code coverage badge ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#256](https://github.com/eslint-community/eslint-doc-generator/pull/256) Add test for variation of scoped plugin name ([@bmish](https://github.com/bmish))
* [#251](https://github.com/eslint-community/eslint-doc-generator/pull/251) Add test that external rules are ignored ([@bmish](https://github.com/bmish))
* [#249](https://github.com/eslint-community/eslint-doc-generator/pull/249) Use TypeScript `satisfies` operator for option defaults ([@bmish](https://github.com/bmish))
* [#241](https://github.com/eslint-community/eslint-doc-generator/pull/241) Ensure tests are type-checked but not published ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.23.0 (2022-11-18)

#### :rocket: Enhancement
* [#240](https://github.com/eslint-community/eslint-doc-generator/pull/240) Add option `--init-rule-docs` ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))

#### :house: Internal
* [#239](https://github.com/eslint-community/eslint-doc-generator/pull/239) Split up tests into multiple test files ([@bmish](https://github.com/bmish))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Josh Goldberg ([@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg))


## v0.22.0 (2022-11-17)

#### :rocket: Enhancement
* [#232](https://github.com/eslint-community/eslint-doc-generator/pull/232) Add optional `options` column and notice to indicate whether a rule is configurable ([@bmish](https://github.com/bmish))
* [#141](https://github.com/eslint-community/eslint-doc-generator/pull/141) More robust loading of CJS plugins using `require()` ([@bmish](https://github.com/bmish))
* [#234](https://github.com/eslint-community/eslint-doc-generator/pull/234) Support absolute path for plugin root CLI argument ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#233](https://github.com/eslint-community/eslint-doc-generator/pull/233) Target `ES2020` for TypeScript output ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.21.0 (2022-11-15)

#### :rocket: Enhancement
* [#229](https://github.com/eslint-community/eslint-doc-generator/pull/229) Add optional rule list column `fixableAndHasSuggestions` ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#230](https://github.com/eslint-community/eslint-doc-generator/pull/230) Remove special case handling for rule doc notice `fixableAndHasSuggestions` ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.20.0 (2022-11-15)

#### :rocket: Enhancement
* [#223](https://github.com/eslint-community/eslint-doc-generator/pull/223) Implement config file support ([@bmish](https://github.com/bmish))
* [#222](https://github.com/eslint-community/eslint-doc-generator/pull/222) Add `--path-rule-doc` and `--path-rule-list` options ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#221](https://github.com/eslint-community/eslint-doc-generator/pull/221) Add CodeQL ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.19.1 (2022-11-09)

#### :bug: Bug Fix
* [#220](https://github.com/eslint-community/eslint-doc-generator/pull/220) Fix deprecated rule replacement rule link with nested rule name ([@bmish](https://github.com/bmish))
* [#218](https://github.com/eslint-community/eslint-doc-generator/pull/218) Fix deprecated rule replacement rule link when plugin prefix included in replacement rule name ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#208](https://github.com/eslint-community/eslint-doc-generator/pull/208) Move examples into separate files ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#211](https://github.com/eslint-community/eslint-doc-generator/pull/211) Update Dependabot URL in comment ([@ddzz](https://github.com/ddzz))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Darius Dzien ([@ddzz](https://github.com/ddzz))


## v0.19.0 (2022-11-02)

#### :boom: Breaking Change
* [#205](https://github.com/eslint-community/eslint-doc-generator/pull/205) Redesign information architecture of rules table columns and rule doc notices for representing rule configs/severities ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.18.2 (2022-11-01)

#### :bug: Bug Fix
* [#203](https://github.com/eslint-community/eslint-doc-generator/pull/203) Redo fix to ensure notation for config that warns/disables a rule does not wrap to two lines in rules table cell ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.18.1 (2022-11-01)

#### :bug: Bug Fix
* [#202](https://github.com/eslint-community/eslint-doc-generator/pull/202) Ensure config emoji isn't missing in multi-sentence rule doc notice ([@bmish](https://github.com/bmish))
* [#201](https://github.com/eslint-community/eslint-doc-generator/pull/201) Ensure notation for config that warns/disables a rule does not wrap to separate line ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.18.0 (2022-10-31)

#### :rocket: Enhancement
* [#198](https://github.com/eslint-community/eslint-doc-generator/pull/198) Indicate when a rule is set to off/warn by a config in the README rules list ([@bmish](https://github.com/bmish))
* [#199](https://github.com/eslint-community/eslint-doc-generator/pull/199) Add default emoji for TypeScript configs, adjust default emoji for accessibility configs ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#200](https://github.com/eslint-community/eslint-doc-generator/pull/200) Demonstrage usage with a build step or prettier formatting ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.17.0 (2022-10-30)

#### :rocket: Enhancement
* [#187](https://github.com/eslint-community/eslint-doc-generator/pull/187) Show diff when `--check` fails because docs are out-of-sync ([@bmish](https://github.com/bmish))
* [#188](https://github.com/eslint-community/eslint-doc-generator/pull/188) Reduce complexity by removing prettier formatting of outputted markdown ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#190](https://github.com/eslint-community/eslint-doc-generator/pull/190) Encourage complementary use of `eslint-plugin/require-meta-docs-description` lint rule in readme ([@bmish](https://github.com/bmish))
* [#183](https://github.com/eslint-community/eslint-doc-generator/pull/183) Mention popular plugins that use this ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.16.0 (2022-10-28)

#### :rocket: Enhancement
* [#180](https://github.com/eslint-community/eslint-doc-generator/pull/180) Indicate which configs warn for a rule ([@bmish](https://github.com/bmish))
* [#178](https://github.com/eslint-community/eslint-doc-generator/pull/178) Add option `--rule-doc-section-options` ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#181](https://github.com/eslint-community/eslint-doc-generator/pull/181) Handle rule with no `meta` object ([@bmish](https://github.com/bmish))
* [#177](https://github.com/eslint-community/eslint-doc-generator/pull/177) Throw error when trying to use general configs emoji for a config when multiple configs are present ([@bmish](https://github.com/bmish))
* [#176](https://github.com/eslint-community/eslint-doc-generator/pull/176) Also check for escaped version of option name in rule doc for rules with options ([@bmish](https://github.com/bmish))
* [#175](https://github.com/eslint-community/eslint-doc-generator/pull/175) Use correct rule doc title format fallback when rule missing description ([@bmish](https://github.com/bmish))
* [#172](https://github.com/eslint-community/eslint-doc-generator/pull/172) Use actual nbsp character instead of HTML entity when avoiding wrapping rule names in rules list ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.15.0 (2022-10-26)

#### :rocket: Enhancement
* [#162](https://github.com/eslint-community/eslint-doc-generator/pull/162) Add `--split-by` option ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#170](https://github.com/eslint-community/eslint-doc-generator/pull/170) Use code-style around rule name in rule doc title only when description also present ([@bmish](https://github.com/bmish))
* [#169](https://github.com/eslint-community/eslint-doc-generator/pull/169) Use case-insensitive sorting for rules, configs, and lists ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#161](https://github.com/eslint-community/eslint-doc-generator/pull/161) Fix example script in README ([@ddzz](https://github.com/ddzz))

#### :house: Internal
* [#158](https://github.com/eslint-community/eslint-doc-generator/pull/158) Fix ts-jest deprecation warning ([@ddzz](https://github.com/ddzz))
* [#160](https://github.com/eslint-community/eslint-doc-generator/pull/160) Fix `lint:js:fix` script ([@ddzz](https://github.com/ddzz))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Darius Dzien ([@ddzz](https://github.com/ddzz))


## v0.14.0 (2022-10-21)

#### :boom: Breaking Change
* [#155](https://github.com/eslint-community/eslint-doc-generator/pull/155) Indicate that content is auto-generated in marker comments ([@bmish](https://github.com/bmish))

#### :rocket: Enhancement
* [#156](https://github.com/eslint-community/eslint-doc-generator/pull/156) Indicate which configs disable a rule ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#154](https://github.com/eslint-community/eslint-doc-generator/pull/154) Use code styling for replacement rule name in deprecated rule notice ([@bmish](https://github.com/bmish))
* [#153](https://github.com/eslint-community/eslint-doc-generator/pull/153) Avoid potentially having two legends for the same config emoji ([@bmish](https://github.com/bmish))
* [#152](https://github.com/eslint-community/eslint-doc-generator/pull/152) Use `markdown-table` for generating rules list ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.13.0 (2022-10-20)

#### :rocket: Enhancement
* [#149](https://github.com/eslint-community/eslint-doc-generator/pull/149) Add consolidated rule doc notice for fixable and suggestions ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#148](https://github.com/eslint-community/eslint-doc-generator/pull/148) Avoid wrapping name column in rules list ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.12.0 (2022-10-19)

#### :rocket: Enhancement
* [#139](https://github.com/eslint-community/eslint-doc-generator/pull/139) Add `--rule-doc-notices` option ([@bmish](https://github.com/bmish))
* [#136](https://github.com/eslint-community/eslint-doc-generator/pull/136) Add default emojis for common configs ([@bmish](https://github.com/bmish))
* [#134](https://github.com/eslint-community/eslint-doc-generator/pull/134) Add optional column and notice for rule type ([@bmish](https://github.com/bmish))
* [#137](https://github.com/eslint-community/eslint-doc-generator/pull/137) Support removing the default emoji for a config with `--config-emoji` option ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#147](https://github.com/eslint-community/eslint-doc-generator/pull/147) Hide ignored configs from rule list legend ([@bmish](https://github.com/bmish))
* [#140](https://github.com/eslint-community/eslint-doc-generator/pull/140) Handle plugins using `exports` in package.json ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#130](https://github.com/eslint-community/eslint-doc-generator/pull/130) Add motivation section to README ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.11.0 (2022-10-13)

#### :rocket: Enhancement
* [#129](https://github.com/eslint-community/eslint-doc-generator/pull/129) Add `--rule-list-columns` option ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.10.0 (2022-10-12)

#### :rocket: Enhancement
* [#126](https://github.com/eslint-community/eslint-doc-generator/pull/126) Add rule doc notice when type-checking is required ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#125](https://github.com/eslint-community/eslint-doc-generator/pull/125) Tweak suggestions documentation link ([@bmish](https://github.com/bmish))
* [#118](https://github.com/eslint-community/eslint-doc-generator/pull/118) Tweak fixable documentation link ([@MichaelDeBoey](https://github.com/MichaelDeBoey))

#### :memo: Documentation
* [#119](https://github.com/eslint-community/eslint-doc-generator/pull/119) Tweak readme examples ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#127](https://github.com/eslint-community/eslint-doc-generator/pull/127) Refactor to ensure a rule doc notice is defined for each rule list column ([@bmish](https://github.com/bmish))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Michaël De Boey ([@MichaelDeBoey](https://github.com/MichaelDeBoey))


## v0.9.0 (2022-10-10)

#### :rocket: Enhancement
* [#116](https://github.com/eslint-community/eslint-doc-generator/pull/116) Add `--config-emoji` option ([@bmish](https://github.com/bmish))
* [#109](https://github.com/eslint-community/eslint-doc-generator/pull/109) Add `--check` option ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#108](https://github.com/eslint-community/eslint-doc-generator/pull/108) Improve README especially about config options ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.8.1 (2022-10-10)

#### :bug: Bug Fix
* [#106](https://github.com/eslint-community/eslint-doc-generator/pull/106) Handle lowercase `readme.md` ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.8.0 (2022-10-09)

#### :rocket: Enhancement
* [#104](https://github.com/eslint-community/eslint-doc-generator/pull/104) Add `desc` format to `--rule-doc-title-format` option ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#103](https://github.com/eslint-community/eslint-doc-generator/pull/103) Left-align rule list column headers ([@bmish](https://github.com/bmish))
* [#102](https://github.com/eslint-community/eslint-doc-generator/pull/102) Use `Name` instead of `Rule` for rule list column header ([@bmish](https://github.com/bmish))
* [#101](https://github.com/eslint-community/eslint-doc-generator/pull/101) Improve notice/legend wording consistency and conciseness ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.7.0 (2022-10-09)

#### :rocket: Enhancement
* [#93](https://github.com/eslint-community/eslint-doc-generator/pull/93) Add `--ignore-config` option ([@bmish](https://github.com/bmish))
* [#92](https://github.com/eslint-community/eslint-doc-generator/pull/92) Add `--ignore-deprecated-rules` option ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.6.0 (2022-10-09)

#### :rocket: Enhancement
* [#84](https://github.com/eslint-community/eslint-doc-generator/pull/84) Add `--rule-doc-section-include` and `--rule-doc-section-exclude` options ([@bmish](https://github.com/bmish))
* [#83](https://github.com/eslint-community/eslint-doc-generator/pull/83) Add `--rule-doc-title-format` option ([@bmish](https://github.com/bmish))
* [#82](https://github.com/eslint-community/eslint-doc-generator/pull/82) Add `--url-configs` option ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#87](https://github.com/eslint-community/eslint-doc-generator/pull/87) Handle when prettier is not installed ([@bmish](https://github.com/bmish))
* [#81](https://github.com/eslint-community/eslint-doc-generator/pull/81) Throw error when missing README.md ([@bmish](https://github.com/bmish))
* [#80](https://github.com/eslint-community/eslint-doc-generator/pull/80) Throw error when missing rule doc ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.5.0 (2022-10-08)

#### :rocket: Enhancement
* [#75](https://github.com/eslint-community/eslint-doc-generator/pull/75) Automatically generate legend for rules list ([@bmish](https://github.com/bmish))
* [#76](https://github.com/eslint-community/eslint-doc-generator/pull/76) Hide empty columns from rules list ([@bmish](https://github.com/bmish))
* [#73](https://github.com/eslint-community/eslint-doc-generator/pull/73) Hide config column from rules list when no configs present and move deprecations to a separate column ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#72](https://github.com/eslint-community/eslint-doc-generator/pull/72) Improve section header detection ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#74](https://github.com/eslint-community/eslint-doc-generator/pull/74) Tweak README ([@ddzz](https://github.com/ddzz))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Darius Dzien ([@ddzz](https://github.com/ddzz))


## v0.4.0 (2022-10-07)

#### :bug: Bug Fix
* [#70](https://github.com/eslint-community/eslint-doc-generator/pull/70) Handle string `extends` from ESLint config, deprecated/function-style rules, missing rule descriptions (and use actual ESLint types to detect issues like these) ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.3.5 (2022-10-06)

#### :bug: Bug Fix
* [#67](https://github.com/eslint-community/eslint-doc-generator/pull/67) Handle rules enabled with options ([@bmish](https://github.com/bmish))
* [#65](https://github.com/eslint-community/eslint-doc-generator/pull/65) Handle config overrides ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.3.4 (2022-10-05)

#### :bug: Bug Fix
* [#62](https://github.com/eslint-community/eslint-doc-generator/pull/62) Fix plugin importing on Windows ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.3.3 (2022-10-04)

#### :bug: Bug Fix
* [#60](https://github.com/eslint-community/eslint-doc-generator/pull/60) Ignore external configs during ESLint config resolution ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.3.2 (2022-10-04)

#### :bug: Bug Fix
* [#59](https://github.com/eslint-community/eslint-doc-generator/pull/59) Resolve `extends` in ESLint configs ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#50](https://github.com/eslint-community/eslint-doc-generator/pull/50) Add test for CJS plugin file ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.3.1 (2022-10-03)

#### :bug: Bug Fix
* [#48](https://github.com/eslint-community/eslint-doc-generator/pull/48) Only apply prettier formatting to managed doc content ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.3.0 (2022-10-02)

#### :bug: Bug Fix
* [#47](https://github.com/eslint-community/eslint-doc-generator/pull/47) Throw exception when plugin does not export a `rules` object ([@bmish](https://github.com/bmish))
* [#45](https://github.com/eslint-community/eslint-doc-generator/pull/45) Handle various possible names for options section when checking for its presence in rule doc ([@bmish](https://github.com/bmish))
* [#43](https://github.com/eslint-community/eslint-doc-generator/pull/43) Improved detection for README rules section when marker comments are missing ([@bmish](https://github.com/bmish))
* [#42](https://github.com/eslint-community/eslint-doc-generator/pull/42) Allow plugin to omit configs ([@bmish](https://github.com/bmish))
* [#41](https://github.com/eslint-community/eslint-doc-generator/pull/41) Handle scoped plugin names ([@bmish](https://github.com/bmish))
* [#40](https://github.com/eslint-community/eslint-doc-generator/pull/40) Description in rule doc title should begin with a capital letter and omit a trailing period ([@bmish](https://github.com/bmish))
* [#39](https://github.com/eslint-community/eslint-doc-generator/pull/39) Add plugin prefix to rule name in rule doc title ([@bmish](https://github.com/bmish))
* [#28](https://github.com/eslint-community/eslint-doc-generator/pull/28) Use prettier's own config resolution when formatting docs ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.2.0 (2022-10-01)

#### :rocket: Enhancement
* [#17](https://github.com/eslint-community/eslint-doc-generator/pull/17) Automatically insert missing rule list markers in README rules section ([@bmish](https://github.com/bmish))

#### :bug: Bug Fix
* [#18](https://github.com/eslint-community/eslint-doc-generator/pull/18) Allow deprecated rules to forgo a doc file or description ([@bmish](https://github.com/bmish))
* [#12](https://github.com/eslint-community/eslint-doc-generator/pull/12) Avoid creating a duplicate title when rule doc is missing marker comment ([@bmish](https://github.com/bmish))
* [#8](https://github.com/eslint-community/eslint-doc-generator/pull/8) Use `recommended` config emoji in rule doc when rule is only in that config ([@bmish](https://github.com/bmish))
* [#7](https://github.com/eslint-community/eslint-doc-generator/pull/7) Use `recommended` config emoji in rules list header when no custom configs present ([@bmish](https://github.com/bmish))

#### :memo: Documentation
* [#19](https://github.com/eslint-community/eslint-doc-generator/pull/19) Tweak README ([@bmish](https://github.com/bmish))
* [#11](https://github.com/eslint-community/eslint-doc-generator/pull/11) Provide rule list marker comments in error message when missing from README ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#6](https://github.com/eslint-community/eslint-doc-generator/pull/6) Move emojis into centralized file ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.1.1 (2022-10-01)

#### :bug: Bug Fix
* [#5](https://github.com/eslint-community/eslint-doc-generator/pull/5) Add missing Node shebang to binary ([@bmish](https://github.com/bmish))

#### Committers: 1
- Bryan Mishkin ([@bmish](https://github.com/bmish))


## v0.1.0 (2022-10-01)

#### :rocket: Enhancement
* [#2](https://github.com/eslint-community/eslint-doc-generator/pull/2) Initial implementation ([@bmish](https://github.com/bmish))

#### :house: Internal
* [#1](https://github.com/eslint-community/eslint-doc-generator/pull/1) Add Dependabot config ([@ddzz](https://github.com/ddzz))

#### Committers: 2
- Bryan Mishkin ([@bmish](https://github.com/bmish))
- Darius Dzien ([@ddzz](https://github.com/ddzz))
