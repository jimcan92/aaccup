import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
	executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	headless: true,
	args: ['--no-sandbox', '--disable-gpu']
});

const page = await browser.newPage();
const events = [];
page.on('console', (message) => events.push({ type: `console.${message.type()}`, text: message.text() }));
page.on('pageerror', (error) => events.push({ type: 'pageerror', text: error.message, stack: error.stack }));

await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/documents?program=bsfi&area=3', { waitUntil: 'networkidle0' });
await new Promise((resolve) => setTimeout(resolve, 1000));

const state = await page.evaluate(() => ({
	href: window.location.href,
	search: window.location.search,
	count: document.querySelector('[aria-live="polite"]')?.textContent?.trim().replace(/\s+/g, ' '),
	area: document.querySelector('[aria-label="Filter by area"]')?.textContent?.trim().replace(/\s+/g, ' '),
	programButtons: Array.from(document.querySelectorAll('button[aria-pressed]')).map((button) => ({
		text: button.textContent?.trim(),
		pressed: button.getAttribute('aria-pressed')
	}))
}));

console.log(JSON.stringify({ state, events }, null, 2));
await browser.close();
