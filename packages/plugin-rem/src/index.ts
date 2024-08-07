import type { PostCSSPlugin, RsbuildPlugin } from '@rsbuild/core';
import deepmerge from 'deepmerge';
import type { PluginRemOptions, PxToRemOptions } from './types';

const defaultOptions: PluginRemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export type { PluginRemOptions };

export const PLUGIN_REM_NAME = 'rsbuild:rem';

export const pluginRem = (options: PluginRemOptions = {}): RsbuildPlugin => ({
  name: PLUGIN_REM_NAME,

  setup(api) {
    const userOptions = {
      ...defaultOptions,
      ...options,
    };

    const getPxToRemPlugin = async () => {
      const { default: pxToRemPlugin } = (await import(
        '../compiled/postcss-pxtorem/index.js'
      )) as {
        default: (_opts: PxToRemOptions) => PostCSSPlugin;
      };

      return pxToRemPlugin({
        rootValue: userOptions.rootFontSize,
        unitPrecision: 5,
        propList: ['*'],
        ...(userOptions.pxtorem ? deepmerge({}, userOptions.pxtorem) : {}),
      });
    };

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      const remPlugin = await getPxToRemPlugin();
      return mergeRsbuildConfig(config, {
        tools: {
          postcss(_, { addPlugins }) {
            addPlugins(remPlugin);
          },
        },
      });
    });

    api.modifyBundlerChain(
      async (chain, { target, CHAIN_ID, environment, HtmlPlugin }) => {
        if (target !== 'web' || !userOptions.enableRuntime) {
          return;
        }

        const { AutoSetRootFontSizePlugin } = await import(
          './AutoSetRootFontSizePlugin'
        );

        const entries = Object.keys(chain.entryPoints.entries() || {});
        const { config } = environment;
        const distDir = config.output.distPath.js;

        chain
          .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
          .use(AutoSetRootFontSizePlugin, [
            userOptions,
            entries,
            HtmlPlugin,
            distDir,
            config.html.scriptLoading,
          ]);
      },
    );
  },
});
