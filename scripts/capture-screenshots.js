const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Playwright to capture app screenshots...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Context
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Desktop Dashboard
  await page.screenshot({ path: path.join(outDir, '01_dashboard_desktop.png'), fullPage: false });
  console.log('✅ Captured 01_dashboard_desktop.png');

  // 2. Expand first transaction
  const firstTx = page.locator('app-budget-transactions ion-item').first();
  if (await firstTx.isVisible()) {
    await firstTx.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '03_transaction_expanded.png'), fullPage: false });
    console.log('✅ Captured 03_transaction_expanded.png');
  }

  // 3. Bank Push Simulator
  const pushBtn = page.getByRole('button', { name: /Test Push z Banku/ });
  if (await pushBtn.isVisible()) {
    await pushBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '04_bank_push_simulator.png'), fullPage: false });
    console.log('✅ Captured 04_bank_push_simulator.png');
    // Dismiss push
    const dismissBtn = page.getByRole('button', { name: 'Ignoruj' });
    if (await dismissBtn.isVisible()) await dismissBtn.click();
  }

  // 4. AI Summary Insights
  const aiSummaryBtn = page.getByRole('button', { name: /Analizuj cały/ });
  if (await aiSummaryBtn.isVisible()) {
    await aiSummaryBtn.scrollIntoViewIfNeeded();
    await aiSummaryBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '05_ai_summary_insights.png'), fullPage: false });
    console.log('✅ Captured 05_ai_summary_insights.png');
  }

  // 5. OCR Scanner Modal
  const scannerBtn = page.getByRole('button', { name: /Skaner Paragonów/ });
  if (await scannerBtn.isVisible()) {
    await scannerBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '06_receipt_scanner_ocr.png'), fullPage: false });
    console.log('✅ Captured 06_receipt_scanner_ocr.png');
    // Close modal
    const closeBtn = page.locator('app-budget-scanner-modal button:has-text("✕")');
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  // 6. Voice AI Modal
  const voiceBtn = page.getByRole('button', { name: /Głos AI/ });
  if (await voiceBtn.isVisible()) {
    await voiceBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '07_voice_ai_assistant.png'), fullPage: false });
    console.log('✅ Captured 07_voice_ai_assistant.png');
    // Close modal
    const closeBtn = page.locator('app-budget-voice-modal button:has-text("✕")');
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  // 7. Subscriptions Tracker
  const subBtn = page.getByRole('button', { name: /Subskrypcje/ });
  if (await subBtn.isVisible()) {
    await subBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '08_subscriptions_tracker.png'), fullPage: false });
    console.log('✅ Captured 08_subscriptions_tracker.png');
    // Close drawer
    const closeBtn = page.locator('app-budget-subscriptions button:has-text("✕")');
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  // 8. Waste Radar
  const radarBtn = page.getByRole('button', { name: /Radar Zachcianek/ });
  if (await radarBtn.isVisible()) {
    await radarBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '09_waste_radar.png'), fullPage: false });
    console.log('✅ Captured 09_waste_radar.png');
    // Close drawer
    const closeBtn = page.locator('app-budget-radar-waste button:has-text("✕")');
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  await desktopContext.close();

  // 9. Mobile Context (Pixel 7)
  const mobileContext = await browser.newContext({
    ...devices['Pixel 7'],
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(outDir, '02_dashboard_mobile.png'), fullPage: false });
  console.log('✅ Captured 02_dashboard_mobile.png');

  await mobileContext.close();
  await browser.close();
  console.log('🎉 All screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
