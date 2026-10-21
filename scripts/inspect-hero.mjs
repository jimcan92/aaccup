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
	function info(element) {
		if (!element) return null;
		const rect = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return {
			tag: element.tagName,
			text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
			rect: {
				left: Math.round(rect.left),
				right: Math.round(rect.right),
				width: Math.round(rect.width),
				height: Math.round(rect.height)
			},
			whiteSpace: style.whiteSpace,
			textWrap: style.textWrap,
			wordBreak: style.wordBreak,
			overflowWrap: style.overflowWrap,
			fontSize: style.fontSize,
			fontFamily: style.fontFamily,
			lineHeight: style.lineHeight,
			overflow: style.overflow,
			display: style.display
		};
	}

	const h1 = document.querySelector('h1');
	const heroText = h1?.parentElement;
	const paragraph = heroText?.querySelector('p');

	return {
		doc: {
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth
		},
		h1: info(h1),
		heroText: info(heroText),
		paragraph: info(paragraph),
		body: info(document.body)
	};
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
