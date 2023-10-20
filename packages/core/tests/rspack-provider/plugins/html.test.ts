import { expect, describe, it } from 'vitest';
import { pluginEntry } from '@src/plugins/entry';
import { pluginHtml } from '@src/plugins/html';
import { createStubRsbuild, matchPlugin } from '@rsbuild/test-helper';

describe('plugins/html', () => {
  it('should register html plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should register nonce plugin when using security.nonce', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        security: {
          nonce: 'test-nonce',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(matchPlugin(bundlerConfigs[0], 'HtmlNoncePlugin')).toBeDefined();
  });

  it('should register crossorigin plugin when using html.crossorigin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          crossorigin: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(
      matchPlugin(bundlerConfigs[0], 'HtmlCrossOriginPlugin'),
    ).toBeDefined();
  });

  it('should register appIcon plugin when using html.appIcon', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          appIcon: './src/assets/icon.png',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(matchPlugin(bundlerConfigs[0], 'HtmlAppIconPlugin')).toBeDefined();
  });

  it('should allow to set favicon by html.favicon option', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          favicon: './src/favicon.ico',
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should register faviconUrl plugin when html.favicon is a URL', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          favicon: 'https://www.foo.com/favicon.ico',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(
      matchPlugin(bundlerConfigs[0], 'HtmlFaviconUrlPlugin'),
    ).toBeDefined();
  });

  it('should allow to set inject by html.inject option', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          inject: 'body',
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should enable minify in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to modify plugin options by tools.htmlPlugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        tools: {
          htmlPlugin(_config, utils) {
            expect(utils.entryName).toEqual('main');
            return {
              inject: true,
            };
          },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should support multi entry', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      rsbuildConfig: {
        html: {
          template: 'bar',
          templateByEntries: { main: 'foo' },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
    expect(matchPlugin(bundlerConfigs[0], 'HtmlRspackPlugin')).toBeDefined();
  });

  it('should allow to disable html plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        tools: {
          htmlPlugin: false,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(matchPlugin(bundlerConfigs[0], 'HtmlRspackPlugin')).toBeNull();
  });

  it('should disable html plugin when htmlPlugin is an array and contains false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        tools: {
          htmlPlugin: [{}, false],
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(matchPlugin(bundlerConfigs[0], 'HtmlRspackPlugin')).toBeNull();
  });
});