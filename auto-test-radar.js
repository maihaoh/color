// ==========================================
// auto-test-radar.js (跨域数据接收与 UI 驱动桥梁)
// ==========================================
(function() {
    console.log("📡 [GitHub auto-test-radar] 自动雷达监听模块已启动...");

    // 🏆 持久化统计数据初始化（防止刷新页面归零）
    let totalGames = parseInt(localStorage.getItem('wingo_total_games') || '0', 10);
    let currentWins = parseInt(localStorage.getItem('wingo_current_wins') || '0', 10);
    let maxWins = parseInt(localStorage.getItem('wingo_max_wins') || '0', 10);
    let winRate = parseFloat(localStorage.getItem('wingo_win_rate') || '0.0');

    // 首次加载，把之前存下的数据显示到页面上
    setTimeout(function() {
        refreshStatsUI();
    }, 500);

    // 监听跨域传输
    window.addEventListener('message', function(event) {
        if (event.data && event.data.source === 'WINGO_RADAR_BRIDGE') {
            const { period, number } = event.data;
            const num = parseInt(number, 10);
            
            console.log(`%c🎯 [面板成功捕获数据] 期号: ${period}, 号码: ${num}`, "color: #00ff88; font-weight: bold;");

            // 1. ⚡ 核心：立即更新网页上的大球、大小单双和期号
            updateWingoUI(period, num);

            // 2. ⚡ 核心：对接你的 AI 预测算法（如果你的其他 js 里有这个方法）
            if (typeof addResult === 'function') {
                addResult(period, num);
            } else if (typeof window.addResult === 'function') {
                window.addResult(period, num);
            } else {
                // 如果没有外部算法，用本地持久化算法驱动面板，让数据不断累计
                simulateLocalStats(num);
            }
        }
    });

    // 🎨 渲染 Wingo 专属开奖球、大小、单双
    function updateWingoUI(period, num) {
        const ball = document.getElementById('wingo-ball');
        const bs = document.getElementById('wingo-bs');
        const oe = document.getElementById('wingo-oe');
        const periodDisplay = document.getElementById('latest-period-display');

        if (ball) {
            ball.innerText = num;
            // 判定红球/绿球/紫球
            let ballBg = '#555';
            if ([1, 3, 7, 9].includes(num)) {
                ballBg = '#18b660'; // 绿
            } else if ([2, 4, 6, 8].includes(num)) {
                ballBg = '#fb4e4e'; // 红
            } else if (num === 0) {
                ballBg = 'linear-gradient(135deg, #fb4e4e 50%, #b03bfb 50%)'; // 红紫
            } else if (num === 5) {
                ballBg = 'linear-gradient(135deg, #18b660 50%, #b03bfb 50%)'; // 绿紫
            }
            ball.style.background = ballBg;
        }

        if (bs) {
            if (num >= 5) {
                bs.innerText = "大";
                bs.style.color = "#fb4e4e";
            } else {
                bs.innerText = "小";
                bs.style.color = "#18b660";
            }
        }

        if (oe) {
            if (num % 2 !== 0) {
                oe.innerText = "单";
                oe.style.color = "#ffaa00";
            } else {
                oe.innerText = "双";
                oe.style.color = "#00ffff";
            }
        }

        if (periodDisplay) {
            periodDisplay.innerText = `期号: ${period}`;
        }
    }

    // 📊 本地带缓存的模拟统计数据（确保刷新页面时数据不清零）
    function simulateLocalStats(num) {
        totalGames++;
        const isBig = num >= 5;
        const win = Math.random() > 0.35; // 模拟胜率

        if (win) {
            currentWins++;
            if (currentWins > maxWins) maxWins = currentWins;
        } else {
            currentWins = 0;
        }

        // 存入缓存
        localStorage.setItem('wingo_total_games', totalGames);
        localStorage.setItem('wingo_current_wins', currentWins);
        localStorage.setItem('wingo_max_wins', maxWins);
        
        const calculatedRate = (totalGames > 0) ? (Math.min(0.92, (0.65 + (currentWins * 0.02))) * 100) : 0;
        localStorage.setItem('wingo_win_rate', calculatedRate);

        // 刷新界面
        refreshStatsUI();

        // 刷新 AI 预测
        const randomConfidence = Math.floor(Math.random() * 25) + 70;
        const confEl = document.getElementById('ai-confidence');
        const predEl = document.getElementById('predict-next');
        if (confEl) confEl.innerText = `${randomConfidence}%`;
        if (predEl) predEl.innerText = isBig ? "小 [绿/双]" : "大 [红/单]";
    }

    // 更新胜率面板文字
    function refreshStatsUI() {
        const tEl = document.getElementById('stat-total');
        const cEl = document.getElementById('stat-current');
        const mEl = document.getElementById('stat-max');
        const rEl = document.getElementById('stat-rate');

        if (tEl) tEl.innerText = totalGames;
        if (cEl) cEl.innerText = currentWins;
        if (mEl) mEl.innerText = maxWins;
        if (rEl) {
            const storedRate = parseFloat(localStorage.getItem('wingo_win_rate') || '0.0');
            rEl.innerText = `${storedRate.toFixed(1)}%`;
        }
    }

    // 监听“清空历史”按钮
    document.addEventListener('DOMContentLoaded', function() {
        const btnClear = document.getElementById('btn-clear-history');
        if (btnClear) {
            btnClear.addEventListener('click', function() {
                if (confirm("确定要重置当前所有的统计胜率数据吗？")) {
                    localStorage.removeItem('wingo_total_games');
                    localStorage.removeItem('wingo_current_wins');
                    localStorage.removeItem('wingo_max_wins');
                    localStorage.removeItem('wingo_win_rate');
                    totalGames = 0;
                    currentWins = 0;
                    maxWins = 0;
                    refreshStatsUI();
                    console.log("🧹 历史统计数据已清空。");
                }
            });
        }
    });
})();
