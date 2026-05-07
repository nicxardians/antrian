#!/bin/bash
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     BUILD INSTALLER - SISTEM ANTRIAN LAN        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Cek Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js belum terinstall!"
    echo "Download dari: https://nodejs.org (pilih LTS)"
    exit 1
fi

echo "[OK] Node.js: $(node --version)"
echo ""

cd "$(dirname "$0")"

echo "[1/3] Install dependensi..."
npm install || { echo "[ERROR] npm install gagal"; exit 1; }

echo ""
echo "[2/3] Detect OS dan build..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    npm run build-mac
else
    npm run build-linux
fi

if [ $? -ne 0 ]; then
    echo "[ERROR] Build gagal."
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Selesai! File tersimpan di folder: dist/       ║"
echo "╚══════════════════════════════════════════════════╝"
ls dist/
