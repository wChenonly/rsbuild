import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should build basic Vue sfc correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const button1 = page.locator('#button1');
  const button2 = page.locator('#button2');

  await expect(button1).toHaveText('A: 0');
  await expect(button2).toHaveText('B: 0');

  await rsbuild.close();
});
