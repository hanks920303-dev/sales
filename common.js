// 檔案名稱：common.js
// 優化版：包含手機 App 強制喚醒 & 手動按鈕接管

// 初始化變數
let selectedSituation = null;
let selectedFeatures = new Set();

// 1. 切換標籤功能
function toggleTag(btn, type) {
    const value = btn.getAttribute('data-value');

    if (type === 'situation') {
        const siblings = document.getElementById('situation-tags').children;
        for (let sibling of siblings) {
            sibling.classList.remove('selected');
        }
        
        if (selectedSituation === value) {
            selectedSituation = null;
        } else {
            btn.classList.add('selected');
            selectedSituation = value;
        }

    } else if (type === 'feature') {
        if (selectedFeatures.has(value)) {
            selectedFeatures.delete(value);
            btn.classList.remove('selected');
        } else {
            selectedFeatures.add(value);
            btn.classList.add('selected');
        }
    }

    generateText();
}

// 2. 生成評論文字功能
function generateText() {
    let parts = [];

    if (selectedSituation) {
        const options = corpus.situation[selectedSituation];
        parts.push(getRandom(options));
    }

    selectedFeatures.forEach(feature => {
        const options = corpus.feature[feature];
        parts.push(getRandom(options));
    });

    if (parts.length === 0) {
        document.getElementById('reviewArea').value = "請點選上方標籤,組合您的真實體驗...";
        return;
    }

    if (Math.random() > 0.3) {
        parts.push(getRandom(corpus.closing));
    }

    document.getElementById('reviewArea').value = parts.join(" ");
}

// 3. 隨機選取工具
function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 4. Copy & Go (複製並跳轉)
async function copyAndGo() {
    const reviewText = document.getElementById("reviewArea").value;
    
    if (reviewText.includes("請點選")) {
        showToast("請先選擇至少一個標籤喔!", "warning");
        return;
    }

    if (typeof GOOGLE_PLACE_ID === 'undefined') {
        console.error("未設定 Google Place ID");
        showToast("系統設定錯誤，請聯繫管理員", "warning");
        return;
    }

    try {
        await navigator.clipboard.writeText(reviewText);
        showToast("✓ 評論已複製！準備跳轉...", "success");
        // 延遲一點點讓使用者看到 Toast
        setTimeout(() => {
            performSmartRedirect();
        }, 1500);
        
    } catch (err) {
        // 降級處理 (舊版瀏覽器)
        const reviewArea = document.getElementById("reviewArea");
        reviewArea.select();
        try {
            document.execCommand("copy");
            showToast("✓ 評論已複製！準備跳轉...", "success");
            setTimeout(() => {
                performSmartRedirect();
            }, 1500);
        } catch (fallbackErr) {
            showToast("複製失敗，請手動複製", "warning");
        }
    }
}

// 5. 核心跳轉邏輯 (統一管理 App 喚醒)
function performSmartRedirect() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 【手機版邏輯】
        // 使用 Google Maps Universal Link 喚醒 App
        // 這會打開地圖 App 並定位到該商家，使用者只要往下滑一點點就能評分
        // 優點：100% 避開網頁版登入地獄
        const appUrl = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${GOOGLE_PLACE_ID}`;
        window.location.href = appUrl;
    } else {
        // 【電腦版邏輯】
        // 電腦版大家通常都登入了，直接跳出「寫評論視窗」體驗最好
        window.open(`https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`, '_blank', 'noopener,noreferrer');
    }
}

// 6. Toast 通知系統
function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.className = `show ${type}`;
    
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

// 7. 【新功能】初始化：綁定手動按鈕的點擊事件
// 確保 HTML 載入後執行
document.addEventListener("DOMContentLoaded", function() {
    const manualBtn = document.getElementById("manualGoogleBtn");
    
    // 如果找得到那顆按鈕 (避免報錯)
    if (manualBtn) {
        manualBtn.addEventListener("click", function(e) {
            e.preventDefault(); // 阻止原本的 href 跳轉
            
            // 直接執行我們寫好的聰明跳轉邏輯
            performSmartRedirect();
        });
    }
});