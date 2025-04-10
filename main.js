const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');

let mainWindow;
let currentDownloadProcess = null;

const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp.exe');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 700,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'bin', 'icon.png'),
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.on('download-video', async (event, { url, folderPath, formats }) => {
    try {
        if (!url || !folderPath) {
            event.reply('download-status', {
                message: 'Hata: URL ve klasör yolu gerekli!',
                type: 'error'
            });
            return;
        }

        try {
            await checkYtDlp();
        } catch (error) {
            event.reply('download-status', {
                message: `Hata: ${error}`,
                type: 'error'
            });
            return;
        }

        let formatOptions = '';
        if (formats.includes('mp3')) {
            formatOptions += ' -x --audio-format mp3';
        }
        if (formats.includes('original')) {
            formatOptions += ' -f bestvideo+bestaudio/best';
        }

        const command = `"${ytDlpPath}" ${formatOptions} -o "${folderPath}/%(title)s.%(ext)s" "${url}"`;
        const process = exec(command);
        currentDownloadProcess = process;

        process.stdout.on('data', (data) => {
            event.reply('download-status', {
                message: `İndirme devam ediyor: ${data}`,
                type: 'info'
            });
        });

        process.stderr.on('data', (data) => {
            event.reply('download-status', {
                message: `Uyarı: ${data}`,
                type: 'error'
            });
        });

        process.on('close', (code) => {
            if (code === 0) {
                event.reply('download-status', {
                    message: 'İndirme başarıyla tamamlandı!',
                    type: 'success'
                });
            } else {
                event.reply('download-status', {
                    message: `Hata: İşlem başarısız oldu. URL geçersiz olabilir veya klasöre yazma izniniz olmayabilir.`,
                    type: 'error'
                });
            }
            event.reply('download-complete');
        });
    } catch (error) {
        event.reply('download-status', {
            message: `Beklenmeyen hata: ${error.message}`,
            type: 'error'
        });
        event.reply('download-complete');
    }
});

function checkYtDlp() {
    return new Promise((resolve, reject) => {
        exec(`"${ytDlpPath}" --version`, (error) => {
            if (error) {
                reject('yt-dlp bulunamadı. Lütfen bin klasörüne gerekli dosyaları yerleştirin.');
            } else {
                resolve(true);
            }
        });
    });
}

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