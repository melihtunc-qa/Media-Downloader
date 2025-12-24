// renderer.js
window.onload = () => {
    document.getElementById('url').focus();
    validateInputs();
}

const urlInput = document.getElementById('url');
const downloadBtn = document.getElementById('download');
const selectFolderBtn = document.getElementById('selectFolder');
const folderPathDisplay = document.getElementById('folderPath');
const languageSelect = document.getElementById('language');

// --- VALIDATION & INPUTS ---
urlInput.addEventListener('input', validateInputs);
urlInput.addEventListener('paste', (e) => setTimeout(validateInputs, 100));

// Klasör Seçme
selectFolderBtn.addEventListener('click', async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
        const currentLang = languageSelect.value;
        const prefix = currentLang === 'en' ? 'Selected Folder: ' : 'Seçilen Klasör: ';

        document.getElementById('folderPath').innerText = `${prefix}${folderPath}`;
        document.getElementById('folderPath').dataset.path = folderPath;

        folderPathDisplay.style.color = '#16a34a';
        folderPathDisplay.style.fontWeight = 'bold';
        validateInputs();
    }
});

// Buton Kontrolü
function validateInputs() {
    const url = urlInput.value.trim();
    const folderPath = folderPathDisplay.dataset.path;
    const isValidUrl = url.length > 0 && (url.startsWith('http') || url.startsWith('www'));
    const currentLang = languageSelect.value;

    const texts = {
        tr: { start: 'İndirmeyi Başlat', select: 'Önce Klasör Seçin', url: 'URL Girin' },
        en: { start: 'Start Download', select: 'Select Folder First', url: 'Enter URL' }
    };
    const t = texts[currentLang] || texts.tr;

    if (isValidUrl && folderPath) {
        downloadBtn.disabled = false;
        downloadBtn.style.opacity = '1';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.innerText = t.start;
    } else {
        downloadBtn.disabled = true;
        downloadBtn.style.opacity = '0.5';
        downloadBtn.style.cursor = 'not-allowed';

        if (!folderPath) downloadBtn.innerText = t.select;
        else if (!isValidUrl) downloadBtn.innerText = t.url;
    }
}

// Dil değişince buton metnini güncelle
languageSelect.addEventListener('change', () => {
    validateInputs();
    const folderPath = folderPathDisplay.dataset.path;
    if (folderPath) {
        const currentLang = languageSelect.value;
        const prefix = currentLang === 'en' ? 'Selected Folder: ' : 'Seçilen Klasör: ';
        document.getElementById('folderPath').innerText = `${prefix}${folderPath}`;
    }
});

// --- İNDİRME İŞLEMİ ---
downloadBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const folderPath = folderPathDisplay.dataset.path;
    const language = languageSelect.value;

    const selectedFormat = document.querySelector('input[name="format"]:checked');
    const formats = [selectedFormat.value];

    toggleControls(true);

    const startMsg = language === 'en' ? 'Starting...' : 'Hazırlanıyor...';
    showStatus(startMsg, 'info');

    window.electronAPI.downloadVideo({ url, folderPath, formats, language });
});

window.electronAPI.onDownloadComplete(() => {
    toggleControls(false);
    validateInputs();
});

window.electronAPI.onDownloadStatus((event, { message, type }) => {
    // STOP mesajını çevir
    if (message === 'STOP') {
        const lang = languageSelect.value;
        message = lang === 'en' ? '⛔ Download cancelled.' : '⛔ İndirme iptal edildi.';
    }
    showStatus(message, type);
});

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.innerText = message;
    statusEl.className = `status ${type}`;
}

function toggleControls(disabled) {
    downloadBtn.disabled = disabled;
    selectFolderBtn.disabled = disabled;
    urlInput.disabled = disabled;
    languageSelect.disabled = disabled;

    const cancelBtn = document.getElementById('cancel');
    if (disabled) {
        cancelBtn.style.display = 'inline-block';
        downloadBtn.style.display = 'none';
    } else {
        cancelBtn.style.display = 'none';
        downloadBtn.style.display = 'inline-block';
    }
}

document.getElementById('url').addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    e.target.value = text.trim();
    validateInputs();
});

document.getElementById('cancel').addEventListener('click', () => {
    if (window.electronAPI && window.electronAPI.cancelDownload) {
        window.electronAPI.cancelDownload();
        const lang = languageSelect.value;
        const msg = lang === 'en' ? 'Cancelling...' : 'İptal ediliyor...';
        showStatus(msg, 'info');
    }
});