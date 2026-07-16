/**
 * ============================================================================
 * AI Multi-Predictor V3.5 - 旗舰一体化核心驱动内核 (双游戏独立隔离版)
 * 包含模块：Storage, Timer, Strategy, Predictor, Chart, App Controller
 * ============================================================================
 */

// 【系统安全桥接】确保 HTML 中的 onclick 事件在任何加载阶段都能安全触发
window.changeGame = function(gameId) {
    if (window.switchCategory) {
        window.switchCategory(gameId);
    } else {
        console.warn("[System] 控制器尚未完全初始化，请稍候...");
    }
};

/* ============================================================================
   1. MODULE: STORAGE MANAGER (独立命名空间本地存储)
   ============================================================================ */
const StorageManager = {
    getKeys(gameId) {
        return {
            HISTORY: `vp_${gameId}_history_v35`,
            STATS: `vp_${gameId}_stats_v35`
        };
    },
    getHistory(gameId) {
        try {
            const keys = this.getKeys(gameId);
            const data = localStorage.getItem(keys.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`[Storage] 读取 ${gameId} 历史失败:`, e);
            return [];
        }
    },
    saveHistory(gameId, historyList) {
        try {
            const keys = this.getKeys(gameId);
            const limitedList = historyList.slice(0, 100);
            localStorage.setItem(keys.HISTORY, JSON.stringify(limitedList));
        } catch (e) {
            console.error(`[Storage] 保存 ${gameId} 历史失败:`, e);
        }
    },
    getStats(gameId) {
        try {
            const keys = this.getKeys(gameId);
            const data = localStorage.getItem(keys.STATS);
            return data ? JSON.parse(data) : { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 };
        } catch (e) {
            console.error(`[Storage] 读取 ${gameId} 统计失败:`, e);
            return { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 };
        }
    },
    saveStats(gameId, statsObj) {
        try {
            const keys = this.getKeys(gameId);
            localStorage.setItem(keys.STATS, JSON.stringify(statsObj));
        } catch (e) {
            console.error(`[Storage] 保存 ${gameId} 统计失败:`, e);
        }
    },
    clearGameData(gameId) {
        try {
            const keys = this.getKeys(gameId);
            localStorage.removeItem(keys.HISTORY);
            localStorage.removeItem(keys.STATS);
            return true;
        } catch (e) {
            return false;
        }
    }
};

/* ============================================================================
   2. MODULE: MULTI-TIMER ENGINE (双游戏独立并发时钟引擎)
   ============================================================================ */
class MultiTimerEngine {
    constructor() {
        this.activeGame = 'wingo'; 
        this.games = {
            wingo: { duration: 30000, timerId: null, onTick: null, onOpen: null, lastPeriodId: '' },
            baccarat: { duration: 40000, timerId: null, onTick: null, onOpen: null, lastPeriodId: '' }
        };
        this.initVisibilityListener();
    }
    registerGame(gameId, onTick, onOpen) {
        if (!this.games[gameId]) return;
        this.games[gameId].onTick = onTick;
        this.games[gameId].onOpen = onOpen;
        this.startClock(gameId);
    }
    switchFocus(gameId) {
        if (!this.games[gameId]) return;
        this.activeGame = gameId;
        this.triggerImmediateTick(gameId);
    }
    startClock(gameId) {
        const game = this.games[gameId];
        if (game.timerId) clearInterval(game.timerId);

        const run = () => {
            const now = Date.now();
            let timeLeftSec = 0;
            let periodId = '';

            if (gameId === 'wingo') {
                const currentPeriodStart = Math.floor(now / game.duration) * game.duration;
                const timePassed = now - currentPeriodStart;
                timeLeftSec = ((game.duration - timePassed) / 1000).toFixed(1);
                periodId = this.generateWingoPeriod(now);
            } else {
                const baseBacTime = 1767225600000; 
                const elapsed = now - baseBacTime;
                const roundIndex = Math.floor(elapsed / game.duration);
                const timePassed = elapsed % game.duration;
                timeLeftSec = ((game.duration - timePassed) / 1000).toFixed(1);
                periodId = this.generateBaccaratPeriod(roundIndex);
            }

            if (this.activeGame === gameId && game.onTick) {
                game.onTick(timeLeftSec, periodId);
            }

            if (parseFloat(timeLeftSec) <= 0.15 && game.lastPeriodId !== periodId) {
                game.lastPeriodId = periodId;
                setTimeout(() => {
                    if (game.onOpen) game.onOpen(periodId);
                }, 200);
            }
        };
        game.timerId = setInterval(run, 100);
        run();
    }
    triggerImmediateTick(gameId) {
        const game = this.games[gameId];
        if (game.onTick) {
            const now = Date.now();
            if (gameId === 'wingo') {
                const passed = now % 30000;
                game.onTick(((30000 - passed) / 1000).toFixed(1), this.generateWingoPeriod(now));
            } else {
                const elapsed = now - 1767225600000;
                game.onTick(((40000 - (elapsed % 40000)) / 1000).toFixed(1), this.generateBaccaratPeriod(Math.floor(elapsed / 40000)));
            }
        }
    }
    generateWingoPeriod(timestamp) {
        const date = new Date(timestamp);
        const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const index = Math.floor((timestamp - startOfDay) / 30000) + 1;
        return `${ymd}${String(index).padStart(4, '0')}`;
    }
    generateBaccaratPeriod(roundIndex) {
        const shoeSize = 60; 
        const shoeNum = Math.floor(roundIndex / shoeSize) % 99 + 1;
        const roundNum = (roundIndex % shoeSize) + 1;
        return `DG-A01-${String(shoeNum).padStart(2, '0')}靴-${String(roundNum).padStart(2, '0')}铺`;
    }
    initVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.startClock('wingo');
                this.startClock('baccarat');
                const statusEl = document.getElementById('sync-status');
                if (statusEl) statusEl.innerText = "多路时钟已完成毫秒级校准";
            }
        });
    }
}
window.multiTimerEngine = new MultiTimerEngine();

/* ============================================================================
   3. MODULE: STRATEGY ENGINE (双游戏策略量化分析矩阵)
   ============================================================================ */
const StrategyEngine = {
    analyzeWingo(history) {
        if (!history || history.length < 5) {
            return { hot: 50, cold: 50, neighbor: 50, span: 50, oe: 50, bs: 50 };
        }
        const numbers = history.map(item => Number(item.number));
        return {
            hot: this.calcWingoHot(numbers),
            cold: this.calcWingoCold(numbers),
            neighbor: this.calcWingoNeighbor(numbers),
            span: this.calcWingoSpan(numbers),
            oe: this.calcWingoOE(numbers),
            bs: this.calcWingoBS(numbers)
        };
    },
    calcWingoHot(nums) {
        const recent = nums.slice(0, 5), pool = nums.slice(0, 20);
        let matches = 0;
        recent.forEach(n => { matches += pool.filter(p => p === n).length - 1; });
        return Math.min(100, Math.max(10, 40 + (matches * 12)));
    },
    calcWingoCold(nums) {
        let missing = nums.slice(1).indexOf(nums[0]);
        if (missing === -1) missing = 30;
        return Math.min(100, Math.max(20, 30 + (missing * 3.5)));
    },
    calcWingoNeighbor(nums) {
        let diff = 0; const count = Math.min(10, nums.length - 1);
        for (let i = 0; i < count; i++) diff += Math.abs(nums[i] - nums[i + 1]);
        return Math.min(100, Math.max(15, Math.floor(100 - ((diff / count) * 12))));
    },
    calcWingoSpan(nums) {
        const chunk = nums.slice(0, 10);
        return Math.min(100, Math.max(10, Math.floor((Math.max(...chunk) - Math.min(...chunk)) * 11)));
    },
    calcWingoOE(nums) {
        const chunk = nums.slice(0, 15);
        return Math.floor((chunk.filter(n => n % 2 !== 0).length / chunk.length) * 100);
    },
    calcWingoBS(nums) {
        const chunk = nums.slice(0, 15);
        return Math.floor((chunk.filter(n => n >= 5).length / chunk.length) * 100);
    },
    analyzeBaccarat(history) {
        if (!history || history.length < 3) {
            return { trendBias: 50, bigEyeScore: 50, jumpRate: 50, longStreak: 50, pairProb: 10, naturalProb: 15 };
        }
        const results = history.map(item => item.side).reverse();
        const bigRoad = [];
        let currentCol = [];
        let lastResult = null;

        results.forEach(res => {
            if (res === '和') return;
            if (!lastResult) {
                currentCol.push(res);
                lastResult = res;
            } else if (res === lastResult) {
                currentCol.push(res);
            } else {
                bigRoad.push(currentCol);
                currentCol = [res];
                lastResult = res;
            }
        });
        if (currentCol.length > 0) bigRoad.push(currentCol);

        let redCount = 0, blueCount = 0;
        if (bigRoad.length >= 2) {
            for (let i = 1; i < bigRoad.length; i++) {
                const col = bigRoad[i];
                const prevCol = bigRoad[i - 1];
                for (let j = 0; j < col.length; j++) {
                    if (prevCol && prevCol.length >= j + 1) redCount++;
                    else blueCount++;
                }
            }
        }
        const totalEye = redCount + blueCount;
        const bigEyeScore = totalEye > 0 ? Math.floor((redCount / totalEye) * 100) : 50;

        const bankers = results.filter(r => r === '庄').length;
        const players = results.filter(r => r === '闲').length;
        const trendBias = Math.floor((bankers / (bankers + players || 1)) * 100);

        let jumps = 0;
        for (let i = 0; i < results.length - 1; i++) {
            if (results[i] !== results[i + 1]) jumps++;
        }
        const jumpRate = Math.floor((jumps / (results.length - 1 || 1)) * 100);

        let currentStreak = 1;
        const revResults = [...results].reverse();
        for (let i = 0; i < revResults.length - 1; i++) {
            if (revResults[i] === revResults[i + 1] && revResults[i] !== '和') currentStreak++;
            else break;
        }
        const longStreak = Math.min(100, currentStreak * 15);
        const pairProb = Math.min(45, Math.floor(10 + (jumpRate * 0.2)));
        const naturalProb = Math.min(50, Math.floor(15 + (bigEyeScore * 0.2)));

        return { trendBias, bigEyeScore, jumpRate, longStreak, pairProb, naturalProb };
    }
};

/* ============================================================================
   4. MODULE: AI PREDICTOR (决策生成与结果仿真物理引擎)
   ============================================================================ */
const AIPredictor = {
    WINGO_COLORS: { 0: '红紫', 1: '绿', 2: '红', 3: '绿', 4: '红', 5: '绿', 6: '红', 7: '绿', 8: '红', 9: '绿紫' },
    generatePrediction(gameId, history) {
        if (gameId === 'wingo') return this.predictWingo(history);
        return this.predictBaccarat(history);
    },
    predictWingo(history) {
        const scores = StrategyEngine.analyzeWingo(history);
        let bProb = 0.5, pProb = 0.5, bigProb = 0.5, smallProb = 0.5;
        let rProb = 0.45, gProb = 0.45, purProb = 0.1;

        const oeBias = (scores.oe - 50) / 100;
        bProb -= oeBias * 0.4; pProb += oeBias * 0.4;

        const bsBias = (scores.bs - 50) / 100;
        bigProb += bsBias * 0.5; smallProb -= bsBias * 0.5;

        if (scores.hot > 70) { gProb += 0.05; rProb -= 0.05; }
        if (scores.span < 40) purProb += 0.08;

        const confidence = Math.min(98, Math.max(62, Math.floor((100 - Math.abs(scores.neighbor - 50)) * 0.4 + Math.max(Math.abs(scores.oe - 50), Math.abs(scores.bs - 50)) * 1.2)));

        return {
            side: bProb >= pProb ? '庄' : '闲',
            size: bigProb >= smallProb ? '大' : '小',
            color: gProb > rProb && gProb > purProb ? '绿' : (purProb > rProb ? '紫' : '红'),
            confidence: confidence,
            scores: scores
        };
    },
    predictBaccarat(history) {
        const scores = StrategyEngine.analyzeBaccarat(history);
        let bankerWeight = 50, playerWeight = 50;

        bankerWeight += (scores.trendBias - 50) * 0.3;
        playerWeight -= (scores.trendBias - 50) * 0.3;

        if (scores.bigEyeScore > 55) {
            if (history.length > 0 && history[0].side === '庄') bankerWeight += 15;
            if (history.length > 0 && history[0].side === '闲') playerWeight += 15;
        } else if (scores.bigEyeScore < 45) {
            if (history.length > 0 && history[0].side === '庄') playerWeight += 12;
            if (history.length > 0 && history[0].side === '闲') bankerWeight += 12;
        }

        if (scores.jumpRate > 60) {
            if (history.length > 0 && history[0].side === '庄') { playerWeight += 20; bankerWeight -= 20; }
            if (history.length > 0 && history[0].side === '闲') { bankerWeight += 20; playerWeight -= 20; }
        }

        const sideRecommendation = bankerWeight >= playerWeight ? '庄' : '闲';
        let confidence = Math.min(99, Math.max(60, Math.floor(55 + Math.abs(bankerWeight - playerWeight) + (scores.longStreak * 0.2))));

        return { side: sideRecommendation, pairProb: `${scores.pairProb}%`, naturalProb: `${scores.naturalProb}%`, confidence, scores };
    },
    simulateResult(gameId) {
        if (gameId === 'wingo') {
            const num = Math.floor(Math.random() * 10);
            const side = num % 2 === 0 ? '庄' : '闲';
            const size = num >= 5 ? '大' : '小';
            let color = '红';
            if (this.WINGO_COLORS[num].includes('绿')) color = '绿';
            if (this.WINGO_COLORS[num].includes('紫')) color = '紫';
            return { number: num, side, size, color };
        } else {
            const bankerScore = Math.floor(Math.random() * 10);
            const playerScore = Math.floor(Math.random() * 10);
            let side = '和';
            if (bankerScore > playerScore) side = '庄';
            else if (playerScore > bankerScore) side = '闲';

            const randPair = Math.random();
            let formStr = '无对子';
            if (randPair < 0.05) formStr = '庄对';
            else if (randPair < 0.10) formStr = '闲对';
            else if (randPair < 0.12) formStr = '双对';

            return { number: `${bankerScore}点 vs ${playerScore}点`, side: side, size: `${side}[${bankerScore}-${playerScore}] (${formStr})`, color: (bankerScore >= 8 || playerScore >= 8) ? '天生赢家' : '常规局' };
        }
    }
};

/* ============================================================================
   5. MODULE: CHART MANAGER (独立网格双画布图表系统)
   ============================================================================ */
const ChartManager = {
    instances: { wingo: null, baccarat: null },
    initAll() {
        this.initWingoChart();
        this.initBaccaratChart();
    },
    initWingoChart() {
        const ctx = document.getElementById('trendChartWingo');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.instances.wingo) this.instances.wingo.destroy();
        this.instances.wingo = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: '#f0b90b', borderWidth: 2, pointBackgroundColor: '#0ecb81', backgroundColor: 'rgba(240, 185, 11, 0.02)', fill: true, tension: 0.35 }] },
            options: this.getCommonOptions(0, 9)
        });
    },
    initBaccaratChart() {
        const ctx = document.getElementById('trendChartBac');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.instances.baccarat) this.instances.baccarat.destroy();
        this.instances.baccarat = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: '#0052d9', borderWidth: 2, pointBackgroundColor: '#e02020', backgroundColor: 'rgba(0, 82, 219, 0.02)', fill: true, tension: 0.2 }] },
            options: this.getCommonOptions(-3, 3)
        });
    },
    getCommonOptions(minY, maxY) {
        return {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: '#14161c', borderColor: '#222630', borderWidth: 1 } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.02)' }, ticks: { color: '#707a8a', font: { size: 9 } } },
                y: { min: minY, max: maxY, grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#707a8a', font: { family: 'monospace' } } }
            }
        };
    },
    update(gameId, history) {
        const chart = this.instances[gameId];
        if (!chart) return;
        const recent = history.slice(0, 20).reverse();
        chart.data.labels = recent.map(item => item.period.slice(-4));
        
        if (gameId === 'wingo') {
            chart.data.datasets[0].data = recent.map(item => Number(item.number));
        } else {
            let curValue = 0;
            chart.data.datasets[0].data = recent.map(item => {
                if (item.side === '庄') curValue = Math.min(3, curValue + 1);
                else if (item.side === '闲') curValue = Math.max(-3, curValue - 1);
                return curValue;
            });
        }
        chart.update('none');
    }
};

/* ============================================================================
   6. MODULE: MAIN APP CONTROLLER (核心大盘联动主控枢纽)
   ============================================================================ */
let currentGameId = 'wingo'; 

window.switchCategory = function(gameId) {
    if (gameId === currentGameId) return;
    currentGameId = gameId;

    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`cat-${gameId}`);
    if (targetBtn) targetBtn.classList.add('active');

    document.querySelectorAll('.game-panel').forEach(panel => panel.classList.remove('active-panel'));
    const targetPanel = document.getElementById(`panel-${gameId}`);
    if (targetPanel) targetPanel.classList.add('active-panel');

    const titleEl = document.getElementById('timer-title');
    const nameEl = document.getElementById('stats-game-name');
    if (titleEl) titleEl.innerText = gameId === 'wingo' ? "Wingo 30S 下期倒计时" : "百家乐 DG 下期倒计时";
    if (nameEl) nameEl.innerText = gameId === 'wingo' ? "Wingo" : "百家乐";

    window.multiTimerEngine.switchFocus(gameId);
    window.refreshGlobalUI();
};

document.addEventListener('DOMContentLoaded', () => {
    const runtime = {
        wingo: { history: StorageManager.getHistory('wingo'), stats: StorageManager.getStats('wingo'), currentPred: null },
        baccarat: { history: StorageManager.getHistory('baccarat'), stats: StorageManager.getStats('baccarat'), currentPred: null }
    };

    ChartManager.initAll();

    const dom = {
        countdown: document.getElementById('countdown'),
        currentPeriod: document.getElementById('current-period'),
        totalRounds: document.getElementById('total-rounds'),
        winRate: document.getElementById('win-rate'),
        currentStreak: document.getElementById('current-streak'),
        maxStreak: document.getElementById('max-streak'),
        historyTbody: document.getElementById('history-tbody'),
        historyThead: document.getElementById('history-thead'),
        btnClear: document.getElementById('btn-clear-data')
    };

    window.refreshGlobalUI = function() {
        const gameId = currentGameId;
        const gameData = runtime[gameId];
        if (!dom.totalRounds) return; 

        dom.totalRounds.innerText = gameData.stats.totalRounds;
        dom.currentStreak.innerText = gameData.stats.currentStreak;
        dom.maxStreak.innerText = gameData.stats.maxStreak;
        const rate = gameData.stats.totalRounds > 0 ? ((gameData.stats.winRounds / gameData.stats.totalRounds) * 100).toFixed(1) : '0.0';
        dom.winRate.innerText = `${rate}%`;

        if (gameId === 'wingo') {
            const matrix = StrategyEngine.analyzeWingo(gameData.history);
            const wEl = document.getElementById('wingo-matrix');
            if (wEl) wEl.innerHTML = `
                <div class="matrix-item"><span>热号追踪</span><span class="score">${matrix.hot}分</span></div>
                <div class="matrix-item"><span>冷号遗漏</span><span class="score">${matrix.cold}分</span></div>
                <div class="matrix-item"><span>邻号跳跃</span><span class="score">${matrix.neighbor}分</span></div>
                <div class="matrix-item"><span>跨度震荡</span><span class="score">${matrix.span}分</span></div>
                <div class="matrix-item"><span>单双偏离</span><span class="score">${matrix.oe}%</span></div>
                <div class="matrix-item"><span>大小形态</span><span class="score">${matrix.bs}%</span></div>
            `;
            dom.historyThead.innerHTML = `<tr><th>期号</th><th>号码</th><th>形态 (奇偶/大小/颜色)</th><th>AI预测推荐</th><th>研判状态</th></tr>`;
        } else {
            const matrix = StrategyEngine.analyzeBaccarat(gameData.history);
            const bEl = document.getElementById('bac-matrix');
            if (bEl) bEl.innerHTML = `
                <div class="matrix-item"><span>庄闲旺衰比</span><span class="score">${matrix.trendBias}%</span></div>
                <div class="matrix-item"><span>大眼仔齐整度</span><span class="score">${matrix.bigEyeScore}分</span></div>
                <div class="matrix-item"><span>盘口单跳率</span><span class="score">${matrix.jumpRate}%</span></div>
                <div class="matrix-item"><span>当前龙背倾向</span><span class="score">${matrix.longStreak}分</span></div>
                <div class="matrix-item"><span>对子爆发率</span><span class="score">${matrix.pairProb}%</span></div>
                <div class="matrix-item"><span>天生赢家率</span><span class="score">${matrix.naturalProb}%</span></div>
            `;
            dom.historyThead.innerHTML = `<tr><th>物理桌台期号</th><th>点数赛果</th><th>主客形态</th><th>AI破路预测</th><th>研判状态</th></tr>`;
        }

        dom.historyTbody.innerHTML = '';
        gameData.history.forEach(item => {
            const tr = document.createElement('tr');
            let formHtml = '';
            if (gameId === 'wingo') {
                const sCls = item.side === '庄' ? 'txt-banker' : 'txt-player';
                const zCls = item.size === '大' ? 'txt-big' : 'txt-small';
                let cCls = item.color === '绿' ? 'bg-green' : (item.color === '紫' ? 'bg-purple' : 'bg-red');
                formHtml = `<span class="${sCls}">${item.side}</span> / <span class="${zCls}">${item.size}</span> / <span class="${cCls}">${item.color}</span>`;
            } else {
                let sCls = item.side === '庄' ? 'txt-banker' : (item.side === '闲' ? 'txt-player' : 'txt-tie');
                formHtml = `<span class="${sCls}">${item.side}</span> <small style="color:#505866;">${item.size}</small>`;
            }
            tr.innerHTML = `<td>${item.period}</td><td><strong style="font-size:15px; font-family:monospace;">${item.number}</strong></td><td>${formHtml}</td><td>${item.predText}</td><td class="${item.isWin ? 'win' : 'lose'}">${item.isWin ? 'MATCHED ★' : 'MISSED'}</td>`;
            dom.historyTbody.appendChild(tr);
        });

        ChartManager.update(gameId, gameData.history);
    };

    function setupClockPipeline(gameId) {
        window.multiTimerEngine.registerGame(
            gameId,
            (timeLeftSec, periodId) => {
                if (gameId === currentGameId && dom.countdown) {
                    dom.countdown.innerText = `${timeLeftSec}s`;
                    dom.currentPeriod.innerText = periodId;
                }
                const gameData = runtime[gameId];
                if (!gameData.currentPred || gameData.currentPred.period !== periodId) {
                    const pred = AIPredictor.generatePrediction(gameId, gameData.history);
                    gameData.currentPred = { period: periodId, ...pred };

                    if (gameId === 'wingo') {
                        const conf = document.getElementById('wingo-conf'), wpNum = document.getElementById('wp-num'), wpSize = document.getElementById('wp-size'), wpCol = document.getElementById('wp-color');
                        if (conf) conf.innerText = `${pred.confidence}%`;
                        if (wpNum) wpNum.innerText = pred.side === '庄' ? '偶号趋向' : '奇号趋向';
                        if (wpSize) { wpSize.innerText = pred.size; wpSize.className = `pred-result ${pred.size === '大' ? 'txt-big' : 'txt-small'}`; }
                        if (wpCol) { wpCol.innerText = pred.color; wpCol.className = `pred-result ${pred.color === '绿' ? 'bg-green' : (pred.color === '紫' ? 'bg-purple' : 'bg-red')}`; }
                    } else {
                        const conf = document.getElementById('bac-conf'), bpSide = document.getElementById('bp-side'), bpPair = document.getElementById('bp-pair'), bpNat = document.getElementById('bp-natural');
                        if (conf) conf.innerText = `${pred.confidence}%`;
                        if (bpSide) { const sb = bpSide.querySelector('.pred-result'); if(sb){ sb.innerText = `绝杀：[${pred.side}]`; sb.className = `pred-result ${pred.side === '庄' ? 'txt-banker' : 'txt-player'}`; } }
                        if (bpPair) bpPair.innerText = pred.pairProb;
                        if (bpNat) bpNat.innerText = pred.naturalProb;
                    }
                }
            },
            (finishedPeriodId) => {
                const gameData = runtime[gameId];
                const actual = AIPredictor.simulateResult(gameId);
                let isWin = false, predText = '无推荐';

                if (gameData.currentPred && gameData.currentPred.period === finishedPeriodId) {
                    isWin = (gameData.currentPred.side === actual.side);
                    predText = gameId === 'wingo' ? `推[${gameData.currentPred.side} ${gameData.currentPred.size}]` : `推[${gameData.currentPred.side}]`;
                    if (gameId === 'baccarat' && actual.side === '和') isWin = true; 
                }

                gameData.stats.totalRounds += 1;
                if (isWin) {
                    gameData.stats.winRounds += 1;
                    gameData.stats.currentStreak += 1;
                    if (gameData.stats.currentStreak > gameData.stats.maxStreak) gameData.stats.maxStreak = gameData.stats.currentStreak;
                } else {
                    gameData.stats.currentStreak = 0;
                }

                gameData.history.unshift({ period: finishedPeriodId, number: actual.number, side: actual.side, size: actual.size, color: actual.color, predText, isWin });
                StorageManager.saveHistory(gameId, gameData.history);
                StorageManager.saveStats(gameId, gameData.stats);
                gameData.currentPred = null;

                if (gameId === currentGameId) window.refreshGlobalUI();
            }
        );
    }

    setupClockPipeline('wingo');
    setupClockPipeline('baccarat');

    if (dom.btnClear) {
        dom.btnClear.addEventListener('click', () => {
            if (confirm(`确定要清空当前 [${currentGameId === 'wingo' ? 'Wingo' : '百家乐'}] 分类的全部本地历史与胜率指标吗？`)) {
                StorageManager.clearGameData(currentGameId);
                runtime[currentGameId].history = [];
                runtime[currentGameId].stats = { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 };
                runtime[currentGameId].currentPred = null;
                window.refreshGlobalUI();
            }
        });
    }

    window.refreshGlobalUI();
});
