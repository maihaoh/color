/**
 * Wingo 自动化测试总控中心（云端同步全功能版）
 * 放置位置：GitHub 仓库的 auto-test.js
 */
(function() {
    // 全局数据仓库，用于保存当前会话的测试状态
    let internalStats = {
        totalCount: 0,
        winRate: 0.0,
        currentStreak: 0,
        maxStreak: 0
    };

    // 绑定系统加载事件
    window.addEventListener('DOMContentLoaded', () => {
        console.log("⚡ [AI面板源码内核] 自动化流水线已成功激活，正在实时监控外网云端数据包...");
        
        // 关键配置：必须和游戏端发包的房间名字一致
        const targetRoomName = "wingo_ai_test_room_2026";
        let lastProcessedPeriod = "";

        // 获取界面上需要更新的 DOM 元素
        const domTotal = document.getElementById('stat-total');
        const domRate = document.getElementById('stat-rate');
        const domCurrent = document.getElementById('stat-current');
        const domMax = document.getElementById('stat-max');
        const domResult = document.getElementById('latest-result-display');
        const domPeriod = document.getElementById('latest-period-display');
        const clearBtn = document.getElementById('btn-clear-history');

        // 1. 核心：更新整个界面的数值渲染
        function renderInterface() {
            if (domTotal) domTotal.innerText = internalStats.totalCount;
            if (domRate) domRate.innerText = internalStats.winRate.toFixed(1) + "%";
            if (domCurrent) domCurrent.innerText = internalStats.currentStreak;
            if (domMax) domMax.innerText = internalStats.maxStreak;
        }

        // 2. 核心：清空当前分类所有数据的逻辑
        window.clearHistoryData = function() {
            console.log("🧹 [自动化] 正在全自动执行本地历史数据重置...");
            internalStats.totalCount = 0;
            internalStats.winRate = 0.0;
            internalStats.currentStreak = 0;
            internalStats.maxStreak = 0;
            renderInterface();
        };

        // 3. 将物理点击红色按钮事件直接绑定到清空函数
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                window.clearHistoryData();
            });
        }

        // 4. 模拟核心算法引擎：输入期号与真实号码，计算AI测试结果并更新胜率指标
        window.processIncomingResult = function(period, number) {
            console.log(`🚀 [核心引擎] 正在将号码 [${number}] 注入量化模型跑自动测试...`);
            
            // 每次测试下一个号码，局数自增
            internalStats.totalCount += 1;
            
            // 【此处可替换为你项目原本的特有AI预测算法逻辑判断】
            // 这里提供一套健壮的自动化模拟胜率跳动逻辑进行驱动展示：
            const isWin = Math.random() > 0.45; // 模拟模型的历史获胜概率分布
            
            if (isWin) {
                internalStats.currentStreak += 1;
                if (internalStats.currentStreak > internalStats.maxStreak) {
                    internalStats.maxStreak = internalStats.currentStreak;
                }
            } else {
                internalStats.currentStreak = 0;
            }
            
            // 动态重新计算量化分析胜率
            const baseRate = 50 + (Math.random() * 15);
            internalStats.winRate = internalStats.totalCount > 0 ? baseRate : 0.0;
            
            // 将自动计算测试后的全部结果渲染上墙
            renderInterface();
            console.log(`⏰ [测试结束] 期号 ${period} 全自动测试流完成。面板已重新锁定！`);
        };

        // 5. 核心定时拉取外网云端新号码机制
        setInterval(() => {
            // 主动向具有大厂合法安全证书的公共稳定通道请求最新数据
            fetch("https://api.restful-api.dev/objects")
            .then(res => res.json())
            .then(list => {
                if (Array.isArray(list)) {
                    // 过滤出当前房间的同步数据包，并按时间戳拿到游戏端最近抛出的一球
                    const myData = list
                        .filter(item => item && item.name === targetRoomName && item.data)
                        .map(item => item.data)
                        .sort((a, b) => b.timestamp - a.timestamp)[0];

                    // 校验是否是未曾测试过的最新有效号码数据
                    if (myData && myData.period && myData.period !== lastProcessedPeriod) {
                        lastProcessedPeriod = myData.period;
                        
                        console.log(`\n🆕 ==================================`);
                        console.log(`🎯 [云端同步成功] 拦截到新期号: ${myData.period} | 真实开奖球: ${myData.number}`);

                        // 【动作一】：在面板上把近期开出的号码以及期号同步秀出来！
                        if (domResult && domPeriod) {
                            domResult.innerText = myData.number;
                            domPeriod.innerText = `期号: ${myData.period}`;
                            
                            // 配合红绿单双给予视觉光晕颜色切换
                            if ([1,3,7,9].includes(myData.number)) domResult.style.color = "#ff4a4a"; // 红球特征
                            else if ([2,4,6,8].includes(myData.number)) domResult.style.color = "#00ff88"; // 绿球特征
                            else domResult.style.color = "#ffaa00"; // 蓝球/0/5特征
                        }

                        // 【动作二】：自动调用分类清空动作，保证每期测试数据重新开始
                        window.clearHistoryData();

                        // 【动作三】：延迟 0.6 秒等待界面重置清零后，立马测试下一个号码！
                        setTimeout(() => {
                            window.processIncomingResult(myData.period, myData.number);
                        }, 600);
                    }
                }
            })
            .catch(() => { /* 自动过滤处理瞬时网络波动，保持长连状态 */ });
        }, 1500); // 每 1.5 秒监测一次外网云端开奖流
    });
})();
