// 檔案名稱：common.js
// 這裡放所有「功能邏輯」，包含標籤切換、生成文字、複製跳轉

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

// 4. Copy & Go (已包含手機版 App 喚醒優化)
async function copyAndGo() {
    const reviewText = document.getElementById("reviewArea").value;
    
    if (reviewText.includes("請點選")) {
        showToast("請先選擇至少一個標籤喔!", "warning");
        return;
    }

    // 檢查 HTML 是否有定義必要的全域變數
    if (typeof GOOGLE_PLACE_ID === 'undefined' || typeof GOOGLE_REVIEW_URL === 'undefined') {
        console.error("未設定 Google Place ID 或 Review URL");
        showToast("系統設定錯誤，請聯繫管理員", "warning");
        return;
    }

    try {
        await navigator.clipboard.writeText(reviewText);
        handleRedirect(); // 複製成功後跳轉
    } catch (err) {
        // 降級處理 (舊版瀏覽器)
        const reviewArea = document.getElementById("reviewArea");
        reviewArea.select();
        try {
            document.execCommand("copy");
            handleRedirect();
        } catch (fallbackErr) {
            showToast("複製失敗，請手動複製", "warning");
        }
    }
}

// 處理跳轉邏輯 (手機喚醒 App 核心)
function handleRedirect() {
    showToast("✓ 評論已複製！準備跳轉...", "success");

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // 延遲一點點讓 Toast 被看到
    setTimeout(() => {
        if (isMobile) {
            // 手機版：喚醒 Google Maps App
            window.location.href = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${GOOGLE_PLACE_ID}`;
        } else {
            // 電腦版：開新分頁到評論頁
            window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
        }
    }, 1500);
}

// 5. Toast 通知系統
function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.className = `show ${type}`;
    
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}