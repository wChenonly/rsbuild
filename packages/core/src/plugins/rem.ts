import _ from '@modern-js/utils/lodash';
import {
  getDistPath,
  AutoSetRootFontSizePlugin,
  getSharedPkgCompiledPath,
  type DefaultRsbuildPlugin,
  type RemOptions,
  type PxToRemOptions,
} from '@rsbuild/shared';

const defaultOptions: RemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export const pluginRem = (): DefaultRsbuildPlugin => ({
  name: 'plugin-rem',

  pre: ['plugin-css', 'plugin-less', 'plugin-sass', 'plugin-stylus'],

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isServer, isWebWorker, HtmlPlugin }) => {
        const config = api.getNormalizedConfig();
        const {
          output: { convertToRem },
        } = config;

        if (!convertToRem || isServer || isWebWorker) {
          return;
        }

        const userOptions = {
          ...defaultOptions,
          ...(typeof convertToRem === 'boolean' ? {} : convertToRem),
        };

        // handle css
        const { default: PxToRemPlugin } = (await import(
          getSharedPkgCompiledPath('postcss-pxtorem')
        )) as {
          default: (_opts: PxToRemOptions) => any;
        };

        const applyRules = [
          CHAIN_ID.RULE.CSS,
          CHAIN_ID.RULE.LESS,
          CHAIN_ID.RULE.SASS,
          CHAIN_ID.RULE.STYLUS,
        ];
        const getPxToRemPlugin = () =>
          PxToRemPlugin({
            rootValue: userOptions.rootFontSize,
            unitPrecision: 5,
            propList: ['*'],
            ..._.cloneDeep(userOptions.pxtorem || {}),
          });
        // Deep copy options to prevent unexpected behavior.
        applyRules.forEach((name) => {
          chain.module.rules.has(name) &&
            chain.module
              .rule(name)
              .use(CHAIN_ID.USE.POSTCSS)
              .tap((options = {}) => ({
                ...options,
                postcssOptions: {
                  ...(options.postcssOptions || {}),
                  plugins: [
                    ...(options.postcssOptions?.plugins || []),
                    getPxToRemPlugin(),
                  ],
                },
              }));
        });

        // handle runtime (html)
        if (!userOptions.enableRuntime) {
          return;
        }

        const entries = Object.keys(chain.entryPoints.entries() || {});
        const distDir = getDistPath(config.output, 'js');

        chain
          .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
          .use(AutoSetRootFontSizePlugin, [
            userOptions,
            entries,
            HtmlPlugin,
            distDir,
          ]);
      },
    );
  },
});