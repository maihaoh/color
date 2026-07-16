/**
 * AI Virtual Predictor V3 - 多维度策略分析引擎
 * 对历史开奖号码进行多维度的量化特征提取与打分
 */
const StrategyEngine = {
    /**
     * 对当前的开奖历史进行全维度策略矩阵打分
     * @param {Array} history 历史开奖记录数组
     * @returns {Object} 包含各项维度策略得分的统计结果 (0-100分)
     */
    analyze(history) {
        // 如果数据不足，返回基础平衡分 (50分)
        if (!history || history.length < 5) {
            return { hot: 50, cold: 50, neighbor: 50, span: 50, oe: 50, bs: 50 };
        }

        // 提取纯号码数组（最近的排在前面）
        const numbers = history.map(item => Number(item.number));
        
        return {
            hot: this.calcHotScore(numbers),
            cold: this.calcColdScore(numbers),
            neighbor: this.calcNeighborScore(numbers),
            span: this.calcSpanScore(numbers),
            oe: this.calcOEScore(numbers),
            bs: this.calcBSScore(numbers)
        };
    },

    /**
     * 1. 热号追踪打分 (分析最近 5 期号码在最近 20 期内的重复热度)
     */
    calcHotScore(numbers) {
        const recent = numbers.slice(0, 5);
        const pool = numbers.slice(0, 20);
        let matchCount = 0;
        
        recent.forEach(num => {
            matchCount += pool.filter(n => n === num).length - 1; 
        });

        // 映射到 0 - 100 分之间
        return Math.min(100, Math.max(10, 40 + (matchCount * 12)));
    },

    /**
     * 2. 冷号遗漏打分 (判断最新开出号码是否属于长期未出现的“冷号爆发”)
     */
    calcColdScore(numbers) {
        const latest = numbers[0];
        // 查找上一次出现该号码的间隔期数
        let missingLimit = numbers.slice(1).indexOf(latest);
        if (missingLimit === -1) missingLimit = 30; // 长期未出现

        return Math.min(100, Math.max(20, 30 + (missingLimit * 3.5)));
    },

    /**
     * 3. 邻号跳跃打分 (计算相邻两期号码之间的绝对差值走势)
     * 差值在 1 左右代表邻号高频，差值过大代表剧烈跳跃
     */
    calcNeighborScore(numbers) {
        let diffSum = 0;
        const count = Math.min(10, numbers.length - 1);
        
        for (let i = 0; i < count; i++) {
            diffSum += Math.abs(numbers[i] - numbers[i + 1]);
        }
        
        const avgDiff = diffSum / count;
        // 平均差值在 1-3 之间得分较高（平稳走势），偏离则说明跳跃剧烈
        return Math.min(100, Math.max(15, Math.floor(100 - (avgDiff * 12))));
    },

    /**
     * 4. 跨度震荡打分 (计算最近几期最大值与最小值的起伏波动)
     */
    calcSpanScore(numbers) {
        const chunk = numbers.slice(0, 10);
        const max = Math.max(...chunk);
        const min = Math.min(...chunk);
        const span = max - min; // 当前统计区间的极差

        // 极差稳定在 5-7 说明震荡健康，极差过小(0-2)或过大(9)得分会呈现两极分化
        return Math.min(100, Math.max(10, Math.floor(span * 11)));
    },

    /**
     * 5. 单双奇偶比例偏离度打分 (50分为奇偶极度平衡，两极代表偏向)
     */
    calcOEScore(numbers) {
        const chunk = numbers.slice(0, 15);
        const odds = chunk.filter(n => n % 2 !== 0).length;
        const ratio = odds / chunk.length;

        return Math.floor(ratio * 100);
    },

    /**
     * 6. 大小形态偏离度打分 (号码 0-4 为小，5-9 为大)
     */
    calcBSScore(numbers) {
        const chunk = numbers.slice(0, 15);
        const bigs = chunk.filter(n => n >= 5).length;
        const ratio = bigs / chunk.length;

        return Math.floor(ratio * 100);
    }
};
