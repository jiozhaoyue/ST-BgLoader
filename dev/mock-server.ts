/**
 * Dev-only mock of the three host endpoints the extension talks to. Runs as Vite dev
 * middleware, so everything is same-origin with the harness page (no CORS, no extra
 * process) and the product build is untouched.
 *
 * Contract mirrors src/backend/ServerOrigin.ts exactly:
 *   POST /api/backgrounds/all      → { images: [{ filename }] }
 *   POST /api/backgrounds/upload   → multipart, field name "avatar"
 *   POST /api/backgrounds/delete   → { bg: "<filename>" }
 *   GET  /backgrounds/<file>       → raw bytes
 *
 * Data lives in dev/.data/backgrounds/ (gitignored). JSON documents written through the
 * upload endpoint (settings + manifest) overwrite in place; media files get a suffix so a
 * name collision behaves like a fresh upload rather than silently replacing user media.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';

const MEDIA_EXTENSIONS = new Set([
    'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'svg',
    'mp4', 'webm', 'mov', 'm4v', 'ogv',
    'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
    'html', 'htm',
]);

const MIME: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    gif: 'image/gif', avif: 'image/avif', bmp: 'image/bmp', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v', ogv: 'video/ogg',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
    aac: 'audio/aac', m4a: 'audio/mp4',
    html: 'text/html', htm: 'text/html', json: 'application/json',
};

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b3a55"/><stop offset="55%" stop-color="#6b5b7b"/>
      <stop offset="100%" stop-color="#c98a7a"/>
    </linearGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2f3b46"/><stop offset="100%" stop-color="#151b22"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sky)"/>
  <circle cx="980" cy="210" r="70" fill="#ffe3b3" opacity="0.85"/>
  <path d="M0 520 L300 400 L540 510 L820 380 L1100 500 L1280 430 L1280 720 L0 720 Z" fill="url(#hill)"/>
  <path d="M0 610 L260 540 L520 620 L760 545 L1020 625 L1280 560 L1280 720 L0 720 Z" fill="#0d1217"/>
</svg>`;

function makeWav(seconds = 3, freq = 220, sampleRate = 8000): Buffer {
    const frames = seconds * sampleRate;
    const data = Buffer.alloc(frames * 2);
    for (let i = 0; i < frames; i++) {
        const t = i / sampleRate;
        const fade = Math.max(0, Math.min(1, t / 0.15, (seconds - t) / 0.5));
        const v = Math.sin(2 * Math.PI * freq * t) * 0.12 * fade;
        data.writeInt16LE(Math.round(v * 32767), i * 2);
    }
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(data.length, 40);
    return Buffer.concat([header, data]);
}

function readBody(req: Connect.IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

/** First part carrying a filename. The extension only ever uploads one file per request. */
function parseMultipart(body: Buffer, boundary: string): { filename: string; data: Buffer } | null {
    const delim = Buffer.from(`--${boundary}`);
    let cursor = body.indexOf(delim);
    if (cursor === -1) return null;
    cursor += delim.length;
    while (cursor < body.length && (body[cursor] === 13 || body[cursor] === 10)) cursor++;

    const headerEnd = body.indexOf('\r\n\r\n', cursor);
    if (headerEnd === -1) return null;
    const headers = body.subarray(cursor, headerEnd).toString('utf8');
    const nameMatch = /filename="([^"]*)"/i.exec(headers);
    if (!nameMatch) return null;

    const dataStart = headerEnd + 4;
    const nextDelim = body.indexOf(delim, dataStart);
    if (nextDelim === -1) return null;
    let dataEnd = nextDelim;
    if (dataEnd >= 2 && body[dataEnd - 2] === 13 && body[dataEnd - 1] === 10) dataEnd -= 2;

    return { filename: nameMatch[1], data: Buffer.from(body.subarray(dataStart, dataEnd)) };
}

function safeName(raw: string): string | null {
    const base = path.basename(raw.replace(/\\/g, '/')).trim();
    if (!base || base === '.' || base === '..' || base.includes('/') || base.includes('\\')) return null;
    return base;
}

function mediaOnly(dir: string): { filename: string }[] {
    return fs.readdirSync(dir)
        .filter(name => !name.startsWith('.'))
        .filter(name => MEDIA_EXTENSIONS.has(name.split('.').pop()?.toLowerCase() ?? ''))
        .map(filename => ({ filename }));
}

export function devMockServer(): Plugin {
    const bgDir = path.resolve(process.cwd(), 'dev', '.data', 'backgrounds');

    function seed(): void {
        fs.mkdirSync(bgDir, { recursive: true });
        const svg = path.join(bgDir, 'sample-landscape.svg');
        if (!fs.existsSync(svg)) fs.writeFileSync(svg, SAMPLE_SVG, 'utf8');
        const wav = path.join(bgDir, 'sample-ambient.wav');
        if (!fs.existsSync(wav)) fs.writeFileSync(wav, makeWav());
    }

    function send(res: any, status: number, body: string | Buffer, type: string): void {
        res.statusCode = status;
        res.setHeader('Content-Type', type);
        res.setHeader('Cache-Control', 'no-store');
        res.end(body);
    }

    const middleware: Connect.NextHandleFunction = async (req, res, next) => {
        const rawUrl = req.url ?? '/';
        const pathname = decodeURIComponent(rawUrl.split('?')[0]);

        try {
            if (pathname === '/api/backgrounds/all' && req.method === 'POST') {
                await readBody(req);
                send(res, 200, JSON.stringify({ images: mediaOnly(bgDir) }), 'application/json');
                return;
            }

            if (pathname === '/api/backgrounds/upload' && req.method === 'POST') {
                const contentType = String(req.headers['content-type'] ?? '');
                const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
                const body = await readBody(req);
                if (!boundary) {
                    send(res, 400, 'missing multipart boundary', 'text/plain');
                    return;
                }
                const part = parseMultipart(body, boundary[1] ?? boundary[2]);
                if (!part) {
                    send(res, 400, 'no file part', 'text/plain');
                    return;
                }
                const name = safeName(part.filename);
                if (!name) {
                    send(res, 400, 'unsafe filename', 'text/plain');
                    return;
                }
                // JSON documents are state, not media: the extension rewrites them in place.
                let target = path.join(bgDir, name);
                if (!name.toLowerCase().endsWith('.json') && fs.existsSync(target)) {
                    const ext = path.extname(name);
                    const stem = name.slice(0, name.length - ext.length);
                    let i = 1;
                    while (fs.existsSync(path.join(bgDir, `${stem}-${i}${ext}`))) i++;
                    target = path.join(bgDir, `${stem}-${i}${ext}`);
                }
                fs.writeFileSync(target, part.data);
                // The host answers with the stored filename as PLAIN TEXT — ServerOrigin's
                // uploadFile uses the body verbatim as the file's name.
                send(res, 200, path.basename(target), 'text/plain');
                return;
            }

            if (pathname === '/api/backgrounds/delete' && req.method === 'POST') {
                const body = await readBody(req);
                let filename = '';
                try {
                    filename = String(JSON.parse(body.toString('utf8'))?.bg ?? '');
                } catch {
                    filename = '';
                }
                const name = safeName(filename);
                if (!name) {
                    send(res, 400, 'unsafe filename', 'text/plain');
                    return;
                }
                // Idempotent: the extension treats "already gone" as success.
                try { fs.rmSync(path.join(bgDir, name)); } catch { /* absent */ }
                send(res, 200, JSON.stringify({ ok: true }), 'application/json');
                return;
            }

            if (pathname.startsWith('/backgrounds/') && req.method === 'GET') {
                const name = safeName(pathname.slice('/backgrounds/'.length));
                if (!name) {
                    send(res, 400, 'unsafe path', 'text/plain');
                    return;
                }
                const file = path.join(bgDir, name);
                if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
                    send(res, 404, 'not found', 'text/plain');
                    return;
                }
                const ext = name.split('.').pop()?.toLowerCase() ?? '';
                send(res, 200, fs.readFileSync(file), MIME[ext] ?? 'application/octet-stream');
                return;
            }
        } catch (err) {
            console.error('[dev-mock] request failed:', err);
            send(res, 500, String(err), 'text/plain');
            return;
        }

        next();
    };

    return {
        name: 'st-bgloader-dev-mock',
        apply: 'serve',
        configureServer(server) {
            seed();
            server.middlewares.use(middleware);
            server.config.logger.info('[dev-mock] 挂载 /api/backgrounds/* 与 /backgrounds/* 于 dev/.data/');
        },
    };
}
