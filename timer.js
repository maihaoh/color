/**
 * AI Multi-Predictor V3.5 - 双游戏独立并发时钟引擎
 * 核心逻辑：Wingo基于物理时间秒级对齐，百家乐基于独立模拟桌台，切后台自动补帧。
 */
class MultiTimerEngine {
    constructor() {
        this.activeGame = 'wingo'; // 当前前台显示的游戏
        this.games = {
            wingo: {
                duration: 30000, // 30秒
                timerId: null,
                onTick: null,
                onOpen: null,
                lastPeriodId: ''
            },
            baccarat: {
                duration: 40000, // 百家乐模拟一局40秒（包含发牌看牌）
                timerId: null,
                onTick: null,
                onOpen: null,
                lastPeriodId: ''
            }
        };

        this.initVisibilityListener();
    }

    /**
     * 注册并启动某个游戏的时钟驱动
     */
    registerGame(gameId, onTick, onOpen) {
        if (!this.games[gameId]) return;
        this.games[gameId].onTick = onTick;
        this.games[gameId].onOpen = onOpen;
        
        this.startClock(gameId);
    }

    /**
     * 切换当前前台渲染聚焦的游戏
     */
    switchFocus(gameId) {
        if (!this.games[gameId]) return;
        this.activeGame = gameId;
        // 切换时立刻触发一次当前游戏的时钟刷新
        this.triggerImmediateTick(gameId);
    }

    /**
     * 核心驱动：针对不同游戏采用不同的时间轴算法
     */
    startClock(gameId) {
        const game = this.games[gameId];
        if (game.timerId) clearInterval(game.timerId);

        const run = () => {
            const now = Date.now();
            let timeLeftSec = 0;
            let periodId = '';

            if (gameId === 'wingo') {
                // Wingo 模式：Mzplay 绝对时间戳对齐算法
                const currentPeriodStart = Math.floor(now / game.duration) * game.duration;
                const timePassed = now - currentPeriodStart;
                timeLeftSec = ((game.duration - timePassed) / 1000).toFixed(1);
                periodId = this.generateWingoPeriod(now);
            } else {
                // 百家乐模式：DG 模拟独立桌台轮询算法
                // 用一个固定的虚拟基准点来计算当前靴次和铺数
                const baseBacTime = 1767225600000; // 固定的时间锚点
                const elapsed = now - baseBacTime;
                const roundIndex = Math.floor(elapsed / game.duration);
                const timePassed = elapsed % game.duration;
                timeLeftSec = ((game.duration - timePassed) / 1000).toFixed(1);
                periodId = this.generateBaccaratPeriod(roundIndex);
            }

            // 只有当该游戏是当前前台激活的游戏时，才向渲染主界面发送 UI 更新通知
            if (this.activeGame === gameId && game.onTick) {
                game.onTick(timeLeftSec, periodId);
            }

            // 临界点开奖判定 (剩余时间小于 0.15 秒且未开过奖)
            if (parseFloat(timeLeftSec) <= 0.15 && game.lastPeriodId !== periodId) {
                game.lastPeriodId = periodId;
                
                // 异步延时开奖，确保跨入新一期
                setTimeout(() => {
                    if (game.onOpen) game.onOpen(periodId);
                }, 200);
            }
        };

        game.timerId = setInterval(run, 100);
        run();
    }

    /**
     * 触发即时渲染（防切换卡顿）
     */
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

    /**
     * Wingo 期号生成器 (年月日 + 当天累计期数)
     */
    generateWingoPeriod(timestamp) {
        const date = new Date(timestamp);
        const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const index = Math.floor((timestamp - startOfDay) / 30000) + 1;
        return `${ymd}${String(index).padStart(4, '0')}`;
    }

    /**
     * 百家乐期号生成器 (DG规则：模拟台号 + 虚拟靴号 + 铺号)
     * 格式：DG-A01桌-第XX靴-第XX铺
     */
    generateBaccaratPeriod(roundIndex) {
        const shoeSize = 60; // 每靴牌大约 60 铺
        const shoeNum = Math.floor(roundIndex / shoeSize) % 99 + 1;
        const roundNum = (roundIndex % shoeSize) + 1;
        return `DG-A01-${String(shoeNum).padStart(2, '0')}靴-${String(roundNum).padStart(2, '0')}铺`;
    }

    /**
     * 标签页切回前台事件监听
     */
    initVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // 两套时钟同时强制重新拉起，追齐时间帧
                this.startClock('wingo');
                this.startClock('baccarat');
                const statusEl = document.getElementById('sync-status');
                if (statusEl) statusEl.innerText = "多路时钟已完成毫秒级校准";
            }
        });
    }
}

// 注册全局单例
window.multiTimerEngine = new MultiTimerEngine();
