import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
	executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	headless: true,
	args: ['--no-sandbox', '--disable-gpu']
});

const page = await browser.newPage();
await page.setViewport({ width: Number(process.argv[3] ?? 390), height: Number(process.argv[4] ?? 2400), deviceScaleFactor: 1 });
await page.goto(process.argv[2] ?? 'http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: process.argv[5] ?? 'screenshots/puppeteer.png', fullPage: false });
console.log('saved', process.argv[5]);
await browser.close();
