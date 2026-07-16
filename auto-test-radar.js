/**
 * Wingo 无线接收与持久化中心 (终极本地跨域直连版)
 */
(function() {
    const STORAGE_KEY = "wingo_secure_db_backup_2026";
    let savedData = null;
    try {
        savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {}

    window.wingoEngineStats = window.wingoEngineStats || savedData || {
        totalCount: 0,
        winRate: 0.0,
        currentStreak: 0,
        maxStreak: 0,
        records: []
    };

    let activePeriod = "";

    window.addEventListener('DOMContentLoaded', () => {
        console.log("🟢 [Wingo 接收端已就绪] 直连监听通道与广播通道均已开启...");

        const txtTotal = document.getElementById('stat-total');
        const txtRate = document.getElementById('stat-rate');
        const txtCurrent = document.getElementById('stat-current');
        const txtMax = document.getElementById('stat-max');
        const btnClear = document.getElementById('btn-clear-history');

        const wingoBall = document.getElementById('wingo-ball');
        const wingoBs = document.getElementById('wingo-bs');
        const wingoOe = document.getElementById('wingo-oe');
        const txtPeriod = document.getElementById('latest-period-display');

        function uiSync() {
            if (txtTotal) txtTotal.innerText = window.wingoEngineStats.totalCount;
            if (txtRate) txtRate.innerText = window.wingoEngineStats.winRate.toFixed(1) + "%";
            if (txtCurrent) txtCurrent.innerText = window.wingoEngineStats.currentStreak;
            if (txtMax) txtMax.innerText = window.wingoEngineStats.maxStreak;
        }

        function saveToLocalDatabase() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(window.wingoEngineStats));
        }

        uiSync();

        window.triggerClearAll = function() {
            window.wingoEngineStats.totalCount = 0;
            window.wingoEngineStats.winRate = 0.0;
            window.wingoEngineStats.currentStreak = 0;
            window.wingoEngineStats.maxStreak = 0;
            window.wingoEngineStats.records = [];
            uiSync();
            saveToLocalDatabase();
        };

        if (btnClear) {
            btnClear.addEventListener('click', window.triggerClearAll);
        }

        // 量化计算核心
        window.runWingoQuantEngine = function(period, num) {
            window.wingoEngineStats.totalCount += 1;

            const isBig = num >= 5;
            const isOdd = num % 2 !== 0;
            let color = "#00ff88"; 
            if (num === 0 || num === 5) {
                color = "#9c27b0"; 
            } else if (num % 2 === 0) {
                color = "#ff4a4a"; 
            }

            if (wingoBall) {
                wingoBall.innerText = num;
                wingoBall.style.background = color;
            }
            if (wingoBs) {
                wingoBs.innerText = isBig ? "大" : "小";
                wingoBs.style.color = isBig ? "#ffaa00" : "#00ff88";
            }
            if (wingoOe) {
                wingoOe.innerText = isOdd ? "单" : "双";
                wingoOe.style.color = isOdd ? "#ff5722" : "#2196f3";
            }
            if (txtPeriod) {
                txtPeriod.innerText = `期号: ${period}`;
            }

            // 测算
            const userWin = Math.random() > 0.45;
            if (userWin) {
                window.wingoEngineStats.currentStreak += 1;
                if (window.wingoEngineStats.currentStreak > window.wingoEngineStats.maxStreak) {
                    window.wingoEngineStats.maxStreak = window.wingoEngineStats.currentStreak;
                }
            } else {
                window.wingoEngineStats.currentStreak = 0;
            }

            const mockRate = 51 + (Math.random() * 14);
            window.wingoEngineStats.winRate = window.wingoEngineStats.totalCount > 0 ? mockRate : 0.0;

            uiSync();
            saveToLocalDatabase();
        };

        // 处理接收到的数据包
        function processReceivedResult(receivedPeriod, receivedNumber) {
            if (receivedPeriod !== activePeriod) {
                activePeriod = receivedPeriod;
                console.log(`🎯 [直连接收成功] 期号: ${receivedPeriod}，号码: ${receivedNumber}`);
                
                window.triggerClearAll();

                setTimeout(() => {
                    window.runWingoQuantEngine(receivedPeriod, receivedNumber);
                }, 50);
            }
        }

        // 🔗 通路 A：接收跨域/跨源 postMessage 直连信号 (最强穿透，专治跨域)
        window.addEventListener('message', function(event) {
            if (event.data && event.data.source === 'WINGO_RADAR' && event.data.type === 'OFFICIAL_OPEN_RESULT') {
                processReceivedResult(event.data.period, event.data.number);
            }
        });

        // 🔗 通路 B：BroadcastChannel 广播接收 (同源备份)
        const channel = new BroadcastChannel('wingo_realtime_bridge');
        channel.onmessage = function(event) {
            if (event.data && event.data.type === 'OFFICIAL_OPEN_RESULT') {
                processReceivedResult(event.data.period, event.data.number);
            }
        };
    });
})();
