/**
 * SERVER ANTRIAN - Jaringan Lokal (LAN)
 * Jalankan: node server.js
 * Akses Console : http://localhost:3000/console
 * Akses Display : http://localhost:3000/display
 * Dari PC lain  : http://[IP-PC-SERVER]:3000/console atau /display
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 3000;

// ── State antrian (disimpan di memori server) ──────────────────────────────
let state = {
  last: 0,
  lastPendaftaran: null, // nomor pendaftaran terakhir dipanggil (tidak hilang)
  now: null,             // sedang di PEMERIKSAAN
  pendaftaran: null,     // sedang di PENDAFTARAN
  q: [],                 // menunggu dipanggil pendaftaran
  qPemeriksaan: [],      // sudah daftar, antri pemeriksaan
};

// ── HTTP Server (sajikan file HTML) ───────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const map = {
    '/':        'console.html',
    '/console': 'console.html',
    '/display': 'display.html',
  };
  const file = map[url];
  if (file) {
    const filePath = path.join(__dirname, file);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('File not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

// ── WebSocket Server ───────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  // Kirim state terkini ke client yang baru konek
  ws.send(JSON.stringify({ type: 'state', state }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.action) {
      case 'panggilPendaftaran': {
        if (state.pendaftaran !== null) {
          state.qPemeriksaan.push(state.pendaftaran);
        }
        state.last++;
        state.q.push(state.last);
        state.pendaftaran = state.q.shift();
        state.lastPendaftaran = state.pendaftaran;
        break;
      }
      case 'panggil': {
        // Jika masih ada nomor di loket pendaftaran, pindahkan dulu ke antrian pemeriksaan
        if (state.pendaftaran !== null) {
          state.qPemeriksaan.push(state.pendaftaran);
          state.pendaftaran = null;
        }
        // Setelah pemindahan, cek kembali apakah ada antrian
        if (state.qPemeriksaan.length === 0) return;
        state.now = state.qPemeriksaan.shift();
        break;
      }
      case 'ulangPendaftaran':
      case 'ulangPemeriksaan':
        // Hanya broadcast state (untuk trigger suara di semua client)
        break;
      case 'reset': {
        state = { last: 0, lastPendaftaran: null, now: null, pendaftaran: null, q: [], qPemeriksaan: [] };
        break;
      }
      default: return;
    }

    // Broadcast state terbaru + event ke semua client
    broadcast({ type: 'state', state, event: msg.action });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║         SERVER ANTRIAN - LAN AKTIF           ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Console : http://localhost:${PORT}/console      ║`);
  console.log(`║  Display : http://localhost:${PORT}/display      ║`);
  console.log('║                                              ║');
  console.log('║  Dari PC lain, ganti localhost               ║');
  console.log('║  dengan IP address PC ini.                   ║');
  console.log('║                                              ║');
  console.log('║  Cek IP: ipconfig (Windows)                  ║');
  console.log('║          ip a     (Linux/Mac)                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
