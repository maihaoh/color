// 替换你 GitHub 源码中原本的定时拉取部分：
setInterval(() => {
    // 同样指向新的稳定中转服务
    fetch("https://api.restful-api.dev/objects")
    .then(res => res.json())
    .then(list => {
        if (Array.isArray(list)) {
            // 筛选出属于我们这个房间的数据包
            const myData = list.filter(item => item.name === "wingo_ai_test_room_2026")
                              .map(item => item.data)
                              .sort((a, b) => b.timestamp - a.timestamp)[0]; // 拿最新的一期

            if (myData && myData.period && myData.period !== lastProcessedPeriod) {
                lastProcessedPeriod = myData.period;
                
                console.log(`🎯 [云端同步成功] 拦截到新期号: ${myData.period} | 号码: ${myData.number}`);
                
                // 执行你的清空旧数据与注入测试逻辑
                clearOldData(); 
                
                setTimeout(() => {
                    if (typeof window.processIncomingResult === 'function') {
                        window.processIncomingResult(myData.period, myData.number);
                    }
                }, 600);
            }
        }
    })
    .catch(() => {});
}, 1500);
