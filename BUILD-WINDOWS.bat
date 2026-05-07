@echo off
chcp 65001 >nul
title Build Antrian LAN - Installer Windows

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║     BUILD INSTALLER - SISTEM ANTRIAN LAN        ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: Cek Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js belum terinstall!
    echo.
    echo Silakan download dan install Node.js dari:
    echo https://nodejs.org  ^(pilih versi LTS^)
    echo.
    echo Setelah install Node.js, jalankan script ini lagi.
    pause
    exit /b 1
)

echo [OK] Node.js ditemukan:
node --version
echo.

:: Masuk ke folder script
cd /d "%~dp0"

echo [1/3] Install dependensi npm...
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Gagal install dependensi. Cek koneksi internet.
    pause
    exit /b 1
)
echo.

echo [2/3] Build installer Windows (.exe)...
call npm run build-win
if errorlevel 1 (
    echo.
    echo [ERROR] Build gagal. Lihat pesan error di atas.
    pause
    exit /b 1
)
echo.

echo [3/3] Selesai!
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  File installer tersimpan di folder:  dist\     ║
echo ║                                                  ║
echo ║  Cari file:  Antrian LAN Setup x.x.x.exe        ║
echo ║  Klik 2x untuk install di PC manapun!           ║
echo ╚══════════════════════════════════════════════════╝
echo.
explorer dist
pause
