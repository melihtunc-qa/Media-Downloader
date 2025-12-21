interface Window {
  electronAPI: {
    selectFolder: () => Promise<string | null>;
    downloadVideo: (data: {
      url: string;
      folderPath: string;
      formats: string[];
    }) => Promise<void>;
    onDownloadStatus: (
      callback: (event: any, data: { message: string; type: string }) => void
    ) => void;
    onDownloadComplete: (callback: () => void) => void;
    cancelDownload: () => void;
  };
}
