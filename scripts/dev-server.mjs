// Zero-dependency local site + Vercel-style API, with real LAN URLs.
import http from 'node:http';
import os from 'node:os';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contactHandler from '../api/contact.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const servingBuild = process.argv.includes('--dist');
const publicRoot = path.join(root, servingBuild ? 'dist' : 'site');
const port = Number(process.env.PORT || (servingBuild ? 4173 : 5173));
const host = process.env.HOST || '0.0.0.0';

const envFile = path.join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};
function localIPs() {
  const candidates = [];
  for (const [name, infos] of Object.entries(os.networkInterfaces())) {
    for (const info of infos || []) {
      if (info.internal || (info.family !== 'IPv4' && info.family !== 4)) continue;
      if (info.address.startsWith('169.254.')) continue;
      const preferred = /wi-?fi|wireless|ethernet|en0/i.test(name) ? 10 : 0;
      const virtual = /virtual|vmware|docker|wsl|vEthernet|tailscale|loopback/i.test(name) ? -20 : 0;
      const privateIP = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(info.address) ? 10 : 0;
      candidates.push({ ip: info.address, score: preferred + virtual + privateIP });
    }
  }
  candidates.sort((a,b) => b.score - a.score);
  return [...new Set(candidates.map(x => x.ip))];
}
function apiResponder(response) {
  return {
    setHeader: (...args) => response.setHeader(...args),
    status(code) { response.statusCode = code; return this; },
    json(result) { response.setHeader('Content-Type','application/json; charset=utf-8'); response.end(JSON.stringify(result)); return this; }
  };
}
const server = http.createServer(async (request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end('Invalid path'); return; }
  if (pathname === '/api/contact') {
    let body = '';
    for await (const chunk of request) {
      body += chunk.toString();
      if (body.length > 12000) { response.writeHead(413); response.end('Payload too large'); return; }
    }
    const responder = apiResponder(response);
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = body; }
    try { await contactHandler({ method: request.method, headers: request.headers, body: parsed }, responder); }
    catch { if (!response.writableEnded) responder.status(500).json({success:false,error:'server_error'}); }
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end('Method not allowed'); return; }
  let filename;
  try { filename = path.resolve(publicRoot, '.' + path.posix.normalize(pathname)); }
  catch { response.writeHead(400); response.end('Invalid path'); return; }
  if (filename !== publicRoot && !filename.startsWith(publicRoot + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
  try {
    const meta = await stat(filename).catch(() => null);
    if (meta?.isDirectory()) filename = path.join(filename, 'index.html');
    else if (!meta && !path.extname(filename)) filename += '.html';
    const data = await readFile(filename);
    response.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.statusCode = 200;
    if (request.method === 'HEAD') response.end(); else response.end(data);
  } catch {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(await readFile(path.join(publicRoot, '404.html')).catch(() => Buffer.from('Not found')));
  }
});
server.listen(port, host, () => {
  console.log('\n------------------------------------------');
  console.log(" SANDY'S KIDDIE KORRAL - WEBSITE PREVIEW");
  console.log('------------------------------------------');
  console.log(` Local:   http://localhost:${port}/`);
  const ips = localIPs();
  ips.forEach((ip, i) => console.log(`${i===0?' Network:':'         '} http://${ip}:${port}/`));
  if (!ips.length) console.log(' Network: No non-local IPv4 address detected');
  console.log(` Serving: ${publicRoot}`);
  console.log(' Press Ctrl+C to stop.\n');
  if (!process.env.WEB3FORMS_ACCESS_KEY) console.log(' NOTE: Set WEB3FORMS_ACCESS_KEY in .env.local to enable contact submissions.');
});
server.on('error', e => { console.error('Server error:', e.message); process.exitCode = 1; });
