const fs = require('fs');
const echarts = require('echarts');
const { createCanvas } = require('canvas');

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

const canvas = createCanvas(800, 600);

let chart = echarts.init(canvas);

function renderChart(option){
  chart.setOption(option);
  return canvas
}

let option = {
  backgroundColor:"#fff",
  xAxis: {
    type: "value",
  },
  yAxis: {
    type: "category",
    data: ["足球","篮球","乒乓球","跳绳","健步走","呼啦圈", "踢毽","霹雳舞",],
  },
  series: [
    {
      name: "参与人数",
      type: "bar",
      data: [100, 90, 80, 70, 10, 50, 40, 30, 20, 50],
    },
  ],
};

//获取渲染后的画布
const buffer =  renderChart(option).toBuffer('image/png');
// 如果不再需要图表，调用 dispose 以释放内存
chart.dispose();
chart = null;
fs.writeFileSync('C:/Users/xubh/Downloads/examples/images/chart.png', buffer);

