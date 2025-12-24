const translations = {
    tr: {
        title: "Video İndirme Aracı",
        startDownload: "İndirmeyi Başlat",
        cancelDownload: "İptal Et",
        selectFolder: "Klasör Seç",
        placeholder: "Video URL'sini girin",
        radioButtonVideo: "Orijinal Video",
        radioButtonAudio: "Ses Dosyası (mp3)",
        statusDefault: "",
        folderPath: "Klasör Seçilmedi"

    },
    en: {
        title: "Video Downloader Tool",
        startDownload: "Start Download",
        cancelDownload: "Cancel",
        selectFolder: "Select Folder",
        placeholder: "Enter or paste video URL",
        radioButtonVideo: "Original Video",
        radioButtonAudio: "Audio (mp3)",
        statusDefault: "",
        folderPath: "Folder Path not Defined"

    }
};

window.setLanguage = function (lang) {
    const t = translations[lang] || translations['tr'];
    document.title = t.title;
    document.querySelector("h2").textContent = t.title;
    document.getElementById("download").textContent = t.startDownload;
    document.getElementById("cancel").textContent = t.cancelDownload;
    document.getElementById("selectFolder").textContent = t.selectFolder;
    document.getElementById("url").placeholder = t.placeholder;
    document.getElementById("folderPath").textContent = t.folderPath;

    const labelOriginal = document.getElementById("label-original");
    const labelMp3 = document.getElementById("label-mp3");

    if (labelOriginal) labelOriginal.textContent = t.radioButtonVideo;
    if (labelMp3) labelMp3.textContent = t.radioButtonAudio;

};
