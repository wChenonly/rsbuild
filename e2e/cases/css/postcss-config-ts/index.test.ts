import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should load postcss.config.ts correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const indexCssFile = Object.keys(files).find(
    (file) => file.includes('index.') && file.endsWith('.css'),
  )!;

  expect(files[indexCssFile]).toEqual(
    '.text-3xl{font-size:1.875rem;line-height:2.25rem}.font-bold{font-weight:700}.underline{text-decoration-line:underline}',
  );
});
