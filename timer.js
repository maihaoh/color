/**
 * AI Virtual Predictor V3 - 高精度后台同步计时模块
 * 基于系统物理时间差，彻底解决浏览器后台休眠错乱问题
 */
class TimeManager {
    constructor(periodDuration = 30) {
        this.duration = periodDuration * 1000; // 转化为毫秒 (30000ms)
        this.callback = null; // 每秒倒计时回调
        this.openCallback = null; // 倒计时归零开奖回调
        this.timerId = null;
        
        // 核心同步逻辑锚点：记录页面加载时的基准毫秒时间戳
        this.baseTime = Math.floor(Date.now() / this.duration) * this.duration;

        this.initVisibilityListener();
    }

    /**
     * 初始化时间管理器
     * @param {Function} onTick 每秒更新UI回调，传入剩余秒数
     * @param {Function} onOpen 倒计时结束开奖回调，传入刚刚结束的期号
     */
    init(onTick, onOpen) {
        this.callback = onTick;
        this.openCallback = onOpen;
        this.startLoop();
    }

    /**
     * 核心计时循环（每 100ms 高频检查，提供极致的丝滑倒计时效果）
     */
    startLoop() {
        if (this.timerId) clearInterval(this.timerId);

        const tick = () => {
            const now = Date.now();
            // 计算当前这一期是从哪个绝对时间戳开始的
            const currentPeriodStart = Math.floor(now / this.duration) * this.duration;
            // 计算距离这一期结束还剩多少毫秒
            const timePassed = now - currentPeriodStart;
            const timeLeftMs = this.duration - timePassed;
            const timeLeftSec = (timeLeftMs / 1000).toFixed(1);

            // 动态生成基于当前绝对时间的期号
            const periodId = this.generatePeriodId(now);

            // 执行每秒的 UI 渲染回调
            if (this.callback) {
                this.callback(timeLeftSec, periodId);
            }

            // 临界点判定：如果剩余毫秒极其微小，或者刚刚跨入新的一期
            // 为了防止高频检查内多次触发开奖，使用临界判断
            if (timeLeftMs <= 150) {
                // 停止当前循环，等待 200ms 跨越临界期后重新开始并开奖
                clearInterval(this.timerId);
                setTimeout(() => {
                    if (this.openCallback) {
                        this.openCallback(periodId);
                    }
                    this.startLoop(); // 重新拉起循环
                }, 200);
            }
        };

        // 每 100ms 轮询一次，保障切回前台时最快 0.1 秒内完成校准
        this.timerId = setInterval(tick, 100);
        tick(); // 立即执行一次
    }

    /**
     * 智能期号生成器
     * 格式：YYYYMMDD + 当天从 00:00:00 开始的累计期数 (4位补零)
     */
    generatePeriodId(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // 计算今天 00:00:00 的绝对时间戳
        const startOfDay = new Date(year, date.getMonth(), date.getDate()).getTime();
        
        // 计算从凌晨到现在过去了多少毫秒，并算出是第几期
        const msPassed = timestamp - startOfDay;
        const periodIndex = Math.floor(msPassed / this.duration) + 1;
        
        // 格式化为 4 位数的期数后缀 (如 0001, 0124)
        const periodSuffix = String(periodIndex).padStart(4, '0');
        
        return `${year}${month}${day}${periodSuffix}`;
    }

    /**
     * 监听浏览器标签页激活状态
     * 只要用户从后台切回来，立刻强制重置循环，进行物理级时间同步
     */
    initVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                const statusEl = document.getElementById('sync-status');
                if (statusEl) {
                    statusEl.innerText = "时间已与后台毫秒级同步";
                    statusEl.style.color = "var(--neon-green)";
                }
                this.startLoop();
            } else {
                const statusEl = document.getElementById('sync-status');
                if (statusEl) {
                    statusEl.innerText = "系统进入后台挂起模式...";
                    statusEl.style.color = "var(--text-muted)";
                }
            }
        });
    }
}

// 实例化导出为全局变量，方便 app.js 调用
window.timerManager = new TimeManager(30);
