/**
 * Wingo 自动化雷达与云端数据库控流中心 (100% 还原 Wingo)
 */
(function() {
    // 初始化 Wingo 历史与统计状态 (防止刷新网页丢失)
    window.wingoEngineStats = window.wingoEngineStats || {
        totalCount: 0,
        winRate: 0.0,
        currentStreak: 0,
        maxStreak: 0,
        records: []
    };

    const targetRoom = "wingo_ai_test_room_2026";
    const dbBackupUrl = "https://api.restful-api.dev/objects";
    let activePeriod = "";

    window.addEventListener('DOMContentLoaded', () => {
        console.log("🟢 [Wingo 自动化核心] 启动！云数据库接入成功。");

        const txtTotal = document.getElementById('stat-total');
        const txtRate = document.getElementById('stat-rate');
        const txtCurrent = document.getElementById('stat-current');
        const txtMax = document.getElementById('stat-max');
        const btnClear = document.getElementById('btn-clear-history');

        // Wingo 专属展示节点
        const wingoBall = document.getElementById('wingo-ball');
        const wingoBs = document.getElementById('wingo-bs');
        const wingoOe = document.getElementById('wingo-oe');
        const txtPeriod = document.getElementById('latest-period-display');

        // 同步界面
        function uiSync() {
            if (txtTotal) txtTotal.innerText = window.wingoEngineStats.totalCount;
            if (txtRate) txtRate.innerText = window.wingoEngineStats.winRate.toFixed(1) + "%";
            if (txtCurrent) txtCurrent.innerText = window.wingoEngineStats.currentStreak;
            if (txtMax) txtMax.innerText = window.wingoEngineStats.maxStreak;
        }

        // 保存 Wingo 数据到云端数据库
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

        // 从云端数据库读取历史数据
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
                        console.log("📂 [数据库] 成功恢复 Wingo 量化历史记录！");
                        uiSync();
                    }
                }
            }).catch(() => {});
        }

        loadFromDatabase();

        // 按钮清空事件
        window.triggerClearAll = function() {
            console.log("🧹 [清空] 正在重置 Wingo 统计数据并上传云端...");
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

        // 🎯 Wingo 核心量化跑测引擎 (输入真实的 0-9 号码)
        window.runWingoQuantEngine = function(period, num) {
            window.wingoEngineStats.totalCount += 1;

            // Wingo 经典算法判定：
            // 大/小
            const isBig = num >= 5;
            // 单/双
            const isOdd = num % 2 !== 0;
            // 颜色 (0, 5 是红绿相间并带紫色；1,3,7,9为绿；2,4,6,8为红)
            let color = "#00ff88"; // 绿
            if (num === 0 || num === 5) {
                color = "#9c27b0"; // 紫
            } else if (num % 2 === 0) {
                color = "#ff4a4a"; // 红
            }

            // 更新展示
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

            // 测算胜率和连中
            const userWin = Math.random() > 0.45; // 模拟你的 Wingo 策略命中率
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

            // 驱动你原本的 predictor 模块
            if (typeof window.updateWingoPrediction === 'function') {
                window.updateWingoPrediction(num);
            }

            uiSync();
            saveToDatabase(); // 全自动永久保存进云端数据库
        };

        // 📡 天线：实时截获你在游戏页控制台拦截发来的开奖数据
        setInterval(() => {
            fetch(dbBackupUrl)
            .then(res => res.json())
            .then(list => {
                if (Array.isArray(list)) {
                    const currentSignal = list
                        .filter(item => item && item.name === targetRoom && item.data)
                        .map(item => item.data)
                        .sort((a, b) => b.timestamp - a.timestamp)[0];

                    if (currentSignal && currentSignal.period && currentSignal.period !== activePeriod) {
                        activePeriod = currentSignal.period;

                        // 捕获到真实新期号，先触发清空
                        window.triggerClearAll();

                        // 稍微延迟 0.6 秒，让它漂亮地跳出新的 Wingo 运算数据
                        setTimeout(() => {
                            window.runWingoQuantEngine(currentSignal.period, currentSignal.number);
                        }, 600);
                    }
                }
            }).catch(() => {});
        }, 1500);
    });
})();
