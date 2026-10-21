import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
	executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	headless: true,
	args: ['--no-sandbox', '--disable-gpu']
});

const page = await browser.newPage();
const errors = [];
page.on('console', (message) => {
	if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });

await page.click('button[aria-label="Open navigation menu"]');
await page.waitForSelector('[data-slot="sheet-content"]', { visible: true });
const menu = await page.$eval('[data-slot="sheet-content"]', (element) => {
	const rect = element.getBoundingClientRect();
	return { width: Math.round(rect.width), height: Math.round(rect.height), text: element.textContent?.includes('AACCUP dossier') };
});
await page.screenshot({ path: 'screenshots/menu-mobile.png' });
await page.keyboard.press('Escape');

await page.goto('http://127.0.0.1:4173/documents', { waitUntil: 'networkidle0' });
await page.type('input[aria-label="Search documents"]', 'fisheries');
await new Promise((resolve) => setTimeout(resolve, 300));

const search = {
	url: page.url(),
	count: await page.$eval('[aria-live="polite"]', (element) => element.textContent?.trim().replace(/\s+/g, ' ')),
	value: await page.$eval('input[aria-label="Search documents"]', (element) => element.value)
};

const filterClicked = await page.$$eval('button', (buttons) => {
	const button = buttons.find((item) => item.textContent?.trim() === 'BSFI');
	if (!button) return false;
	button.click();
	return true;
});
await new Promise((resolve) => setTimeout(resolve, 300));
const afterFilter = {
	url: page.url(),
	count: await page.$eval('[aria-live="polite"]', (element) => element.textContent?.trim().replace(/\s+/g, ' '))
};

await page.goto('http://127.0.0.1:4173/documents?program=bsfi&area=3', { waitUntil: 'networkidle0' });
await new Promise((resolve) => setTimeout(resolve, 300));
const deepLink = {
	url: page.url(),
	count: await page.$eval('[aria-live="polite"]', (element) => element.textContent?.trim().replace(/\s+/g, ' ')),
	areaText: await page.$eval('[aria-label="Filter by area"]', (element) => element.textContent?.trim().replace(/\s+/g, ' '))
};

console.log(JSON.stringify({ menu, search, filterClicked, afterFilter, deepLink, errors }, null, 2));
await browser.close();
