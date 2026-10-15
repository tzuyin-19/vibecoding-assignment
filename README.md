# Dream Vending Machine ✳

可愛微立體風格的夢境販賣機網頁小遊戲：三個夢境場景、六個事件、十二種結局、隨機對話和自動動畫。

## 本機測試
直接用瀏覽器開啟 `index.html`。如需測試網站伺服器環境，也可在本資料夾執行 `python -m http.server 8000`，再開啟 `http://localhost:8000`。

## GitHub Pages 部署
1. 在 GitHub 建立新 repository（例如 `dream-vending-machine`）。
2. 將 `index.html`、`style.css`、`script.js`、`SPEC.md`、`README.md` 放在 repository 根目錄。
3. 在 Settings → Pages → Build and deployment 選擇 Deploy from a branch，Branch 選 `main`、資料夾選 `/ (root)`，儲存。
4. 等部署完成後，以 GitHub Pages 產生的網址開啟網站。

## 技術
純 HTML/CSS/JS。原型舞台由 CSS 幾何圖形繪製，不依賴外部圖片，也不需要 API 金鑰。
Google Fonts 載入失敗時會自動使用系統字型。
