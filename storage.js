/**
 * AI Multi-Predictor V3.5 - 独立命名空间本地存储模块
 * 核心逻辑：按游戏类别 (wingo / baccarat) 隔离存储历史流水与统计指标
 */
const StorageManager = {
    // 动态生成带命名空间的 Key
    getKeys(gameId) {
        return {
            HISTORY: `vp_${gameId}_history_v35`,
            STATS: `vp_${gameId}_stats_v35`
        };
    },

    /**
     * 获取指定游戏的开奖历史
     */
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

    /**
     * 保存指定游戏的历史记录（上限 100 期）
     */
    saveHistory(gameId, historyList) {
        try {
            const keys = this.getKeys(gameId);
            const limitedList = historyList.slice(0, 100);
            localStorage.setItem(keys.HISTORY, JSON.stringify(limitedList));
        } catch (e) {
            console.error(`[Storage] 保存 ${gameId} 历史失败:`, e);
        }
    },

    /**
     * 获取指定游戏的统计指标
     */
    getStats(gameId) {
        try {
            const keys = this.getKeys(gameId);
            const data = localStorage.getItem(keys.STATS);
            return data ? JSON.parse(data) : {
                totalRounds: 0,
                winRounds: 0,
                currentStreak: 0,
                maxStreak: 0
            };
        } catch (e) {
            console.error(`[Storage] 读取 ${gameId} 统计失败:`, e);
            return { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 };
        }
    },

    /**
     * 保存指定游戏的统计指标
     */
    saveStats(gameId, statsObj) {
        try {
            const keys = this.getKeys(gameId);
            localStorage.setItem(keys.STATS, JSON.stringify(statsObj));
        } catch (e) {
            console.error(`[Storage] 保存 ${gameId} 统计失败:`, e);
        }
    },

    /**
     * 清空指定游戏的数据
     */
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
