/**
 * ============================================================================
 * 📡 接收天线：实时同步官方真实开奖数据
 * ============================================================================
 */
const receiveChannel = new BroadcastChannel('wingo_realtime_bridge');

receiveChannel.onmessage = function(event) {
    if (event.data && event.data.type === 'OFFICIAL_OPEN_RESULT') {
        const officialData = event.data;
        console.log(`[AI面板] 收到官方真实开奖信号！期号: ${officialData.period}, 号码: ${officialData.number}`);

        // 1. 判定单双、大小、波色形态
        const num = officialData.number;
        const side = num % 2 === 0 ? '庄' : '闲';
        const size = num >= 5 ? '大' : '小';
        let color = '红';
        if ([1, 3, 7, 9].includes(num)) color = '绿';
        if ([0, 5].includes(num)) color = '紫'; // 或者是红紫/绿紫

        // 2. 获取当前运行时的 Wingo 数据源
        // 注意：这里需要确保运行时环境能被访问，直接强行注入进历史记录
        const wingoData = window.runtime ? window.runtime.wingo : null;
        if (wingoData) {
            let isWin = false;
            let predText = '无推荐';

            if (wingoData.currentPred) {
                isWin = (wingoData.currentPred.side === side);
                predText = `推[${wingoData.currentPred.side} ${wingoData.currentPred.size}]`;
            }

            // 更新量化统计指标
            wingoData.stats.totalRounds += 1;
            if (isWin) {
                wingoData.stats.winRounds += 1;
                wingoData.stats.currentStreak += 1;
                if (wingoData.stats.currentStreak > wingoData.stats.maxStreak) wingoData.stats.maxStreak = wingoData.stats.currentStreak;
            } else {
                wingoData.stats.currentStreak = 0;
            }

            // 塞入历史流水
            wingoData.history.unshift({
                period: officialData.period,
                number: num,
                side,
                size,
                color,
                predText,
                isWin
            });

            // 本地存储备份并刷新前端UI
            if (window.StorageManager) {
                window.StorageManager.saveHistory('wingo', wingoData.history);
                window.StorageManager.saveStats('wingo', wingoData.stats);
            }
            
            // 清空当前预测，等待下一期时钟触发新一轮研判
            wingoData.currentPred = null;
            if (window.refreshGlobalUI) window.refreshGlobalUI();
        }
    }
};
