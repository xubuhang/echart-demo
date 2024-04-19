const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const echarts = require('echarts');
const { createCanvas } = require('canvas');

const configPath = path.resolve(process.cwd(), './appConfig.json');
const hostName = '0.0.0.0';
let port = 8989; // 默认端口号

if (fs.existsSync(configPath)) {
    const cfg = require(configPath);
    port = cfg.port || port;
} else {
    console.log('未找到配置文件appConfig.json，使用默认端口号：' + port);
}

// 在 5.3.0 之前的版本中，你必须要通过该接口注册 canvas 实例创建方法。 
// 从 5.3.0 开始就不需要了 
echarts.setPlatformAPI({ 
  // 同老版本的 setCanvasCreator 
  createCanvas() { 
    return createCanvas(); 
  }, 
  loadImage(src, onload, onerror) { 
    const img = new Image(); 
    // 必须要绑定 this context. 
    img.onload = onload.bind(img); 
    img.onerror = onerror.bind(img); 
    img.src = src; 
    return img; 
  } 
}); 

function renderChart(config) {
    const { option, width = 800, height = 600 } = config;
    const canvas = createCanvas(width, height);
    const chart = echarts.init(canvas);
    chart.setOption(option);
    const buffer = canvas.toBuffer('image/png');
    chart.dispose();
    return buffer;
}

function processConfig(request, response, callback) {
    let queryData = '';
    if (typeof callback !== 'function') {
        return null;
    }

    if (request.method === 'GET') {
        const arg = url.parse(request.url, true).query;
        if (!arg.config) {
            response.end('request parameter "config" invalid');
            return;
        }
        request.config = arg.config;
        callback();
    } else {
        request.on('data', function (data) {
            queryData += data;
            if (queryData.length > 1e6) {
                response.end('request body too large');
            }
        });
        request.on('end', function () {
            request.config = queryData;
            callback();
        });
    }
}

const server = http.createServer(function (request, response) {
    processConfig(request, response, function () {
        let config;
        try {
            config = JSON.parse(request.config);
        } catch (e) {
            response.end('request parameter "config" format invalid, is not JSON');
            return;
        }

        if (!config || !config.option) {
            response.end('request parameter "config" format invalid');
            return;
        }

        const buffer = renderChart(config);
        response.setHeader('Content-Type', 'image/png');
        response.write(buffer);
        response.end();
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use`);
    } else {
        console.log(err);
    }
});

server.listen(port, hostName, function () {
    console.log(`server started at port ${port}`);
});