/**
 * AI Multi-Predictor V3.5 - 决策与模拟引擎中心
 * 提供 Wingo 的多维混算预测 和 百家乐的庄闲路单对冲预测
 */
const AIPredictor = {
    // Wingo 颜色静态映射
    WINGO_COLORS: { 0: '红紫', 1: '绿', 2: '红', 3: '绿', 4: '红', 5: '绿', 6: '红', 7: '绿', 8: '红', 9: '绿紫' },

    /**
     * 分类调度预测器
     */
    generatePrediction(gameId, history) {
        if (gameId === 'wingo') {
            return this.predictWingo(history);
        } else {
            return this.predictBaccarat(history);
        }
    },

    /**
     * Wingo 混算预测核心
     */
    predictWingo(history) {
        const scores = StrategyEngine.analyzeWingo(history);
        let bProb = 0.5, pProb = 0.5; // 庄闲对应Wingo中的偶奇
        let bigProb = 0.5, smallProb = 0.5;
        let rProb = 0.45, gProb = 0.45, purProb = 0.1;

        const oeBias = (scores.oe - 50) / 100;
        bProb -= oeBias * 0.4; pProb += oeBias * 0.4;

        const bsBias = (scores.bs - 50) / 100;
        bigProb += bsBias * 0.5; smallProb -= bsBias * 0.5;

        if (scores.hot > 70) { gProb += 0.05; rProb -= 0.05; }
        if (scores.span < 40) purProb += 0.08;

        const confidence = Math.min(98, Math.max(62, Math.floor((100 - Math.abs(scores.neighbor - 50)) * 0.4 + Math.max(Math.abs(scores.oe - 50), Math.abs(scores.bs - 50)) * 1.2)));

        return {
            side: bProb >= pProb ? '庄' : '闲',
            size: bigProb >= smallProb ? '大' : '小',
            color: gProb > rProb && gProb > purProb ? '绿' : (purProb > rProb ? '紫' : '红'),
            confidence: confidence,
            scores: scores
        };
    },

    /**
     * 百家乐 百赌路单决策核心 (DG 平台对冲逻辑)
     */
    predictBaccarat(history) {
        const scores = StrategyEngine.analyzeBaccarat(history);
        
        // 核心依据：结合大眼仔路(红多顺势, 蓝多反打)与长龙长跳倾向
        let bankerWeight = 50;
        let playerWeight = 50;

        // 趋势偏离对冲
        bankerWeight += (scores.trendBias - 50) * 0.3;
        playerWeight -= (scores.trendBias - 50) * 0.3;

        // 大眼仔顺势红判断
        if (scores.bigEyeScore > 55) {
            // 说明当前大路排布极度规则，依最新一口顺势推导
            if (history.length > 0 && history[0].side === '庄') bankerWeight += 15;
            if (history.length > 0 && history[0].side === '闲') playerWeight += 15;
        } else if (scores.bigEyeScore < 45) {
            // 说明当前走势凌乱，触发破路反打机制
            if (history.length > 0 && history[0].side === '庄') playerWeight += 12;
            if (history.length > 0 && history[0].side === '闲') bankerWeight += 12;
        }

        // 单跳路与长龙修正
        if (scores.jumpRate > 60) {
            // 单跳路旺盛，推荐斩龙打跳 (与上一口相反)
            if (history.length > 0 && history[0].side === '庄') { playerWeight += 20; bankerWeight -= 20; }
            if (history.length > 0 && history[0].side === '闲') { bankerWeight += 20; playerWeight -= 20; }
        }

        const sideRecommendation = bankerWeight >= playerWeight ? '庄' : '闲';
        
        // 计算百家乐核心信心值
        let confidence = Math.floor(55 + Math.abs(bankerWeight - playerWeight) + (scores.longStreak * 0.2));
        confidence = Math.min(99, Math.max(60, confidence));

        return {
            side: sideRecommendation,
            pairProb: `${scores.pairProb}%`,
            naturalProb: `${scores.naturalProb}%`,
            confidence: confidence,
            scores: scores
        };
    },

    /**
     * 分类结果仿真物理引擎
     */
    simulateResult(gameId) {
        if (gameId === 'wingo') {
            const num = Math.floor(Math.random() * 10);
            const side = num % 2 === 0 ? '庄' : '闲';
            const size = num >= 5 ? '大' : '小';
            let color = '红';
            if (this.WINGO_COLORS[num].includes('绿')) color = '绿';
            if (this.WINGO_COLORS[num].includes('紫')) color = '紫';
            return { number: num, side, size, color };
        } else {
            // 百家乐 DG 发牌仿真逻辑
            const bankerScore = Math.floor(Math.random() * 10);
            const playerScore = Math.floor(Math.random() * 10);
            
            let side = '和';
            if (bankerScore > playerScore) side = '庄';
            else if (playerScore > bankerScore) side = '闲';

            // 模拟产生对子（极小离散几率）
            const randPair = Math.random();
            let formStr = '无对子';
            if (randPair < 0.05) formStr = '庄对';
            else if (randPair < 0.10) formStr = '闲对';
            else if (randPair < 0.12) formStr = '双对';

            // 组合形态字符: 结果[庄点数-闲点数] (对子形态)
            const detailForm = `${side}[${bankerScore}-${playerScore}] (${formStr})`;

            return {
                number: `${bankerScore}点 vs ${playerScore}点`,
                side: side,
                size: detailForm, // 借用属性栏存放详细点数描述
                color: (bankerScore >= 8 || playerScore >= 8) ? '天生赢家' : '常规局'
            };
        }
    }
};
