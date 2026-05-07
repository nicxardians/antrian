/**
 * main.js — Electron Main Process
 * Sistem Antrian LAN Desktop
 */

const { app, BrowserWindow, Tray, Menu, shell, dialog, nativeImage, ipcMain } = require('electron');
const path   = require('path');
const http   = require('http');
const fs     = require('fs');
const os     = require('os');
const { WebSocketServer } = require('ws');

// ── Port ──────────────────────────────────────────────────────────────────
const PORT = 3000;

// ── State antrian ─────────────────────────────────────────────────────────
let state = {
  last: 0,
  lastPendaftaran: null,
  now: null,
  pendaftaran: null,
  q: [],
  qPemeriksaan: [],
};

// ── Dapatkan IP lokal ─────────────────────────────────────────────────────
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ── HTTP + WebSocket Server ───────────────────────────────────────────────
let server, wss;

function startServer() {
  server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    const map = {
      '/':        'console.html',
      '/console': 'console.html',
      '/display': 'display.html',
    };
    const file = map[url];
    if (file) {
      // Cari file relatif terhadap app (bekerja saat dev maupun setelah build)
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

  wss = new WebSocketServer({ server });

  function broadcast(data) {
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(msg);
    });
  }

  wss.on('connection', (ws) => {
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
          if (state.pendaftaran !== null) {
            state.qPemeriksaan.push(state.pendaftaran);
            state.pendaftaran = null;
          }
          if (state.qPemeriksaan.length === 0) return;
          state.now = state.qPemeriksaan.shift();
          break;
        }
        case 'ulangPendaftaran':
        case 'ulangPemeriksaan':
          break;
        case 'reset': {
          state = { last: 0, lastPendaftaran: null, now: null, pendaftaran: null, q: [], qPemeriksaan: [] };
          break;
        }
        default: return;
      }

      broadcast({ type: 'state', state, event: msg.action });

      // Kirim update ke main window (untuk status bar)
      if (mainWindow) {
        mainWindow.webContents.send('state-update', state);
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
  });
}

// ── Windows ───────────────────────────────────────────────────────────────
let mainWindow   = null;
let displayWindow = null;
let tray         = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    title: 'Sistem Antrian LAN',
    backgroundColor: '#1e3a8a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    icon: getIcon(),
  });

  // Load halaman launcher (bukan console langsung)
  mainWindow.loadFile(path.join(__dirname, 'launcher.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openConsoleWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 750,
    minHeight: 550,
    title: 'Console — Sistem Antrian',
    backgroundColor: '#1e3a8a',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    icon: getIcon(),
  });
  win.loadURL(`http://localhost:${PORT}/console`);
  win.setMenu(null);
}

function openDisplayWindow() {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.focus();
    return;
  }
  displayWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    title: 'Display — Sistem Antrian',
    backgroundColor: '#0f172a',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    icon: getIcon(),
  });
  displayWindow.loadURL(`http://localhost:${PORT}/display`);
  displayWindow.setMenu(null);
  displayWindow.on('closed', () => { displayWindow = null; });
}

// ── Tray ──────────────────────────────────────────────────────────────────
function createTray() {
  const img = getIcon();
  tray = new Tray(img.resize({ width: 16, height: 16 }));
  tray.setToolTip('Antrian LAN — Berjalan');

  const rebuildMenu = () => {
    const ip = getLocalIP();
    const menu = Menu.buildFromTemplate([
      { label: 'Antrian LAN', enabled: false },
      { type: 'separator' },
      { label: `Server: ${ip}:${PORT}`, enabled: false },
      { type: 'separator' },
      { label: '📋  Buka Console', click: openConsoleWindow },
      { label: '🖥️  Buka Display', click: openDisplayWindow },
      { label: '🌐  Buka di Browser', click: () => shell.openExternal(`http://localhost:${PORT}/console`) },
      { type: 'separator' },
      { label: '⚙️  Dashboard', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else { createMainWindow(); } } },
      { type: 'separator' },
      { label: '❌  Keluar', click: () => { app.exit(0); } },
    ]);
    tray.setContextMenu(menu);
  };

  rebuildMenu();
  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    else { createMainWindow(); }
  });
}

// ── Icon ──────────────────────────────────────────────────────────────────
function getIcon() {
  // Buat icon PNG sederhana secara programatik (teal circle with Q)
  // Electron butuh nativeImage — kita generate via data URL 16x16
  const size = 256;
  // Gunakan built-in nativeImage createFromDataURL dengan SVG-like base64 PNG
  // Karena kita tidak punya file ikon, buat placeholder transparan 1x1
  return nativeImage.createEmpty();
}

// ── IPC: dari launcher.html ───────────────────────────────────────────────
ipcMain.handle('get-info', () => ({
  ip: getLocalIP(),
  port: PORT,
}));

ipcMain.on('open-console', () => openConsoleWindow());
ipcMain.on('open-display', () => openDisplayWindow());
ipcMain.on('open-browser-console', () => shell.openExternal(`http://localhost:${PORT}/console`));
ipcMain.on('open-browser-display', () => shell.openExternal(`http://localhost:${PORT}/display`));

// ── App lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startServer();
  createMainWindow();
  createTray();
});

app.on('before-quit', () => {
  if (server) server.close();
  if (wss) wss.close();
});

app.on('window-all-closed', (e) => {
  // Jangan quit — tetap hidup di tray
});

app.on('activate', () => {
  if (!mainWindow) createMainWindow();
  else mainWindow.show();
});
