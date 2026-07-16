/**
 * AI Virtual Predictor V3 - AI 预测与合成决策中心
 * 融合多维策略，生成最终的预测推荐与信心值评估
 */
const AIPredictor = {
    // 静态映射规则定义
    COLOR_MAP: {
        0: '红紫', 1: '绿', 2: '红', 3: '绿', 4: '红',
        5: '绿', 6: '红', 7: '绿', 8: '红', 9: '绿紫'
    },

    /**
     * 核心预测函数：根据历史数据生成下一期的 AI 预测结果
     * @param {Array} history 历史开奖记录
     * @returns {Object} 预测输出
     */
    generatePrediction(history) {
        // 1. 获取基础特征打分
        const scores = StrategyEngine.analyze(history);

        // 2. 初始化概率权重
        let bankerProb = 0.5, playerProb = 0.5;
        let bigProb = 0.5, smallProb = 0.5;
        let redProb = 0.45, greenProb = 0.45, purpleProb = 0.1;

        // 3. 基于“单双奇偶得分”影响 庄/闲 倾向 (在此设定奇数偏闲，偶数偏庄的拟合规则)
        const oeBias = (scores.oe - 50) / 100; // 偏离范围 [-0.5, 0.5]
        bankerProb -= oeBias * 0.4;
        playerProb += oeBias * 0.4;

        // 4. 基于“大小形态得分”影响 大/小 倾向
        const bsBias = (scores.bs - 50) / 100;
        bigProb += bsBias * 0.5;
        smallProb -= bsBias * 0.5;

        // 5. 结合“热号与跨度”扰动颜色权重分布
        if (scores.hot > 70) {
            greenProb += 0.05;
            redProb -= 0.05;
        }
        if (scores.span < 40) {
            purpleProb += 0.08; // 极差紧缩时，紫号概率微幅调高
        }

        // 6. 判定最终预测输出值
        const predSide = bankerProb >= playerProb ? '庄' : '闲';
        const predSize = bigProb >= smallProb ? '大' : '小';
        
        let predColor = '红';
        if (greenProb > redProb && greenProb > purpleProb) predColor = '绿';
        else if (purpleProb > redProb && purpleProb > greenProb) predColor = '紫';

        // 7. 动态计算 AI 信心值 (结合趋势稳定度与偏离强度)
        const stability = 100 - Math.abs(scores.neighbor - 50); // 走势平稳度
        const strength = Math.max(Math.abs(scores.oe - 50), Math.abs(scores.bs - 50)) * 2;
        let confidence = Math.floor((stability * 0.4) + (strength * 0.6));
        
        // 确保信心值处于合理观感区间 (62% - 98%)
        confidence = Math.min(98, Math.max(62, confidence));

        return {
            side: predSide,
            size: predSize,
            color: predColor,
            confidence: confidence,
            matrixScores: scores // 保留策略分用于渲染
        };
    },

    /**
     * 物理开奖模拟器 (核心算法逻辑：生成 0-9 真实随机号码，并解析出其所有固有属性)
     * @returns {Object} 开奖结果对象
     */
    simulateLottoResult() {
        const luckyNumber = Math.floor(Math.random() * 10);
        
        // 分离大小形态
        const size = luckyNumber >= 5 ? '大' : '小';
        
        // 分离庄闲形态 (约定：偶数为庄，奇数为闲)
        const side = luckyNumber % 2 === 0 ? '庄' : '闲';
        
        // 匹配颜色形态
        let color = '红';
        const rawColorStr = this.COLOR_MAP[luckyNumber];
        if (rawColorStr.includes('绿')) color = '绿';
        if (rawColorStr.includes('紫')) color = '紫'; // 0和9开出带有紫

        return {
            number: luckyNumber,
            side: side,
            size: size,
            color: color
        };
    }
};
