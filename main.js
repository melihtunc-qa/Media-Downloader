// main.js
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import treeKill from 'tree-kill';

// Dosya yollarını tanımla
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Yolları baştan tanımlıyoruz ki her yerde kullanabilelim
const binPath = path.join(__dirname, 'bin');
const ytDlpPath = path.join(binPath, 'yt-dlp.exe');
const ffmpegPath = path.join(binPath, 'ffmpeg.exe')

let mainWindow;
let currentDownloadProcess = null;

// Hata yutan güvenli kapatma fonksiyonu
const safeKill = (pid, callback) => {
    if (!pid) {
        if (callback) callback();
        return;
    }

    try {
        treeKill(pid, 'SIGKILL', (err) => {
            if (err) {
                // Hata olsa bile (yetki yok vb.) consola yazıp devam ediyoruz
                console.log('Process kapatılırken önemsiz uyarı:', err.message);
            }
            if (callback) callback();
        });
    } catch (e) {
        console.log('SafeKill hatası:', e.message);
        if (callback) callback();
    }
};

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

// --- EKLENEN KISIM: Uygulama Kapanırken Temizlik ---
app.on('before-quit', (event) => {
    // Eğer arkada devam eden bir indirme varsa
    if (currentDownloadProcess) {
        event.preventDefault(); // Kapanmayı anlık durdur

        const pid = currentDownloadProcess.pid;
        currentDownloadProcess = null;

        // İşlemi güvenli şekilde öldür, bitince uygulamadan çık
        safeKill(pid, () => {
            app.exit(); // Şimdi zorla çıkış yap
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// --- IPC İŞLEMLERİ ---

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.on('download-video', async (event, { url, folderPath, formats }) => {
    try {
        if (!url || !folderPath) {
            mainWindow.webContents.send('download-status', {
                message: 'Hata: URL ve klasör yolu gerekli!',
                type: 'error'
            });
            return;
        }

        // yt-dlp var mı kontrolü
        try {
            await checkYtDlp();
        } catch (err) {
            mainWindow.webContents.send('download-status', {
                message: `Hata: ${err}`,
                type: 'error'
            });
            return;
        }

        const args = [];

        // --- DÜZELTME: FFmpeg yolunu belirtiyoruz ---
        // Bu satır olmazsa video ve ses birleşmez!
        args.push('--ffmpeg-location', ffmpegPath);

        // İlerleme çubuğu formatı (regex ile yakalamak için)
        args.push('--newline');

        if (formats && formats.includes('mp3')) {
            args.push('-x', '--audio-format', 'mp3');
        }
        if (formats && formats.includes('original')) {
            args.push('-f', 'bestvideo+bestaudio/best');
        }

        // Çıktı formatı
        args.push('-o', `${folderPath}/%(title)s.%(ext)s`);
        args.push(url);

        // İşlemi başlat
        const process = spawn(ytDlpPath, args, { windowsHide: true });
        currentDownloadProcess = process;

        process.stdout.on('data', (chunk) => {
            const data = String(chunk).trim();
            // Boş satırları filtrele
            if (data) {
                mainWindow.webContents.send('download-status', {
                    message: `İndiriliyor: ${data}`,
                    type: 'info'
                });
            }
        });

        process.stderr.on('data', (chunk) => {
            const data = String(chunk).trim();
            if (data) {
                // Hata mesajı mı yoksa bilgi mi kontrol edilebilir ama şimdilik info basıyoruz
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
                    message: 'İşlem başarıyla tamamlandı!',
                    type: 'success'
                });
            } else {
                // Eğer manuel iptal edildiyse hata mesajı basma (PID null ise iptal edilmiştir)
                mainWindow.webContents.send('download-status', {
                    message: 'İşlem sonlandı.',
                    type: 'info'
                });
            }
            mainWindow.webContents.send('download-complete');
        });

        process.on('error', (err) => {
            currentDownloadProcess = null;
            mainWindow.webContents.send('download-status', {
                message: `Başlatma hatası: ${err.message}`,
                type: 'error'
            });
            mainWindow.webContents.send('download-complete');
        });

    } catch (error) {
        mainWindow.webContents.send('download-status', {
            message: `Beklenmeyen hata: ${error.message || error}`,
            type: 'error'
        });
        mainWindow.webContents.send('download-complete');
    }
});

ipcMain.on('cancel-download', () => {
    if (currentDownloadProcess && currentDownloadProcess.pid) {
        const pid = currentDownloadProcess.pid;
        currentDownloadProcess = null; // Referansı hemen kopar

        // --- DÜZELTME: safeKill kullanıyoruz ---
        safeKill(pid, () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('download-status', {
                    message: 'İndirme iptal edildi.',
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

function checkYtDlp() {
    return new Promise((resolve, reject) => {
        const check = spawn(ytDlpPath, ['--version'], { windowsHide: true });
        check.on('close', (code) => {
            if (code === 0) resolve(true);
            else reject('yt-dlp bulunamadı (Exit Code 1).');
        });
        check.on('error', () => {
            reject('yt-dlp.exe dosyası bin klasöründe bulunamadı.');
        });
    });
}