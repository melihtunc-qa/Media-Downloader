const { ipcRenderer } = require('electron');

document.getElementById('selectFolder').addEventListener('click', async () => {
    const folderPath = await ipcRenderer.invoke('select-folder');
    if (folderPath) {
        document.getElementById('folderPath').innerText = `Seçilen Klasör: ${folderPath}`;
        document.getElementById('folderPath').dataset.path = folderPath;
    }
});

document.getElementById('download').addEventListener('click', () => {
    const url = document.getElementById('url').value.trim();
    const folderPath = document.getElementById('folderPath').dataset.path;

    // URL doğrulama
    try {
        new URL(url);
    } catch {
        showStatus('Hata: Geçersiz URL formatı!', 'error');
        return;
    }

    if (!url || !folderPath) {
        showStatus('Hata: URL ve hedef klasör gerekli!', 'error');
        return;
    }

    const formats = [];
    if (document.querySelector('input[value="original"]').checked) {
        formats.push('original');
    }

    if (document.querySelector('input[value="mp3"]').checked) {
        formats.push('mp3');
    }

    if (formats.length === 0) {
        showStatus('En az bir format seçmelisiniz!', 'error');
        return;
    }

    // Butonları devre dışı bırak
    toggleControls(true);
    showStatus('İndirme başlatıldı...', 'info');

    ipcRenderer.send('download-video', { url, folderPath, formats });
});

ipcRenderer.on('download-complete', () => {
    toggleControls(false);
});

ipcRenderer.on('download-status', (event, { message, type }) => {
    showStatus(message, type);
});

// Yardımcı fonksiyonlar
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.innerText = message;
    statusEl.className = `status ${type}`;
}

function toggleControls(disabled) {
    document.getElementById('download').disabled = disabled;
    document.getElementById('selectFolder').disabled = disabled;
    document.getElementById('url').disabled = disabled;
}

// URL input alanına paste olayı ekle
document.getElementById('url').addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    e.target.value = text.trim();
});