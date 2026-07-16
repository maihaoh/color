/**
 * Wingo 本地秒级响应 + 云数据库备份中枢
 */
(function() {
    window.wingoEngineStats = window.wingoEngineStats || {
        totalCount: 0,
        winRate: 0.0,
        currentStreak: 0,
        maxStreak: 0,
        records: []
    };

    const dbBackupUrl = "https://api.restful-api.dev/objects";
    let activePeriod = "";

    window.addEventListener('DOMContentLoaded', () => {
        console.log("🟢 [Wingo 接收端已就绪] 本地 Broadcast 桥梁已连通...");

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

        // 云端数据库存储备份
        function saveToDatabase() {
            const dataPacket = {
                name: "secure_wingo_db_backup_2026",
                data: {
                    payload: window.wingoEngineStats,
                    savedAt: Date.now()
                }
            };
            fetch(dbBackupUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPacket)
            }).catch(() => {});
        }

        // 恢复历史数据
        function loadFromDatabase() {
            fetch(dbBackupUrl)
            .then(res => res.json())
            .then(list => {
                if (Array.isArray(list)) {
                    const latestRecord = list
                        .filter(item => item && item.name === "secure_wingo_db_backup_2026" && item.data)
                        .map(item => item.data)
                        .sort((a, b) => b.savedAt - a.savedAt)[0];
                    
                    if (latestRecord && latestRecord.payload) {
                        window.wingoEngineStats = latestRecord.payload;
                        console.log("📂 [数据库恢复] Wingo 量化历史指标已还原。");
                        uiSync();
                    }
                }
            }).catch(() => {});
        }

        loadFromDatabase();

        window.triggerClearAll = function() {
            window.wingoEngineStats.totalCount = 0;
            window.wingoEngineStats.winRate = 0.0;
            window.wingoEngineStats.currentStreak = 0;
            window.wingoEngineStats.maxStreak = 0;
            window.wingoEngineStats.records = [];
            uiSync();
            saveToDatabase();
        };

        if (btnClear) {
            btnClear.addEventListener('click', window.triggerClearAll);
        }

        // 核心测算逻辑
        window.runWingoQuantEngine = function(period, num) {
            window.wingoEngineStats.totalCount += 1;

            const isBig = num >= 5;
            const isOdd = num % 2 !== 0;
            let color = "#00ff88"; // 绿
            if (num === 0 || num === 5) {
                color = "#9c27b0"; // 紫
            } else if (num % 2 === 0) {
                color = "#ff4a4a"; // 红
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
            saveToDatabase(); // 全自动保存到数据库
        };

        // 🎯 核心秘密武器：利用本地广播，实现毫秒级捕获响应，无需等待网络延时
        const channel = new BroadcastChannel('wingo_realtime_bridge');
        channel.onmessage = function(event) {
            if (event.data && event.data.type === 'OFFICIAL_OPEN_RESULT') {
                const receivedPeriod = event.data.period;
                const receivedNumber = event.data.number;

                if (receivedPeriod !== activePeriod) {
                    activePeriod = receivedPeriod;
                    console.log(`🎯 [本地广播桥捕获] 接收到期号: ${receivedPeriod}，号码: ${receivedNumber}`);
                    
                    // 1. 触发清空
                    window.triggerClearAll();

                    // 2. 毫秒级直接计算并展示
                    setTimeout(() => {
                        window.runWingoQuantEngine(receivedPeriod, receivedNumber);
                    }, 50);
                }
            }
        };
    });
})();
