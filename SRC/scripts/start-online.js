import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import https from 'node:https';
import dns from 'node:dns';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cloudflared =
  process.env.CLOUDFLARED_PATH || path.resolve(src, '../.runtime/tools/cloudflared.exe');
const port = Number(process.env.ONLINE_PORT || 3001);
const local = `http://127.0.0.1:${port}`;
const urlFile = path.join(src, 'online-url.txt');
const controlPath =
  '\\\\.\\pipe\\homefix-online-' +
  createHash('sha256').update(src.toLowerCase()).digest('hex').slice(0, 16);
const children = new Set();
let control;
let stopping = false,
  publicUrl = '',
  dnsNotice = false,
  onlineReady = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  control?.close();
  for (const child of children) child.kill();
  if (publicUrl && fs.existsSync(urlFile) && fs.readFileSync(urlFile, 'utf8').trim() === publicUrl)
    fs.unlinkSync(urlFile);
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
process.on('exit', () => {
  for (const child of children) child.kill();
});

function launch(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: src,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  children.add(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    children.delete(child);
    if (!stopping) {
      console.error(`Dich vu online da dung (ma ${code}).`);
      stop(code || 1);
    }
  });
  return child;
}

async function runStep(args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: src,
      windowsHide: true,
      stdio: 'inherit',
      ...options,
    });
    children.add(child);
    child.once('error', reject);
    child.once('exit', (code) => {
      children.delete(child);
      code === 0
        ? resolve()
        : reject(new Error('Buoc chuan bi that bai. Xem thong bao phia tren.'));
    });
  });
}

async function healthy(url) {
  try {
    if (url.startsWith('https://'))
      return await new Promise((resolve) => {
        // Tra lại DNS khi link tunnel mới chưa được mạng nhận diện.
        const request = https.get(
          url + '/api/health',
          {
            signal: AbortSignal.timeout(6000),
            lookup(host, options, done) {
              dns.lookup(host, options, (error, address, family) => {
                if (!error) return done(null, address, family);
                const resolver = new dns.Resolver({ timeout: 2000, tries: 1 });
                resolver.setServers(['1.1.1.1', '1.0.0.1']);
                resolver.resolve4(host, (fallbackError, addresses) => {
                  if (fallbackError) return done(fallbackError);
                  if (!dnsNotice) {
                    console.log(
                      'DNS mang hien tai chua nhan link moi; dang kiem tra bang DNS Cloudflare. Neu trinh duyet bao DNS, bat Secure DNS hoac thu mang khac.',
                    );
                    dnsNotice = true;
                  }
                  const ip = addresses[0];
                  done(null, options?.all ? [{ address: ip, family: 4 }] : ip, 4);
                });
              });
            },
          },
          (response) => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
              body += chunk;
              if (body.length > 8192) {
                response.destroy();
                resolve(false);
              }
            });
            response.on('error', () => resolve(false));
            response.on('end', () => {
              try {
                resolve(response.statusCode === 200 && JSON.parse(body).data?.status === 'ok');
              } catch {
                resolve(false);
              }
            });
          },
        );
        request.on('error', () => resolve(false));
      });
    const response = await fetch(url + '/api/health', { signal: AbortSignal.timeout(5000) });
    return response.ok && (await response.json()).data?.status === 'ok';
  } catch {
    return false;
  }
}

async function main() {
  if (process.argv.includes('--stop') || process.argv.includes('--status')) {
    const command = process.argv.includes('--stop') ? 'stop' : 'status';
    const state = await new Promise((resolve, reject) => {
      let reply = '';
      const client = net.connect(controlPath, () => client.write(command));
      client.setEncoding('utf8');
      client.setTimeout(5000, () => client.destroy(new Error('Phien online khong phan hoi.')));
      client.on('data', (data) => {
        reply += data;
      });
      client.once('error', (error) =>
        reject(
          new Error(
            error.code === 'ENOENT' || error.code === 'ECONNREFUSED'
              ? 'Khong tim thay phien online cua du an nay.'
              : error.message,
          ),
        ),
      );
      client.once('close', () => resolve(reply));
    });
    if (command === 'stop') console.log('Da gui lenh dung HomeFix online.');
    else {
      const { ready, url } = JSON.parse(state);
      if (!ready) console.log('HomeFix dang khoi dong, chua san sang chia se link.');
      else if (await healthy(url)) console.log(`HOMEFIX ONLINE: ${url}\nAPI Android: ${url}/api`);
      else
        throw new Error(
          'Phien online con chay nhung HTTPS khong phan hoi. Kiem tra mang hoac khoi dong lai.',
        );
    }
    return;
  }
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('ONLINE_PORT phai tu 1024 den 65535.');
  if (!fs.existsSync(cloudflared))
    throw new Error('Chay npm.cmd run online:setup truoc de cai cloudflared.');
  if (!fs.existsSync(path.join(src, 'backend/.env')))
    throw new Error('Chua co backend/.env. Cai dat HomeFix truoc.');
  await new Promise((resolve, reject) => {
    control = net.createServer((socket) => {
      let command = '';
      socket.setEncoding('utf8');
      socket.setTimeout(2000, () => socket.destroy());
      socket.on('data', (data) => {
        command += data;
        if (command === 'status')
          socket.end(JSON.stringify({ ready: onlineReady, url: onlineReady ? publicUrl : '' }));
        else if (command === 'stop') {
          socket.end();
          stop();
        } else if (command.length > 20) socket.destroy();
      });
      socket.on('error', () => {});
    });
    control.once('error', () =>
      reject(new Error('Da co phien online. Chay npm.cmd run online:stop truoc.')),
    );
    control.listen(controlPath, resolve);
  });
  // Chỉ khởi động khi cổng chưa được phiên khác sử dụng.
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () =>
      reject(new Error(`Cong ${port} dang ban. Dung phien online cu hoac doi ONLINE_PORT.`)),
    );
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
  // Xóa link cũ sau khi đã giữ quyền chạy phiên online mới.
  if (fs.existsSync(urlFile)) fs.unlinkSync(urlFile);
  console.log('Kiem tra database cho cac chuc nang hien tai...');
  await runStep(['scripts/check-online-db.js']);
  if (stopping) return;
  console.log('Build giao dien cho website chung...');
  await runStep([path.join(src, 'node_modules/vite/bin/vite.js'), 'build'], {
    cwd: path.join(src, 'frontend'),
    env: { ...process.env, VITE_API_BASE_URL: '/api' },
  });
  if (stopping) return;
  const backend = launch(process.execPath, ['backend/src/server.js'], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', TRUST_PROXY: 'loopback' },
  });
  backend.stdout.pipe(process.stdout);
  backend.stderr.pipe(process.stderr);
  let ready = false;
  for (let attempt = 0; attempt < 30 && !stopping; attempt++) {
    if (await healthy(local)) {
      ready = true;
      break;
    }
    await delay(1000);
  }
  if (stopping) return;
  if (!ready)
    throw new Error('Backend chua ket noi duoc database. Kiem tra backend/.env va SQL Server.');
  console.log('Database da ket noi. Dang tao link HTTPS qua Cloudflare...');
  const tunnel = launch(cloudflared, [
    'tunnel',
    '--no-autoupdate',
    '--protocol',
    'http2',
    '--url',
    local,
  ]);
  let logs = '';
  function observe(chunk) {
    const text = chunk.toString();
    process.stdout.write(text);
    logs = (logs + text).slice(-12000);
    if (!publicUrl) {
      const match = logs.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) publicUrl = match[0];
    }
  }
  tunnel.stdout.on('data', observe);
  tunnel.stderr.on('data', observe);
  for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
    if (publicUrl && (await healthy(publicUrl))) {
      onlineReady = true;
      fs.writeFileSync(urlFile, publicUrl + '\n');
      console.log(
        `\nHOMEFIX ONLINE: ${publicUrl}\nAPI Android: ${publicUrl}/api\nLink da luu tai SRC/online-url.txt.\nGui cung link nay cho KH, DPV va KTV. Tat ca dung database trong backend/.env.\nGiu may va terminal nay hoat dong. Ctrl+C de dung online.\n`,
      );
      return;
    }
    await delay(1500);
  }
  if (!stopping)
    throw new Error(
      'Khong xac nhan duoc link online. Kiem tra Internet va log Cloudflare, roi chay lai.',
    );
}

main().catch((error) => {
  console.error(error.message);
  stop(1);
});
