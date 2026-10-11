import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';

const base = process.env.REPLISOME_QA_URL || 'http://127.0.0.1:4196';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-webgl'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/replisome/index.html`);
  await expect(page.getByText('Preparing molecular structures…')).toBeHidden({ timeout: 30000 });
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Take control', exact: true }).click();
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pause simulation', exact: true });
  if (await pause.isVisible()) await pause.click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Quality', { exact: true }).selectOption('High');
  await page.getByLabel('Camera', { exact: true }).selectOption('cinematic');
  await page.getByRole('button', { name: 'Close settings', exact: true }).click();
  await page.addStyleTag({ content: '.experience > :not(.molecular-canvas), .actor-pin, .end-pin, .strand-pin { visibility: hidden !important; }' });
  await page.waitForTimeout(1000);
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 88 }).toFile('public/replisome/preview.webp');
  console.log('Captured actual REPLISOME scene: public/replisome/preview.webp');
} finally {
  await browser.close();
}
