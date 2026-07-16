/**
 * AI Multi-Predictor V3.5 - 双游戏策略分析矩阵
 * 包含 Wingo 的数字特征拆解 与 百家乐(DG)的路单破路判定算法
 */
const StrategyEngine = {
    /**
     * Wingo 策略分析入口
     */
    analyzeWingo(history) {
        if (!history || history.length < 5) {
            return { hot: 50, cold: 50, neighbor: 50, span: 50, oe: 50, bs: 50 };
        }
        const numbers = history.map(item => Number(item.number));
        return {
            hot: this.calcWingoHot(numbers),
            cold: this.calcWingoCold(numbers),
            neighbor: this.calcWingoNeighbor(numbers),
            span: this.calcWingoSpan(numbers),
            oe: this.calcWingoOE(numbers),
            bs: this.calcWingoBS(numbers)
        };
    },

    /* ================= Wingo 算法子项 ================= */
    calcWingoHot(nums) {
        const recent = nums.slice(0, 5), pool = nums.slice(0, 20);
        let matches = 0;
        recent.forEach(n => { matches += pool.filter(p => p === n).length - 1; });
        return Math.min(100, Math.max(10, 40 + (matches * 12)));
    },
    calcWingoCold(nums) {
        let missing = nums.slice(1).indexOf(nums[0]);
        if (missing === -1) missing = 30;
        return Math.min(100, Math.max(20, 30 + (missing * 3.5)));
    },
    calcWingoNeighbor(nums) {
        let diff = 0; const count = Math.min(10, nums.length - 1);
        for (let i = 0; i < count; i++) diff += Math.abs(nums[i] - nums[i + 1]);
        return Math.min(100, Math.max(15, Math.floor(100 - ((diff / count) * 12))));
    },
    calcWingoSpan(nums) {
        const chunk = nums.slice(0, 10);
        return Math.min(100, Math.max(10, Math.floor((Math.max(...chunk) - Math.min(...chunk)) * 11)));
    },
    calcWingoOE(nums) {
        const chunk = nums.slice(0, 15);
        return Math.floor((chunk.filter(n => n % 2 !== 0).length / chunk.length) * 100);
    },
    calcWingoBS(nums) {
        const chunk = nums.slice(0, 15);
        return Math.floor((chunk.filter(n => n >= 5).length / chunk.length) * 100);
    },

    /**
     * 百家乐 策略分析入口 (DG 规则)
     * 核心算法：提取大路单，模拟大眼仔路的正反性（齐整、有脚、撞红）
     */
    analyzeBaccarat(history) {
        if (!history || history.length < 3) {
            return { trendBias: 50, bigEyeScore: 50, jumpRate: 50, longStreak: 50, pairProb: 10, naturalProb: 15 };
        }

        // 提取纯结果序列 (例如: ['庄', '闲', '庄', '庄', '和'])
        const results = history.map(item => item.side).reverse(); // 转为正序计算大路

        // 1. 构建简化大路网格（按长龙换列原则）
        const bigRoad = [];
        let currentCol = [];
        let lastResult = null;

        results.forEach(res => {
            if (res === '和') return; // “和”在路单判定中通常不换列
            if (!lastResult) {
                currentCol.push(res);
                lastResult = res;
            } else if (res === lastResult) {
                currentCol.push(res);
            } else {
                bigRoad.push(currentCol);
                currentCol = [res];
                lastResult = res;
            }
        });
        if (currentCol.length > 0) bigRoad.push(currentCol);

        // 2. 计算大眼仔路 (从大路第2列第2铺 或 第3列第1铺开始，此处简易化建模其齐整度)
        let redCount = 0, blueCount = 0;
        if (bigRoad.length >= 2) {
            for (let i = 1; i < bigRoad.length; i++) {
                const col = bigRoad[i];
                const prevCol = bigRoad[i - 1];
                for (let j = 0; j < col.length; j++) {
                    // 大眼仔路规则简易拟合：比对前一列对应行是否存在或长度是否相等（齐整为红，不齐整为蓝）
                    if (prevCol && prevCol.length >= j + 1) {
                        redCount++; // 齐整/撞红
                    } else {
                        blueCount++; // 有脚/非齐整
                    }
                }
            }
        }

        const totalEye = redCount + blueCount;
        const bigEyeScore = totalEye > 0 ? Math.floor((redCount / totalEye) * 100) : 50;

        // 3. 计算庄闲旺衰差值偏离度
        const bankers = results.filter(r => r === '庄').length;
        const players = results.filter(r => r === '闲').length;
        const trendBias = Math.floor((bankers / (bankers + players || 1)) * 100);

        // 4. 计算跳跃度 (单跳 vs 连牌)
        let jumps = 0;
        for (let i = 0; i < results.length - 1; i++) {
            if (results[i] !== results[i + 1]) jumps++;
        }
        const jumpRate = Math.floor((jumps / (results.length - 1 || 1)) * 100);

        // 5. 查找当前最高长龙倾向
        let currentStreak = 1;
        const revResults = [...results].reverse();
        for (let i = 0; i < revResults.length - 1; i++) {
            if (revResults[i] === revResults[i + 1] && revResults[i] !== '和') currentStreak++;
            else break;
        }
        const longStreak = Math.min(100, currentStreak * 15);

        // 6. 对子与天生赢家离散概率估计
        const pairProb = Math.min(45, Math.floor(10 + (jumpRate * 0.2)));
        const naturalProb = Math.min(50, Math.floor(15 + (bigEyeScore * 0.2)));

        return { trendBias, bigEyeScore, jumpRate, longStreak, pairProb, naturalProb };
    }
};
