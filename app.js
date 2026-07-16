/**
 * AI Multi-Predictor V3.5 - 业务模块分发调度总枢纽
 * 负责分类页面无缝切换切换、双端AI预测联动以及数据映射渲染
 */
let currentGameId = 'wingo'; // 全局变量，记录当前前台游戏

// 全局分类切换函数（暴露给 HTML 按钮 onClick 事件）
window.switchCategory = function(gameId) {
    if (gameId === currentGameId) return;
    currentGameId = gameId;

    // 1. 切换侧边栏按钮的激活样式
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`cat-${gameId}`).classList.add('active');

    // 2. 切换主游戏面板的可见性
    document.querySelectorAll('.game-panel').forEach(panel => panel.classList.remove('active-panel'));
    document.getElementById(`panel-${gameId}`).classList.add('active-panel');

    // 3. 同步修改倒计时标题与统计标头
    const titleEl = document.getElementById('timer-title');
    const nameEl = document.getElementById('stats-game-name');
    if (gameId === 'wingo') {
        titleEl.innerText = "Wingo 30S 下期倒计时";
        nameEl.innerText = "Wingo";
    } else {
        titleEl.innerText = "百家乐 DG 下期倒计时";
        nameEl.innerText = "百家乐";
    }

    // 4. 通知时钟引擎切换前台渲染焦点
    window.multiTimerEngine.switchFocus(gameId);

    // 5. 刷新大盘UI
    window.refreshGlobalUI();
};

document.addEventListener('DOMContentLoaded', () => {
    // 内存数据缓存区
    const runtime = {
        wingo: { history: StorageManager.getHistory('wingo'), stats: StorageManager.getStats('wingo'), currentPred: null },
        baccarat: { history: StorageManager.getHistory('baccarat'), stats: StorageManager.getStats('baccarat'), currentPred: null }
    };

    // 初始化图表实例
    ChartManager.initAll();

    // DOM 核心缓存
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

    /**
     * 全局大盘渲染器（智能自适应当前激活的游戏）
     */
    window.refreshGlobalUI = function() {
        const gameId = currentGameId;
        const gameData = runtime[gameId];

        // 1. 渲染面板左侧的基础量化统计指标
        dom.totalRounds.innerText = gameData.stats.totalRounds;
        dom.currentStreak.innerText = gameData.stats.currentStreak;
        dom.maxStreak.innerText = gameData.stats.maxStreak;
        const rate = gameData.stats.totalRounds > 0 
            ? ((gameData.stats.winRounds / gameData.stats.totalRounds) * 100).toFixed(1) 
            : '0.0';
        dom.winRate.innerText = `${rate}%`;

        // 2. 差异化渲染策略矩阵评分
        if (gameId === 'wingo') {
            const matrix = StrategyEngine.analyzeWingo(gameData.history);
            document.getElementById('wingo-matrix').innerHTML = `
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
            document.getElementById('bac-matrix').innerHTML = `
                <div class="matrix-item"><span>庄闲旺衰比</span><span class="score">${matrix.trendBias}%</span></div>
                <div class="matrix-item"><span>大眼仔齐整度</span><span class="score">${matrix.bigEyeScore}分</span></div>
                <div class="matrix-item"><span>盘口单跳率</span><span class="score">${matrix.jumpRate}%</span></div>
                <div class="matrix-item"><span>当前龙背倾向</span><span class="score">${matrix.longStreak}分</span></div>
                <div class="matrix-item"><span>对子爆发率</span><span class="score">${matrix.pairProb}%</span></div>
                <div class="matrix-item"><span>天生赢家率</span><span class="score">${matrix.naturalProb}%</span></div>
            `;
            dom.historyThead.innerHTML = `<tr><th>物理桌台期号</th><th>点数赛果</th><th>主客形态</th><th>AI破路预测</th><th>研判状态</th></tr>`;
        }

        // 3. 动态刷新底层历史流水账单
        dom.historyTbody.innerHTML = '';
        gameData.history.forEach(item => {
            const tr = document.createElement('tr');
            let formHtml = '';

            if (gameId === 'wingo') {
                const sCls = item.side === '庄' ? 'txt-banker' : 'txt-player';
                const zCls = item.size === '大' ? 'txt-big' : 'txt-small';
                let cCls = 'bg-red';
                if (item.color === '绿') cCls = 'bg-green';
                if (item.color === '紫') cCls = 'bg-purple';
                formHtml = `<span class="${sCls}">${item.side}</span> / <span class="${zCls}">${item.size}</span> / <span class="${cCls}">${item.color}</span>`;
            } else {
                let sCls = 'txt-tie';
                if (item.side === '庄') sCls = 'txt-banker';
                if (item.side === '闲') sCls = 'txt-player';
                formHtml = `<span class="${sCls}">${item.side}</span> <small style="color:#505866;">${item.size}</small>`;
            }

            tr.innerHTML = `
                <td>${item.period}</td>
                <td><strong style="font-size:15px; font-family:monospace;">${item.number}</strong></td>
                <td>${formHtml}</td>
                <td>${item.predText}</td>
                <td class="${item.isWin ? 'win' : 'lose'}">${item.isWin ? 'MATCHED ★' : 'MISSED'}</td>
            `;
            dom.historyTbody.appendChild(tr);
        });

        // 4. 通知图表模块追帧重绘
        ChartManager.update(gameId, gameData.history);
    };

    /**
     * 辅助逻辑：为某个特定的游戏配置时钟 Tick 推动与归零开奖
     */
    function setupClockPipeline(gameId) {
        window.multiTimerEngine.registerGame(
            gameId,
            // Tick 动态渲染脉搏
            (timeLeftSec, periodId) => {
                dom.countdown.innerText = `${timeLeftSec}s`;
                dom.currentPeriod.innerText = periodId;

                const gameData = runtime[gameId];
                // 如果检测到跨入新的一期，且当前该期还没有预测数据，执行实时概率前瞻
                if (!gameData.currentPred || gameData.currentPred.period !== periodId) {
                    const pred = AIPredictor.generatePrediction(gameId, gameData.history);
                    gameData.currentPred = { period: periodId, ...pred };

                    // 实时刷新顶部大卡片的 AI 看板推荐
                    if (gameId === 'wingo') {
                        document.getElementById('wingo-conf').innerText = `${pred.confidence}%`;
                        document.getElementById('wp-num').innerText = pred.side === '庄' ? '偶号趋向' : '奇号趋向';
                        document.getElementById('wp-size').innerText = pred.size;
                        document.getElementById('wp-size').className = `pred-result ${pred.size === '大' ? 'txt-big' : 'txt-small'}`;
                        document.getElementById('wp-color').innerText = pred.color;
                        document.getElementById('wp-color').className = `pred-result ${pred.color === '绿' ? 'bg-green' : (pred.color === '紫' ? 'bg-purple' : 'bg-red')}`;
                    } else {
                        document.getElementById('bac-conf').innerText = `${pred.confidence}%`;
                        const sideBox = document.getElementById('bp-side').querySelector('.pred-result');
                        sideBox.innerText = `绝杀：[${pred.side}]`;
                        sideBox.className = `pred-result ${pred.side === '庄' ? 'txt-banker' : 'txt-player'}`;
                        document.getElementById('bp-pair').innerText = pred.pairProb;
                        document.getElementById('bp-natural').innerText = pred.naturalProb;
                    }
                }
            },
            // 开奖瞬间的回调管道
            (finishedPeriodId) => {
                const gameData = runtime[gameId];
                const actual = AIPredictor.simulateResult(gameId);

                // 判断是否命中 (百家乐不把“和”算作失败，此处以最核心预测方向判断)
                let isWin = false;
                let predText = '无推荐';

                if (gameData.currentPred && gameData.currentPred.period === finishedPeriodId) {
                    if (gameId === 'wingo') {
                        isWin = (gameData.currentPred.side === actual.side);
                        predText = `推[${gameData.currentPred.side} ${gameData.currentPred.size}]`;
                    } else {
                        isWin = (gameData.currentPred.side === actual.side);
                        predText = `推[${gameData.currentPred.side}]`;
                        if (actual.side === '和') isWin = true; // 百家乐遇和对冲平扣，策略算通过
                    }
                }

                // 更新对应的量化指标
                gameData.stats.totalRounds += 1;
                if (isWin) {
                    gameData.stats.winRounds += 1;
                    gameData.stats.currentStreak += 1;
                    if (gameData.stats.currentStreak > gameData.stats.maxStreak) gameData.stats.maxStreak = gameData.stats.currentStreak;
                } else {
                    gameData.stats.currentStreak = 0;
                }

                // 打包塞进历史队列
                gameData.history.unshift({
                    period: finishedPeriodId,
                    number: actual.number,
                    side: actual.side,
                    size: actual.size,
                    color: actual.color,
                    predText: predText,
                    isWin: isWin
                });

                // 持久化保存保存
                StorageManager.saveHistory(gameId, gameData.history);
                StorageManager.saveStats(gameId, gameData.stats);

                // 抹除当前预测，等待下一期轮巡
                gameData.currentPred = null;

                // 如果开奖的游戏正好是用户目前停留在看面的游戏，立刻刷新大盘
                if (gameId === currentGameId) {
                    window.refreshGlobalUI();
                }
            }
        );
    }

    // 同时拉起 Wingo 和 百家乐 两条时间轴流水管线
    setupClockPipeline('wingo');
    setupClockPipeline('baccarat');

    // 清空历史按钮绑定
    dom.btnClear.addEventListener('click', () => {
        if (confirm(`确定要清空当前 [${currentGameId === 'wingo' ? 'Wingo' : '百家乐'}] 分类的全部本地历史与胜率指标吗？`)) {
            StorageManager.clearGameData(currentGameId);
            runtime[currentGameId].history = [];
            runtime[currentGameId].stats = { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 };
            runtime[currentGameId].currentPred = null;
            window.refreshGlobalUI();
        }
    });

    // 网页首次启动，执行初始化大盘装载
    window.refreshGlobalUI();
});
