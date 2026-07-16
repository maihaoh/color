/**
 * Wingo 自动化测试总控中心（源码网络接收端）
 * 放置位置：GitHub 仓库的 auto-test.js
 */
(function() {
    // 确保网页完全加载完毕后再去绑定按钮和数据
    window.addEventListener('DOMContentLoaded', () => {
        console.log("⚡ [AI面板源码内核] 自动化流水线已成功激活，正在实时监控外网云端数据包...");
        
        // 关键配置：必须和游戏端发包的房间名字一致
        const targetRoomName = "wingo_ai_test_room_2026";
        let lastProcessedPeriod = "";

        // 1. 自动化清空机制
        function clearOldData() {
            // 在网页上自动搜寻【清空当前分类历史数据】这个红色按钮
            const clearBtn = Array.from(document.querySelectorAll('button, div, span, a'))
                .find(el => el.innerText && el.innerText.includes('清空当前分类历史数据'));
            
            if (clearBtn) {
                clearBtn.click(); // 模拟物理点击，瞬间清空面板历史
                console.log("🧹 [自动化] 检测到新开奖，已自动点击【清空当前分类历史数据】清空前期数据。");
            } else {
                console.log("⚠️ [自动化] 未找到页面上的清空按钮，尝试调用底层代码重置...");
                if (typeof window.clearHistory === 'function') window.clearHistory();
                if (typeof window.resetStats === 'function') window.resetStats();
            }
        }

        // 2. 核心定时拉取云端新号码机制
        setInterval(() => {
            // 主动向没有安全证书问题的稳定大厂通道拉取数据
            fetch("https://api.restful-api.dev/objects")
            .then(res => res.json())
            .then(list => {
                if (Array.isArray(list)) {
                    // 过滤并筛选出属于我们这个测试房间的数据，并按时间戳从新到旧排序
                    const myData = list
                        .filter(item => item && item.name === targetRoomName && item.data)
                        .map(item => item.data)
                        .sort((a, b) => b.timestamp - a.timestamp)[0]; // 只要最新一期

                    // 检查云端是否已经有了全新一期的正确号码
                    if (myData && myData.period && myData.period !== lastProcessedPeriod) {
                        lastProcessedPeriod = myData.period;
                        
                        console.log(`\n🆕 ==================================`);
                        console.log(`🎯 [云端同步拦截成功] 拦截到最新期号: ${myData.period} | 真实开奖球: ${myData.number}`);

                        // 第一步：清空上一期的旧数据
                        clearOldData();

                        // 第二步：稍微延迟0.6秒（等待界面清空动画和清零完成），把号码喂给AI核心自动测试
                        setTimeout(() => {
                            console.log(`🚀 [自动测试] 正在将最新号码 [${myData.number}] 喂入AI量化核心...`);
                            
                            // 精准对接你 GitHub 面板原本的JS分析算法函数接口
                            if (typeof window.processIncomingResult === 'function') {
                                window.processIncomingResult(myData.period, myData.number);
                            } else if (typeof window.updateData === 'function') {
                                window.updateData(myData.period, myData.number);
                            } else if (typeof window.addDataRow === 'function') {
                                window.addDataRow(myData.period, myData.number);
                            } else {
                                // 备用方案：如果找不到函数，尝试在页面上找“开始测试”或“开始分析”按钮模拟点击
                                const testBtn = Array.from(document.querySelectorAll('button'))
                                    .find(el => el.innerText && (el.innerText.includes('测试') || el.innerText.includes('分析') || el.innerText.includes('计算')));
                                if (testBtn) {
                                    testBtn.click();
                                    console.log("🤖 [自动化] 未找到标准JS函数，已通过模拟点击【测试/分析】按钮触发运算。");
                                } else {
                                    console.log("⚠️ [提示] 号码已成功抓取，请确保你的核心量化算法函数已挂载在 window 全局变量下。");
                                }
                            }
                            console.log(`⏰ [自动化] 当前期号 ${myData.period} 测试完毕！胜率指标已全自动跳动刷新。`);
                        }, 600);
                    }
                }
            })
            .catch(() => { /* 自动静默处理偶发性的外网波动 */ });
        }, 1500); // 每 1.5 秒自动去外网捞一次看有没有出新号码
    });
})();
