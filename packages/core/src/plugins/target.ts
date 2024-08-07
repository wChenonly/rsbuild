import * as toESVersion from 'browserslist-to-es-version';
import type { RsbuildPlugin } from '../types';

export const pluginTarget = (): RsbuildPlugin => ({
  name: 'rsbuild:target',

  setup(api) {
    api.modifyBundlerChain({
      order: 'pre',
      handler: async (chain, { target, environment }) => {
        if (target === 'node') {
          chain.target('node');
          return;
        }

        const { browserslist } = environment;
        const esVersion = toESVersion.browserslistToESVersion(browserslist);

        if (target === 'web-worker') {
          chain.target(['webworker', `es${esVersion}`]);
          return;
        }

        chain.target(['web', `es${esVersion}`]);
      },
    });
  },
});
