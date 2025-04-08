const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');

let mainWindow;
let currentDownloadProcess = null;

const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp.exe');

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
});

// Klasör seçme işlemi
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

// Video indirme işlemi
ipcMain.on('download-video', async (event, { url, folderPath }) => {
    try {
        if (!url || !folderPath) {
            event.reply('download-status', 'Hata: URL ve klasör yolu gerekli!');
            return;
        }


        try {
            await checkYtDlp();
        } catch (error) {
            event.reply('download-status', `Hata: ${error}`);
            return;
        }

        const command = `"${ytDlpPath}" -o "${folderPath}/%(title)s.%(ext)s" "${url}"`;
        const process = exec(command);
        currentDownloadProcess = process;

        process.stdout.on('data', (data) => {
            event.reply('download-status', `İndirme devam ediyor: ${data}`);
        });

        process.stderr.on('data', (data) => {
            event.reply('download-status', `Uyarı: ${data}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                event.reply('download-status', 'İndirme tamamlandı!');
            } else {
                event.reply('download-status', `Hata: İşlem kodu ${code}. URL geçersiz olabilir veya indirme klasörüne yazma izniniz olmayabilir.`);
            }
        });
    } catch (error) {
        event.reply('download-status', `Beklenmeyen hata: ${error.message}`);
    }
});

ipcMain.on('cancel-download', () => {
    if (currentDownloadProcess) {
        currentDownloadProcess.kill();
        currentDownloadProcess = null;
        event.reply('download-status', 'İndirme iptal edildi');
    }
});

// yt-dlp'nin yüklü olup olmadığını kontrol etme
function checkYtDlp() {
    return new Promise((resolve, reject) => {
        exec(`"${ytDlpPath}" --version`, (error) => {
            if (error) {
                reject('yt-dlp bulunamadı. Lütfen bin klasörüne bağımlılık dosyasını yerleştirin.');
            } else {
                resolve(true);
            }
        });
    });
}

// Uygulama kapatma olaylarını ekleyelim
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
