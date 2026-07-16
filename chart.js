/**
 * AI Virtual Predictor V3 - 走势图表动态绘制模块
 * 基于 Chart.js 封装，提供黑金风格的折线图渲染
 */
const ChartManager = {
    chartInstance: null,

    /**
     * 初始化图表实例
     * @param {string} canvasId HTML中的Canvas标签ID
     */
    init(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // 如果已经存在实例，先销毁，防止重复初始化导致内存泄漏
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // 创建 Chart.js 实例
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // 期号后缀数组
                datasets: [{
                    label: '开奖号码波动趋势',
                    data: [], // 0-9 历史号码
                    borderColor: '#f0b90b', // 金色线条
                    borderWidth: 2,
                    pointBackgroundColor: '#0ecb81', // 绿色圆点
                    pointBorderColor: '#181a20',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    backgroundColor: 'rgba(240, 185, 11, 0.05)', // 线条下方半透明金色渐变填涂
                    fill: true,
                    tension: 0.35 // 贝塞尔曲线弧度，让走势更丝滑
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // 隐藏顶部的标签图例，保持视觉极简
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1c1f26',
                        titleColor: '#848e9c',
                        bodyColor: '#eaecef',
                        borderColor: '#2b2f3a',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)'
                        },
                        ticks: {
                            color: '#848e9c',
                            font: { size: 10 }
                        }
                    },
                    y: {
                        min: 0,
                        max: 9,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            stepSize: 1,
                            color: '#848e9c',
                            font: { family: 'monospace' }
                        }
                    }
                }
            }
        });
    },

    /**
     * 根据最新的历史数据动态同步刷新图表
     * @param {Array} history 全量历史开奖数据
     */
    update(history) {
        if (!this.chartInstance) return;

        // 截取最近的 20 期，并将其反转（让最新的数据呈现在图表最右侧）
        const recentData = history.slice(0, 20).reverse();

        // 提取期号的最后 4 位作为 X 轴标签
        const labels = recentData.map(item => item.period.slice(-4) + '期');
        // 提取具体的号码值作为 Y 轴数据
        const dataValues = recentData.map(item => Number(item.number));

        // 注入新数据并重绘
        this.chartInstance.data.labels = labels;
        this.chartInstance.data.datasets[0].data = dataValues;
        this.chartInstance.update('none'); // 使用 'none' 模式进行高性能无感更新
    }
};
