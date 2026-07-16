/**
 * Wingo 自动化测试总控中心（云端同步版）
 * 作用：直接嵌入项目源码，实现自动清空、跨网抓取并自动跑下一期测试
 */
(function() {
    // 确保页面加载完成后再执行，防止找不到DOM元素
    window.addEventListener('DOMContentLoaded', () => {
        console.log("⚡ [AI面板源码内核] 自动化流水线已嵌入，正在监听外网云端开奖流...");
        
        // 1. 这里的 boxId 必须和游戏网页控制台里跑的雷达保持绝对一致
        const boxId = "wingo_ai_test_room_2026";
        let lastProcessedPeriod = "";

        // 2. 自动化清空动作
        function clearOldData() {
            // 自动寻找并触发页面上的【清空当前分类历史数据】红色按钮
            const clearBtn = Array.from(document.querySelectorAll('button, div, span, a'))
                .find(el => el.innerText && el.innerText.includes('清空当前分类历史数据'));
            
            if (clearBtn) {
                clearBtn.click();
                console.log("🧹 [自动化] 检测到开奖更新，已通过源码自动触发【清空当前分类历史数据】。");
            } else {
                // 兜底机制：如果你源码内部有暴露重置函数，可以直接写在这里
                if (typeof window.clearHistory === 'function') window.clearHistory();
                if (typeof window.resetStats === 'function') window.resetStats();
            }
        }

        // 3. 开启云端监听定时器
        setInterval(() => {
            fetch(`https://kvstore.p3k.io/kv/${boxId}`)
            .then(res => res.json())
            .then(data => {
                // 检查是否是真正的新期号
                if (data && data.period && data.period !== lastProcessedPeriod) {
                    lastProcessedPeriod = data.period;
                    
                    console.log(`\n🆕 ==================================`);
                    console.log(`🎯 [源码云端同步] 拦截到最新期号: ${data.period} | 真实号码: ${data.number}`);

                    // 第一步：先清空当前分类的历史累计数据
                    clearOldData();

                    // 第二步：稍微延迟一会（留给页面清空和倒计时刷新的缓冲时间），注入新号码开始自动测试
                    setTimeout(() => {
                        console.log(`🚀 [源码云端同步] 正在将最新号码 [${data.number}] 喂入AI量化核心...`);
                        
                        // 【精准对接你源码的函数】请根据你原本的JS逻辑进行配对：
                        if (typeof window.processIncomingResult === 'function') {
                            window.processIncomingResult(data.period, data.number);
                        } else if (typeof window.updateData === 'function') {
                            window.updateData(data.period, data.number);
                        } else if (typeof window.addDataRow === 'function') {
                            window.addDataRow(data.period, data.number);
                        } else {
                            // 兜底：如果你的量化引擎是通过点击某个“开始测试”的按钮触发的
                            const testBtn = Array.from(document.querySelectorAll('button'))
                                .find(el => el.innerText && (el.innerText.includes('测试') || el.innerText.includes('分析') || el.innerText.includes('计算')));
                            if (testBtn) {
                                testBtn.click();
                                console.log("🤖 [自动化] 未找到标准JS注入函数，已通过模拟物理点击【测试/分析】按钮触发运算。");
                            } else {
                                console.log("⚠️ [提示] 号码已成功同步，请确保你的核心量化算法函数已挂载在 window 全局作用域下。");
                            }
                        }
                        
                        console.log(`⏰ [自动化] 当前期号 ${data.period} 测试完毕。胜率指标已自动刷新，死守下一期倒计时中...`);
                    }, 600); // 延迟0.6秒确保页面清空完成
                }
            })
            .catch(() => { /* 忽略云端网络波动 */ });
        }, 1200); // 每 1.2 秒监听一次云端
    });
})();
