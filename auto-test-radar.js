// auto-test-radar.js (已停止介入 UI，仅保留调试打印)
window.addEventListener('message', function(event) {
    if (event.data && event.data.source === 'WINGO_RADAR_BRIDGE') {
        console.log("🔍 [雷达调试] 接收器已放行数据，由 index.html 处理...");
    }
});
