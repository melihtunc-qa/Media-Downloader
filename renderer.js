// renderer.js
window.onload = () => {
    document.getElementById('url').focus();
}

document.getElementById('selectFolder').addEventListener('click', async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
        document.getElementById('folderPath').innerText = `Seçilen Klasör: ${folderPath}`;
        document.getElementById('folderPath').dataset.path = folderPath;
    }
});

document.getElementById('download').addEventListener('click', () => {
    const url = document.getElementById('url').value.trim();
    const folderPath = document.getElementById('folderPath').dataset.path;

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

    const selectedFormat = document.querySelector('input[name="format"]:checked');
    if (!selectedFormat) {
        showStatus('Lütfen bir format seçin!', 'error');
        return;
    }

    const formats = [selectedFormat.value];

    toggleControls(true);
    showStatus('İndirme başlatıldı...', 'info');

    window.electronAPI.downloadVideo({ url, folderPath, formats });
});

window.electronAPI.onDownloadComplete(() => {
    toggleControls(false);
});

window.electronAPI.onDownloadStatus((event, { message, type }) => {
    showStatus(message, type);
});

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.innerText = message;
    statusEl.className = `status ${type}`;
}

function toggleControls(disabled) {
    document.getElementById('download').disabled = disabled;
    document.getElementById('selectFolder').disabled = disabled;
    document.getElementById('url').disabled = disabled;
    document.getElementById('cancel').style.display = disabled ? 'inline-block' : 'none';
}

document.getElementById('url').addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    e.target.value = text.trim();
});

document.getElementById('cancel').addEventListener('click', () => {
    if (window.electronAPI && window.electronAPI.cancelDownload) {
        window.electronAPI.cancelDownload();
        showStatus('İptal isteği gönderildi...', 'info');
        toggleControls(false);
    } else {
        showStatus('İptal fonksiyonu bulunamadı!', 'error');
    }
});
