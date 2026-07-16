/**
 * AI Virtual Predictor V3 - 本地数据持久化模块
 * 负责与 LocalStorage 进行安全交互
 */
const StorageManager = {
    // 定义 LocalStorage 的键名
    KEYS: {
        HISTORY: 'vp_history_data',
        STATS: 'vp_stats_data'
    },

    /**
     * 从本地获取历史记录
     * @returns {Array} 历史记录数组
     */
    getHistory() {
        try {
            const data = localStorage.getItem(this.KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("读取历史记录失败:", e);
            return [];
        }
    },

    /**
     * 保存历史记录到本地
     * @param {Array} historyList 历史记录数组
     */
    saveHistory(historyList) {
        try {
            // 严格限制最大只保存 100 期，防止占用空间过大
            const limitedList = historyList.slice(0, 100);
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(limitedList));
        } catch (e) {
            console.error("保存历史记录失败:", e);
        }
    },

    /**
     * 从本地获取统计数据（命中率、连胜等）
     * @returns {Object} 统计对象
     */
    getStats() {
        try {
            const data = localStorage.getItem(this.KEYS.STATS);
            return data ? JSON.parse(data) : {
                totalRounds: 0,
                winRounds: 0,
                currentStreak: 0,
                maxStreak: 0
            };
        } catch (e) {
            console.error("读取统计数据失败:", e);
            return { totalRounds: 0, winRounds: 0, currentStreak: 0, maxStreak: 0 };
        }
    },

    /**
     * 保存统计数据到本地
     * @param {Object} statsObj 统计对象
     */
    saveStats(statsObj) {
        try {
            localStorage.setItem(this.KEYS.STATS, JSON.stringify(statsObj));
        } catch (e) {
            console.error("保存统计数据失败:", e);
        }
    },

    /**
     * 一键清空所有本地数据
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.KEYS.HISTORY);
            localStorage.removeItem(this.KEYS.STATS);
            return true;
        } catch (e) {
            console.error("清空数据失败:", e);
            return false;
        }
    }
};
