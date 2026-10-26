/* ============================================================
   几何构成（静态）—— 只用形状、颜色、位置
   规则：不写 draw() 循环，画面在 setup() 里一次性画完
   配色：5 个颜色（米白 / 墨黑 / 蓝 / 橙 / 黄），第 6 个近似色已合并
   ============================================================ */

// 全局配色表：只有 5 个颜色，全篇都用它
const PAPER = [242, 234, 210]; // 米白：纸感底色
const INK = [20, 20, 22]; // 墨黑：结构骨架
const BLUE = [96, 136, 168]; // 灰蓝：冷调主体
const ORANGE = [232, 74, 22]; // 橘红：视觉重心
const YELLOW = [246, 188, 72]; // 明黄：点缀

function setup() {
  createCanvas(380, 570); // 竖构图，手机屏幕也能完整显示
  noStroke();
  drawBackgroundBands(); // 1. 背景垂直分割板
  drawLeftCircles(5); // 2. 左侧循环圆（for 循环生成）
  drawRightCircles(4); // 3. 右侧渐大圆（for 循环生成）
  drawStackedCircles(); // 4. 上层叠压圆，制造层次
  drawAccentLines(); // 5. 少量线条与方块收边
}

/* ---------- 1. 背景分割板：把画面切成四条竖带 ---------- */
function drawBackgroundBands() {
  fill(...INK);
  rect(0, 0, 90, height); // 左侧墨黑竖条

  fill(...PAPER);
  rect(90, 0, 30, height); // 米白窄条（呼吸口）

  fill(...BLUE);
  rect(120, 0, 220, height); // 中部灰蓝主面

  fill(...INK);
  rect(340, 0, 40, height); // 右侧墨黑压边
}

/* ---------- 2. 左侧循环圆：一圈比一圈大、一圈比一圈低 ---------- */
function drawLeftCircles(count) {
  for (let i = 0; i < count; i++) {
    const x = 60 + i * 42; // 圆心右移
    const y = 110 + i * 70; // 圆心下沉
    const d = 50 + i * 16; // 直径递增

    // 三色循环：橘红 → 明黄 → 墨黑
    if (i % 3 === 0) fill(...ORANGE);
    else if (i % 3 === 1) fill(...YELLOW);
    else fill(...INK);

    ellipse(x, y, d, d);
  }
}

/* ---------- 3. 右侧循环圆：双色交替，形成节奏 ---------- */
function drawRightCircles(count) {
  for (let j = 0; j < count; j++) {
    const x = 180 + j * 50;
    const y = 180 + j * 85;
    const d = 70 + j * 22;

    // 双色交替：橘红 / 米白
    if (j % 2 === 0) fill(...ORANGE);
    else fill(...PAPER);

    ellipse(x, y, d, d);
  }
}

/* ---------- 4. 上层叠压圆：压住前面的秩序，制造包豪斯式层次 ---------- */
function drawStackedCircles() {
  fill(...PAPER);
  ellipse(270, 130, 140, 140);

  fill(...BLUE);
  ellipse(300, 240, 170, 170);

  fill(...INK);
  ellipse(320, 420, 150, 150);

  fill(...YELLOW);
  ellipse(220, 380, 110, 110);
}

/* ---------- 5. 收边：两条竖线 + 一个小方块 ---------- */
function drawAccentLines() {
  stroke(...INK);
  strokeWeight(3);
  line(120, 80, 120, 260);
  line(340, 120, 340, 300);

  noStroke();
  fill(...ORANGE);
  rect(180, 500, 40, 40);
}
