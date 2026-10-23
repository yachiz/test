# Aurora Atlas｜北歐極光 12 日互動旅行手冊

這是可以直接部署到 GitHub Pages 的靜態 PWA 專案。保留原有互動旅程、航班、圖片相簿、19 張美食與紀念品佔位圖，以及手機／平板／電腦響應式排版。

## 第一次發佈（不需要編譯、不需要 npm）

1. 在 GitHub 建立新的 **Public** repository，例如 `aurora-atlas`。
2. 把這個資料夾 **裡面的所有檔案與資料夾** 上傳到 repository 根目錄（`index.html` 一定要在最外層）。可使用 GitHub 的 **Add file → Upload files**，或用 git push。
3. 進入 **Settings → Pages → Build and deployment**，選 **Deploy from a branch**；Branch 選 `main`，Folder 選 `/(root)`，按 **Save**。
4. GitHub Pages 部署完成後，網址通常是 `https://你的帳號.github.io/aurora-atlas/`（以 Pages 畫面顯示的網址為準）。
5. 在 Safari 開啟網站，分享 →「加入主畫面」；Chrome / 桌面瀏覽器亦可直接使用。

## 自己更新圖片（GitHub 上直接編輯）

- 打開 repo → `images/` 或 `images/food/` → 選擇目標檔案。
- GitHub 網頁上可用 **Add file → Upload files** 上傳新圖並提交（如遇同名檔案無法覆蓋，可使用檔案右上角刪除再上傳，或使用 Git / GitHub Desktop 替換）。
- 維持相同檔名與 `.jpg` 副檔名；提交到 `main` 後，GitHub Pages 會重新發佈。
- 對照 `image_manifest.csv` 看哪個檔案對應哪個景點、食物或紀念品。
- 因已支援離線快取，網站通常會在下一次**連線開啟時**取得新圖片；若仍看到舊照片，重新整理、關閉重開，或提高 `service-worker.js` 內的 `CACHE` 版號（例如 `aurora-atlas-v2`），即可強制重建快取。

## 不希望被 Google 搜尋

`index.html` 已加上 `robots` 與 `googlebot` 的 `noindex` 標記。這是搜尋引擎索引提示，**不是密碼保護**：知道網址的人仍可直接觀看；GitHub 公開 repo 的程式碼與圖片也都能被任何人查看。不要上傳護照、訂位代碼或個資。不要以 `robots.txt` 禁止爬取 HTML，否則 Google 可能看不到 `noindex`。

## PWA 離線模式

`manifest.webmanifest`、`icons/`、`service-worker.js` 已設定；經 HTTPS 網址第一次載入、且服務工作者完成安裝後，可離線打開已快取的內容。第一次使用必須有網路。離線內容依瀏覽器儲存政策可能被清除，請勿以此替代重要旅行文件。

## 專案結構

```text
aurora-atlas/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── .nojekyll
├── icons/
├── images/
│   └── food/
├── image_manifest.csv
└── README.md
```

## 本機預覽

電腦安裝 Python 後，在專案資料夾執行 `python -m http.server 8000`，於瀏覽器開啟 `http://localhost:8000`。直接雙擊 HTML 也能看部分內容，但 PWA / service worker 需要 HTTPS 或 localhost。

> 注意：原有圖片為 AI 情境示意，並非實景；可依 `image_manifest.csv` 逐張換成你的實拍圖。
