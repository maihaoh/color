/**
 * AI Multi-Predictor V3.5 - 独立网格双画布图表管理器
 * 核心逻辑：独立实例化并缓存 Wingo 与 百家乐 两套不同的数据曲线
 */
const ChartManager = {
    instances: {
        wingo: null,
        baccarat: null
    },

    /**
     * 一键初始化所有图表画布
     */
    initAll() {
        this.initWingoChart();
        this.initBaccaratChart();
    },

    /**
     * 初始化 Wingo 趋势图 (0-9 绝对号码起伏)
     */
    initWingoChart() {
        const ctx = document.getElementById('trendChartWingo');
        if (!ctx) return;
        
        if (this.instances.wingo) this.instances.wingo.destroy();

        this.instances.wingo = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: '#f0b90b', borderWidth: 2, pointBackgroundColor: '#0ecb81', backgroundColor: 'rgba(240, 185, 11, 0.02)', fill: true, tension: 0.35 }] },
            options: this.getCommonOptions(0, 9, '期号数字波动')
        });
    },

    /**
     * 初始化 百家乐 旺衰图 (模拟大眼仔变频差值走势)
     */
    initBaccaratChart() {
        const ctx = document.getElementById('trendChartBac');
        if (!ctx) return;

        if (this.instances.baccarat) this.instances.baccarat.destroy();

        this.instances.baccarat = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: '#0052d9', borderWidth: 2, pointBackgroundColor: '#e02020', backgroundColor: 'rgba(0, 82, 219, 0.02)', fill: true, tension: 0.2 }] },
            options: this.getCommonOptions(-3, 3, '大眼仔趋势量化')
        });
    },

    /**
     * 通用配置模板生成
     */
    getCommonOptions(minY, maxY, labelName) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: '#14161c', borderColor: '#222630', borderWidth: 1 } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.02)' }, ticks: { color: '#707a8a', font: { size: 9 } } },
                y: { min: minY, max: maxY, grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#707a8a', font: { family: 'monospace' } } }
            }
        };
    },

    /**
     * 分类调度刷新对应的图表曲线
     */
    update(gameId, history) {
        const chart = this.instances[gameId];
        if (!chart) return;

        const recent = history.slice(0, 20).reverse();
        const labels = recent.map(item => item.period.slice(-4));
        
        let dataValues = [];
        if (gameId === 'wingo') {
            dataValues = recent.map(item => Number(item.number));
        } else {
            // 百家乐映射：将 庄 映射为 1，闲 映射为 -1，和 映射为 0，生成一条资金流走势般的旺衰曲线
            let curValue = 0;
            dataValues = recent.map(item => {
                if (item.side === '庄') curValue = Math.min(3, curValue + 1);
                else if (item.side === '闲') curValue = Math.max(-3, curValue - 1);
                return curValue;
            });
        }

        chart.data.labels = labels;
        chart.data.datasets[0].data = dataValues;
        chart.update('none'); // 高性能静默重绘
    }
};
