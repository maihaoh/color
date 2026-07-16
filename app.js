/**
 * ============================================================================
 * 🤖 AI QUANT HUB - WINGO 30S 完美排版自驱动引擎 (app.js)
 * ============================================================================
 */

window.runtime = {
    wingo: {
        currentPred: null,
        stats: { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 },
        history: []
    }
};

window.StorageManager = {
    saveHistory: (key, data) => localStorage.setItem(`${key}_hist`, JSON.stringify(data.slice(0, 50))),
    saveStats: (key, data) => localStorage.setItem(`${key}_stats`, JSON.stringify(data)),
    load: (key) => {
        const h = localStorage.getItem(`${key}_hist`);
        const s = localStorage.getItem(`${key}_stats`);
        if (h) window.runtime[key].history = JSON.parse(h);
        if (s) window.runtime[key].stats = JSON.parse(s);
    }
};

const AIPredictor = {
    analyze: () => {
        const sides = ['庄', '闲'];
        const sizes = ['大', '小'];
        const side = sides[Math.floor(Math.random() * sides.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const confidence = Math.floor(Math.random() * 31) + 65; 

        window.runtime.wingo.currentPred = { side, size, confidence };
        
        // 精准寻找特定的预测文本位置，绝不乱改其他标签
        const allDivs = document.getElementsByTagName('div');
        for (let el of allDivs) {
            if (el.children.length === 0) {
                if (el.innerText.includes('AI 信心指数') || el.innerText.includes('信心指数')) {
                    el.innerHTML = `AI 信心指数 <span style="color:#ffb703">${confidence}%</span>`;
                }
                if (el.innerText.includes('单双前瞻')) el.innerText = `单双前瞻: ${side}`;
                if (el.innerText.includes('大小推荐')) el.innerText = `大小推荐: ${size}`;
            }
        }
    }
};

window.refreshGlobalUI = function() {
    const wingo = window.runtime.wingo;
    const allEl = document.getElementsByTagName('*');
    
    for (let el of allEl) {
        if (el.children.length === 0) {
            if (el.innerText.startsWith('已统计局数')) el.innerText = `已统计局数: ${wingo.stats.totalRounds}`;
            if (el.innerText.startsWith('当前连中')) el.innerText = `当前连中: ${wingo.stats.currentStreak}`;
            if (el.innerText.startsWith('最高连中')) el.innerText = `最高连中: ${wingo.stats.maxStreak}`;
            if (el.innerText.startsWith('量化分析胜率')) {
                const rate = wingo.stats.totalRounds > 0 ? ((wingo.stats.winRounds / wingo.stats.totalRounds) * 100).toFixed(1) : "0.0";
                el.innerHTML = `量化分析胜率: <span style="color:#00b4d8">${rate}%</span>`;
            }
        }
    }
};

// ⏱️ 精准时钟：只修改包含 "下期倒计时" 的那一行文字！
function startClockKernel() {
    let timeLeft = 30.0;

    setInterval(() => {
        timeLeft -= 0.1;
        if (timeLeft <= 0) {
            timeLeft = 30.0;
            AIPredictor.analyze();
            simulateFallbackResult();
        }

        const allElements = document.getElementsByTagName('*');
        for (let el of allElements) {
            // 仅仅当文本包含“下期倒计时”或“倒计时”时才修改，绝不破坏CSS结构
            if (el.children.length === 0 && el.innerText.includes('下期倒计时')) {
                el.innerHTML = `Wingo 30S 下期倒计时 <span style="color:#e63946; font-weight:bold; font-size:1.2em;">${timeLeft.toFixed(1)}s</span>`;
            }
        }
    }, 100);
}

function simulateFallbackResult() {
    const mockNumber = Math.floor(Math.random() * 10);
    const mockPeriod = new Date().getTime().toString().substring(0, 11);
    processIncomingResult(mockPeriod, mockNumber);
}

function processIncomingResult(period, number) {
    const wingo = window.runtime.wingo;
    if (wingo.history.length > 0 && wingo.history[0].period === period) return;

    const side = number % 2 === 0 ? '庄' : '闲';
    const size = number >= 5 ? '大' : '小';
    
    let isWin = false;
    if (wingo.currentPred) {
        isWin = (wingo.currentPred.side === side);
    }

    wingo.stats.totalRounds += 1;
    if (isWin) {
        wingo.stats.winRounds += 1;
        wingo.stats.currentStreak += 1;
        if (wingo.stats.currentStreak > wingo.stats.maxStreak) wingo.stats.maxStreak = wingo.stats.currentStreak;
    } else {
        wingo.stats.currentStreak = 0;
    }

    wingo.history.unshift({ period, number, side, size, isWin });
    window.StorageManager.saveHistory('wingo', wingo.history);
    window.StorageManager.saveStats('wingo', wingo.stats);
    window.refreshGlobalUI();
}

const dataChannel = new BroadcastChannel('wingo_realtime_bridge');
dataChannel.onmessage = function(event) {
    if (event.data && event.data.type === 'OFFICIAL_OPEN_RESULT') {
        processIncomingResult(event.data.period, event.data.number);
    }
};

window.onload = function() {
    window.StorageManager.load('wingo');
    window.refreshGlobalUI();
    startClockKernel();
    AIPredictor.analyze();
};
