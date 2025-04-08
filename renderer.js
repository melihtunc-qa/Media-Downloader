window.onload = () => {
    document.getElementById('url').focus();
};




const { ipcRenderer } = require('electron');

document.getElementById('selectFolder').addEventListener('click', async () => {
    const folderPath = await ipcRenderer.invoke('select-folder');
    if (folderPath) {
        document.getElementById('folderPath').innerText = `Seçilen Klasör: ${folderPath}`;
        document.getElementById('folderPath').dataset.path = folderPath;
    }
});

document.getElementById('download').addEventListener('click', () => {
    const url = document.getElementById('url').value;
    const folderPath = document.getElementById('folderPath').dataset.path;

    // URL doğrulama
    try {
        new URL(url);
    } catch {
        document.getElementById('status').innerText = 'Hata: Geçersiz URL formatı!';
        return;
    }

    if (!url || !folderPath) {
        document.getElementById('status').innerText = 'Hata: URL ve hedef klasör gerekli!';
        return;
    }

    // Butonları devre dışı bırak
    document.getElementById('download').disabled = true;
    document.getElementById('selectFolder').disabled = true;

    document.getElementById('status').innerText = 'İndirme başlatıldı...';

    ipcRenderer.send('download-video', { url, folderPath });
});

// İndirme tamamlandığında butonları tekrar aktif et
ipcRenderer.on('download-complete', () => {
    document.getElementById('download').disabled = false;
    document.getElementById('selectFolder').disabled = false;
});

ipcRenderer.on('download-status', (event, message) => {
    document.getElementById('status').innerText = message;
});
