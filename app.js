/**
 * AI Virtual Predictor V3 - 核心业务串联总调度枢纽
 * 负责生命周期管理、事件绑定以及全局 UI 的渲染分发
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化核心状态变量
    let historyData = StorageManager.getHistory();
    let statsData = StorageManager.getStats();
    let currentPrediction = null; // 存放当前期号的 AI 预判结果

    // 2. 初始化图表
    ChartManager.init('trendChart');
    
    // 3. 全局核心 UI 元素缓存
    const dom = {
        countdown: document.getElementById('countdown'),
        currentPeriod: document.getElementById('current-period'),
        totalRounds: document.getElementById('total-rounds'),
        winRate: document.getElementById('win-rate'),
        currentStreak: document.getElementById('current-streak'),
        maxStreak: document.getElementById('max-streak'),
        confidenceLevel: document.getElementById('confidence-level'),
        confidenceBar: document.getElementById('confidence-bar'),
        predSide: document.getElementById('pred-side').querySelector('.pred-result'),
        predSize: document.getElementById('pred-size').querySelector('.pred-result'),
        predColor: document.getElementById('pred-color').querySelector('.pred-result'),
        historyTbody: document.getElementById('history-tbody'),
        btnClear: document.getElementById('btn-clear-data')
    };

    /**
     * 全局 UI 动态刷新函数
     */
    function renderDashboard() {
        // 渲染统计指标
        dom.totalRounds.innerText = statsData.totalRounds;
        dom.currentStreak.innerText = statsData.currentStreak;
        dom.maxStreak.innerText = statsData.maxStreak;
        
        const rate = statsData.totalRounds > 0 
            ? ((statsData.winRounds / statsData.totalRounds) * 100).toFixed(1) 
            : '0.0';
        dom.winRate.innerText = `${rate}%`;

        // 渲染策略评分矩阵矩阵
        const matrix = StrategyEngine.analyze(historyData);
        document.getElementById('score-hot').innerText = `${matrix.hot}分`;
        document.getElementById('score-cold').innerText = `${matrix.cold}分`;
        document.getElementById('score-neighbor').innerText = `${matrix.neighbor}分`;
        document.getElementById('score-span').innerText = `${matrix.span}分`;
        document.getElementById('score-oe').innerText = `${matrix.oe}分`;
        document.getElementById('score-bs').innerText = `${matrix.bs}分`;

        // 渲染历史数据表格
        dom.historyTbody.innerHTML = '';
        historyData.forEach(item => {
            const tr = document.createElement('tr');
            
            // 样式染色解析
            const sideClass = item.side === '庄' ? 'text-banker' : 'text-player';
            const sizeClass = item.size === '大' ? 'text-big' : 'text-small';
            let colorClass = 'bg-red';
            if (item.color === '绿') colorClass = 'bg-green';
            if (item.color === '紫') colorClass = 'bg-purple';

            const resultClass = item.isWin ? 'status-win' : 'status-lose';

            tr.innerHTML = `
                <td>${item.period}</td>
                <td><strong style="font-size:16px;">${item.number}</strong></td>
                <td>
                    <span class="${sideClass}">${item.side}</span> / 
                    <span class="${sizeClass}">${item.size}</span> / 
                    <span class="${colorClass}">${item.color}</span>
                </td>
                <td>${item.predText}</td>
                <td class="${resultClass}">${item.isWin ? 'MATCHED ★' : 'MISSED'}</td>
            `;
            dom.historyTbody.appendChild(tr);
        });

        // 同步绘制折线图
        ChartManager.update(historyData);
    }

    /**
     * 核心生命周期一：每秒倒计时倒数与新期号前瞻
     */
    window.timerManager.init(
        // Tick 回调
        (timeLeftSec, periodId) => {
            dom.countdown.innerText = `${timeLeftSec}s`;
            dom.currentPeriod.innerText = periodId;

            // 智能前瞻触发：当检测到跨入新的一期，且当前还没有为该期生成预测时
            if (!currentPrediction || currentPrediction.period !== periodId) {
                // 调用决策中心生成新一轮预测
                const pred = AIPredictor.generatePrediction(historyData);
                currentPrediction = {
                    period: periodId,
                    ...pred
                };

                // 异步将 AI 的实时研判结果渲染到中心看板上
                dom.confidenceLevel.innerText = `${pred.confidence}%`;
                dom.confidenceBar.style.width = `${pred.confidence}%`;
                
                dom.predSide.innerText = pred.side;
                dom.predSide.className = `pred-result ${pred.side === '庄' ? 'text-banker' : 'text-player'}`;
                
                dom.predSize.innerText = pred.size;
                dom.predSize.className = `pred-result ${pred.size === '大' ? 'text-big' : 'text-small'}`;
                
                dom.predColor.innerText = pred.color;
                let cClass = 'bg-red';
                if (pred.color === '绿') cClass = 'bg-green';
                if (pred.color === '紫') cClass = 'bg-purple';
                dom.predColor.className = `pred-result ${cClass}`;
            }
        },
        
        // 开奖逻辑回调（倒计时归零瞬间由系统硬件时钟触发）
        (finishedPeriodId) => {
            // 1. 摇号物理仿真生成本期实际赛果
            const actualResult = AIPredictor.simulateLottoResult();

            // 2. 判定核心指标（以最核心的 庄/闲 预测作为命中率统计基准）
            let isWin = false;
            let predText = '无预测';

            if (currentPrediction && currentPrediction.period === finishedPeriodId) {
                isWin = (currentPrediction.side === actualResult.side);
                predText = `推[${currentPrediction.side} ${currentPrediction.size} ${currentPrediction.color}]`;
            }

            // 3. 更新全局量化统计看板数据
            statsData.totalRounds += 1;
            if (isWin) {
                statsData.winRounds += 1;
                statsData.currentStreak += 1;
                if (statsData.currentStreak > statsData.maxStreak) {
                    statsData.maxStreak = statsData.currentStreak;
                }
            } else {
                statsData.currentStreak = 0; // 连胜中断
            }

            // 4. 将本期完整数据链打包塞入历史队列首位
            const logItem = {
                period: finishedPeriodId,
                number: actualResult.number,
                side: actualResult.side,
                size: actualResult.size,
                color: actualResult.color,
                predText: predText,
                isWin: isWin
            };
            historyData.unshift(logItem);

            // 5. 数据落盘持久化
            StorageManager.saveHistory(historyData);
            StorageManager.saveStats(statsData);

            // 6. 重置本地内存预测状态，迎接下一期轮巡
            currentPrediction = null;

            // 7. 全局刷新大盘渲染
            renderDashboard();
        }
    );

    // 4. 一键清空历史事件绑定
    dom.btnClear.addEventListener('click', () => {
        if (confirm('确定要清空所有本地开奖历史记录与胜率统计吗？该操作不可逆。')) {
            StorageManager.clearAllData();
            historyData = [];
            statsData = { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 };
            currentPrediction = null;
            renderDashboard();
        }
    });

    // 5. 网页首次加载时执行一次初始化渲染
    renderDashboard();
});
