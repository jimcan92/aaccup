import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
	executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	headless: true,
	args: ['--no-sandbox', '--disable-gpu']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 1200, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

async function measure(label) {
	const data = await page.evaluate(() => {
		function lines(selector) {
			const element = document.querySelector(selector);
			if (!element) return null;
			const range = document.createRange();
			range.selectNodeContents(element);
			const rects = Array.from(range.getClientRects()).map((rect) => ({
				left: Math.round(rect.left),
				right: Math.round(rect.right),
				width: Math.round(rect.width),
				top: Math.round(rect.top)
			}));
			const box = element.getBoundingClientRect();
			return {
				box: {
					left: Math.round(box.left),
					right: Math.round(box.right),
					width: Math.round(box.width),
					height: Math.round(box.height)
				},
				style: {
					textWrap: getComputedStyle(element).textWrap,
					whiteSpace: getComputedStyle(element).whiteSpace
				},
				rects
			};
		}

		return { h1: lines('h1'), p: lines('h1 + p') };
	});

	console.log(label, JSON.stringify(data, null, 2));
}

await measure('before');
await page.addStyleTag({ content: 'h1, h1 + p { text-wrap: wrap !important; }' });
await measure('after-wrap');

await browser.close();
