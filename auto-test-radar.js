/**
 * Wingo 分析面板控制中心 (跨域直连+量化跑测+本地存储三合一合并版)
 */
(function() {
    // 1. 初始化或从浏览器持久化缓存中加载历史数据
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
        console.log("🟢 [Wingo 面板中心] 合并版引擎已启动。监听跨域穿透中...");

        // 获取页面 UI DOM 节点
        const txtTotal = document.getElementById('stat-total');
        const txtRate = document.getElementById('stat-rate');
        const txtCurrent = document.getElementById('stat-current');
        const txtMax = document.getElementById('stat-max');
        const btnClear = document.getElementById('btn-clear-history');

        const wingoBall = document.getElementById('wingo-ball');
        const wingoBs = document.getElementById('wingo-bs');
        const wingoOe = document.getElementById('wingo-oe');
        const txtPeriod = document.getElementById('latest-period-display');

        // UI 渲染同步
        function uiSync() {
            if (txtTotal) txtTotal.innerText = window.wingoEngineStats.totalCount;
            if (txtRate) txtRate.innerText = window.wingoEngineStats.winRate.toFixed(1) + "%";
            if (txtCurrent) txtCurrent.innerText = window.wingoEngineStats.currentStreak;
            if (txtMax) txtMax.innerText = window.wingoEngineStats.maxStreak;
        }

        // 写入本地持久化存储
        function saveToLocalDatabase() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(window.wingoEngineStats));
        }

        // 初始化显示
        uiSync();

        // 绑定手动/自动清空事件
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

        // 🎯 Wingo 核心算法跑测引擎 (输入 0-9 号码，自动转换为 Wingo 红绿大小)
        window.runWingoQuantEngine = function(period, num) {
            window.wingoEngineStats.totalCount += 1;

            // Wingo 规则：大(5-9)小(0-4)
            const isBig = num >= 5;
            // Wingo 规则：单双
            const isOdd = num % 2 !== 0;
            // Wingo 规则：颜色
            let color = "#00ff88"; // 绿
            if (num === 0 || num === 5) {
                color = "#9c27b0"; // 紫色（0和5红绿相间并带紫）
            } else if (num % 2 === 0) {
                color = "#ff4a4a"; // 双数红
            }

            // 同步更新 Wingo 展示圆球
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

            // 计算 Wingo 虚拟连中及胜率
            const userWin = Math.random() > 0.45; // 实际可在此处替换为你真实的 AI 预测碰撞逻辑
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
            saveToLocalDatabase(); // 实时持久化保存
        };

        // ⚡️ 接收消息事件处理器
        function handleIncomingResult(receivedPeriod, receivedNumber) {
            if (receivedPeriod !== activePeriod) {
                activePeriod = receivedPeriod;
                console.log(`🎯 [面板成功捕获数据] 期号: ${receivedPeriod}，号码: ${receivedNumber}`);
                
                // 1. 先重置上一期
                window.triggerClearAll();

                // 2. 毫秒级直接计算并展示新数据
                setTimeout(() => {
                    window.runWingoQuantEngine(receivedPeriod, receivedNumber);
                }, 50);
            }
        }

        // 🔗 监听器：实时接收从隐藏 iframe（游戏页面）穿透投递过来的跨域数据
        window.addEventListener('message', function(event) {
            if (event.data && event.data.source === 'WINGO_RADAR_BRIDGE') {
                handleIncomingResult(event.data.period, event.data.number);
            }
        });
    });
})();
