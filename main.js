// main.js
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import treeKill from 'tree-kill';

// --- SABİT DEĞERLER VE YOLLAR ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binPath = path.join(__dirname, 'bin');
const ytDlpPath = path.join(binPath, 'yt-dlp.exe');
const ffmpegPath = binPath;

// --- ÇOK DİLLİ SÖZLÜK ---
const translations = {
    tr: {
        downloading: 'İndiriliyor',
        merging: '⚡ Video ve Ses birleştiriliyor... (Lütfen bekleyin)',
        converting: '🎵 Ses dosyasına dönüştürülüyor...',
        info: '🔍 Video bilgileri alınıyor...',
        exists: '✅ Bu dosya zaten indirilmiş.',
        success: '🎉 İndirme başarıyla tamamlandı!',
        process_error: 'İşlem durduruldu veya hata oluştu.',
        start_error: 'Başlatma hatası',
        cancelled: '⛔ İndirme iptal edildi.',
        missing_url: 'Hata: URL ve klasör yolu gerekli!',
        system_error: 'Sistem Hatası'
    },
    en: {
        downloading: 'Downloading',
        merging: '⚡ Merging Video and Audio... (Please wait)',
        converting: '🎵 Converting to Audio file...',
        info: '🔍 Fetching video information...',
        exists: '✅ File already downloaded.',
        success: '🎉 Download completed successfully!',
        process_error: 'Process stopped or error occurred.',
        start_error: 'Startup error',
        cancelled: '⛔ Download cancelled.',
        missing_url: 'Error: URL and folder path required!',
        system_error: 'System Error'
    }
};

let mainWindow;
let currentDownloadProcess = null;

// --- YARDIMCI FONKSİYONLAR ---

const safeKill = (pid, callback) => {
    if (!pid) {
        if (callback) callback();
        return;
    }
    try {
        treeKill(pid, 'SIGKILL', (err) => {
            if (err) console.log('Process kapatılırken önemsiz uyarı:', err.message);
            if (callback) callback();
        });
    } catch (e) {
        console.log('SafeKill hatası:', e.message);
        if (callback) callback();
    }
};

function checkDependencies() {
    return new Promise((resolve, reject) => {
        const ffmpegExe = path.join(binPath, 'ffmpeg.exe');
        if (!fs.existsSync(ffmpegExe)) {
            reject('FFmpeg missing! Please add ffmpeg.exe to bin folder.');
            return;
        }
        const check = spawn(ytDlpPath, ['--version'], { windowsHide: true });
        check.on('close', (code) => {
            if (code === 0) resolve(true);
            else reject('yt-dlp not working.');
        });
        check.on('error', () => {
            reject('yt-dlp.exe not found in bin folder.');
        });
    });
}

// --- PENCERE YÖNETİMİ ---

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 700,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(binPath, 'icon.png'),
    });
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('before-quit', (event) => {
    if (currentDownloadProcess) {
        event.preventDefault();
        const pid = currentDownloadProcess.pid;
        currentDownloadProcess = null;
        safeKill(pid, () => {
            app.exit();
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC (İLETİŞİM) İŞLEMLERİ ---

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.on('download-video', async (event, { url, folderPath, formats, language }) => {
    // Varsayılan dil tr olsun
    const lang = translations[language] ? language : 'tr';
    const t = translations[lang];

    try {
        if (!url || !folderPath) {
            mainWindow.webContents.send('download-status', {
                message: t.missing_url,
                type: 'error'
            });
            return;
        }

        try {
            await checkDependencies();
        } catch (err) {
            mainWindow.webContents.send('download-status', {
                message: `${t.system_error}: ${err}`,
                type: 'error'
            });
            mainWindow.webContents.send('download-complete');
            return;
        }

        const args = [];
        args.push('--ffmpeg-location', ffmpegPath);
        args.push('--newline');

        if (formats && formats.includes('mp3')) {
            args.push('-x', '--audio-format', 'mp3');
        }
        if (formats && formats.includes('original')) {
            args.push('-f', 'bestvideo+bestaudio/best');
        }

        args.push('-o', `${folderPath}/%(title)s.%(ext)s`);
        args.push(url);

        const process = spawn(ytDlpPath, args, { windowsHide: true });
        currentDownloadProcess = process;

        // --- AKILLI ÇIKTI YÖNETİMİ ---
        process.stdout.on('data', (chunk) => {
            const lines = String(chunk).split('\n');

            lines.forEach(line => {
                line = line.trim();
                if (!line) return;

                let userMessage = line;

                // Gelen teknik mesajı yakala -> Seçili dildeki karşılığını bas
                if (line.includes('[download]') && line.includes('%')) {
                    const percentMatch = line.match(/(\d+\.?\d*)%/);
                    if (percentMatch) {
                        userMessage = `${t.downloading}: %${percentMatch[1]}`;
                    }
                } else if (line.includes('[Merger]') || line.includes('Merging formats')) {
                    userMessage = t.merging;
                } else if (line.includes('[ExtractAudio]')) {
                    userMessage = t.converting;
                } else if (line.includes('Downloading webpage')) {
                    userMessage = t.info;
                } else if (line.includes('has already been downloaded')) {
                    userMessage = t.exists;
                } else if (line.startsWith('[youtube]')) {
                    return;
                }

                mainWindow.webContents.send('download-status', {
                    message: userMessage,
                    type: 'info'
                });
            });
        });

        process.stderr.on('data', (chunk) => {
            const data = String(chunk).trim();
            if (data && !data.includes('WARNING')) {
                mainWindow.webContents.send('download-status', {
                    message: data,
                    type: 'info'
                });
            }
        });

        process.on('close', (code) => {
            currentDownloadProcess = null;
            if (code === 0) {
                mainWindow.webContents.send('download-status', {
                    message: t.success,
                    type: 'success'
                });
            } else {
                if (code !== null && code !== 143 && code !== -1) {
                    mainWindow.webContents.send('download-status', {
                        message: t.process_error,
                        type: 'info'
                    });
                }
            }
            mainWindow.webContents.send('download-complete');
        });

        process.on('error', (err) => {
            currentDownloadProcess = null;
            mainWindow.webContents.send('download-status', {
                message: `${t.start_error}: ${err.message}`,
                type: 'error'
            });
            mainWindow.webContents.send('download-complete');
        });

    } catch (error) {
        mainWindow.webContents.send('download-status', {
            message: `Fatal Error: ${error.message || error}`,
            type: 'error'
        });
        mainWindow.webContents.send('download-complete');
    }
});

ipcMain.on('cancel-download', (event) => {
    if (currentDownloadProcess && currentDownloadProcess.pid) {
        const pid = currentDownloadProcess.pid;
        currentDownloadProcess = null;
        safeKill(pid, () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('download-status', {
                    message: 'STOP',
                    type: 'info'
                });
                mainWindow.webContents.send('download-complete');
            }
        });
    } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download-complete');
        }
    }
});