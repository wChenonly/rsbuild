import {
  mergeRegex,
  applyScriptCondition,
  JS_REGEX,
  TS_REGEX,
} from '@rsbuild/shared';
import { cloneDeep, isEqual } from '@modern-js/utils/lodash';
import { RsbuildPlugin, NormalizedConfig } from '../types';
import type { BabelOptions } from '@modern-js/types';

/**
 * The `@babel/preset-typescript` default options.
 */
export const DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS = {
  allowNamespaces: true,
  allExtensions: true,
  allowDeclareFields: true,
  // aligns Babel's behavior with TypeScript's default behavior.
  // https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums
  optimizeConstEnums: true,
  isTSX: true,
};

export const pluginBabel = (): RsbuildPlugin => ({
  name: 'plugin-babel',
  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isProd, getCompiledPath }) => {
        const config = api.getNormalizedConfig();
        if (!config.tools.babel) {
          // we would not use babel loader in rspack, unless user need to use.
          return;
        }

        const { applyUserBabelConfig } = await import('@modern-js/utils');

        const getBabelOptions = (config: NormalizedConfig) => {
          // 1. Create babel utils function about include/exclude,
          const includes: Array<string | RegExp> = [];
          const excludes: Array<string | RegExp> = [];

          const babelUtils = {
            addIncludes(items: string | RegExp | Array<string | RegExp>) {
              if (Array.isArray(items)) {
                includes.push(...items);
              } else {
                includes.push(items);
              }
            },
            addExcludes(items: string | RegExp | Array<string | RegExp>) {
              if (Array.isArray(items)) {
                excludes.push(...items);
              } else {
                excludes.push(items);
              }
            },
          };

          const baseConfig = {
            plugins: [],
            presets: [
              [
                require.resolve('@babel/preset-typescript'),
                DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS,
              ],
            ],
          };

          const userBabelConfig = applyUserBabelConfig(
            cloneDeep(baseConfig),
            config.tools.babel,
            babelUtils,
          );

          const notModify =
            isEqual(baseConfig, userBabelConfig) &&
            !includes?.length &&
            !excludes?.length;

          if (notModify) {
            return {};
          }

          const babelOptions: BabelOptions = {
            babelrc: false,
            configFile: false,
            compact: isProd,
            ...userBabelConfig,
          };

          return {
            babelOptions,
            includes,
            excludes,
          };
        };

        const {
          babelOptions,
          includes = [],
          excludes = [],
        } = getBabelOptions(config);

        if (!babelOptions) {
          return;
        }

        const rule = chain.module.rule(CHAIN_ID.RULE.JS);

        applyScriptCondition({
          rule,
          config,
          context: api.context,
          includes,
          excludes,
        });

        rule
          .test(mergeRegex(JS_REGEX, TS_REGEX))
          .use(CHAIN_ID.USE.BABEL)
          .loader(getCompiledPath('babel-loader'))
          .options(babelOptions);
      },
    );
  },
});