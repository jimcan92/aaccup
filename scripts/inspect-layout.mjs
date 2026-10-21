import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
	executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	headless: true,
	args: ['--no-sandbox', '--disable-gpu']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 2400, deviceScaleFactor: 1 });
await page.goto(process.argv[2] ?? 'http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });

const data = await page.evaluate(() => {
	const viewport = document.documentElement.clientWidth;
	const elements = Array.from(document.querySelectorAll('body *'));

	const offenders = elements
		.map((element) => {
			const rect = element.getBoundingClientRect();
			return {
				tag: element.tagName,
				classes: String(element.className ?? '').slice(0, 140),
				left: Math.round(rect.left),
				right: Math.round(rect.right),
				width: Math.round(rect.width),
				scrollWidth: element.scrollWidth,
				text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 50)
			};
		})
		.filter((item) => item.right > viewport + 1 || item.width > viewport + 1)
		.slice(0, 30);

	return {
		innerWidth: window.innerWidth,
		clientWidth: viewport,
		documentScrollWidth: document.documentElement.scrollWidth,
		bodyScrollWidth: document.body.scrollWidth,
		offenders
	};
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
