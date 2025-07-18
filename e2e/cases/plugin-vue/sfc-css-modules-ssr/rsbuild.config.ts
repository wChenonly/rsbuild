import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  plugins: [pluginVue()],
  dev: {
    writeToDisk: true,
  },
  output: {
    target: 'node',
  },
});
