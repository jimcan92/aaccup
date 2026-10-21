import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] ?? '.vercel/output/static';
const port = Number(process.argv[3] ?? 4173);

const mime = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.json': 'application/json',
	'.txt': 'text/plain; charset=utf-8'
};

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? '/', 'http://127.0.0.1');
	let pathname = decodeURIComponent(url.pathname);

	if (pathname.endsWith('/')) pathname += 'index.html';

	let file = join(root, normalize(pathname));

	try {
		const body = await readFile(file);
		response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' });
		response.end(body);
		return;
	} catch {
		// Vercel's clean URLs: /about -> about.html
	}

	try {
		file = `${file}.html`;
		const body = await readFile(file);
		response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
		response.end(body);
	} catch {
		try {
			const body = await readFile(join(root, '404.html'));
			response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
			response.end(body);
		} catch {
			response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
			response.end('Not found');
		}
	}
});

server.listen(port, '127.0.0.1', () => {
	console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
