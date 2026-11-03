/* ============================================================
   运动轨迹 · 交互动态作品（p5.js）
   ------------------------------------------------------------
   交互（作业要求至少 2 种，这里 3 种）：
     1. 移动鼠标 / 拖动手指 → 沿途落下马卡龙色泡泡，慢慢褪色成轨迹
     2. 点击 / 轻触        → 在原地爆发一圈更大的泡泡
     3. 空格键             → 清屏重来
   配色：白底 + 3 个马卡龙色（樱粉 / 天蓝 / 淡紫），共 4 色
   混合：MULTIPLY，泡泡叠在一起的地方会压出更深的透叠层次
   ============================================================ */

// 三个马卡龙色：都很浅、很透，叠起来才有那种软的感觉
const MACARON_COLORS = [
  [255, 225, 235], // 樱粉
  [215, 240, 255], // 天蓝
  [235, 225, 255], // 淡紫
];

let bubbles = []; // 场上所有存活的泡泡

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(2, displayDensity()));
  background(255);
  noStroke();
  setupDemo();
}

function draw() {
  updateDemo();
  // 白底每帧只盖 12% 的透明度：旧泡泡不会一下子消失，而是慢慢褪成一道轨迹
  background(255, 255, 255, 12);

  // 正片叠底：泡泡重叠处颜色更深，形成一层层的透叠关系
  blendMode(MULTIPLY);

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];

    // 逐渐变淡，淡到 0 就回收，避免越积越多导致掉帧
    // 演示模式（?demo=1）下褪色放慢，投屏 / 截图时轨迹能留住
    bubble.alpha -= demoMode ? 0.1 : 0.45;
    if (bubble.alpha <= 0) {
      bubbles.splice(i, 1);
      continue;
    }

    // 微弱呼吸：每个泡泡相位不同，所以不会整齐划一地缩放
    const breath = sin(frameCount * 0.025 + bubble.phase) * 0.08 + 1;

    fill(bubble.col[0], bubble.col[1], bubble.col[2], bubble.alpha);
    ellipse(bubble.x, bubble.y, bubble.r * breath);
  }

  blendMode(BLEND);
  drawHUD();
}

/* ---------- 交互 1：移动就落下泡泡（鼠标 / 手指通用） ---------- */
function mouseMoved() {
  scatterBubbles(mouseX, mouseY, 2, 50, 140);
  return false;
}

function touchMoved() {
  scatterBubbles(mouseX, mouseY, 2, 50, 140);
  return false;
}

/* ---------- 交互 2：点击 / 轻触，原地爆发一圈更大的泡泡 ---------- */
function mousePressed() {
  scatterBubbles(mouseX, mouseY, 8, 90, 220);
  return false;
}

function touchStarted() {
  scatterBubbles(mouseX, mouseY, 8, 90, 220);
  return false;
}

/* ---------- 交互 3：空格清屏，重新开始 ---------- */
function keyPressed() {
  if (key === " ") {
    bubbles = [];
    background(255);
    return false;
  }
}

/* ---------- 泡泡生成器：位置带一点随机偏移，大小在区间内随机 ---------- */
function scatterBubbles(x, y, count, minRadius, maxRadius) {
  for (let i = 0; i < count; i++) {
    bubbles.push({
      x: x + random(-25, 25),
      y: y + random(-25, 25),
      r: random(minRadius, maxRadius),
      col: random(MACARON_COLORS),
      alpha: 45,
      phase: random(TWO_PI), // 呼吸的起始相位
    });
  }
}

/* ---------- 左下角操作提示 ---------- */
function drawHUD() {
  noStroke();
  fill(120, 120, 128, 150);
  textSize(13);
  textAlign(LEFT, BOTTOM);
  text("移动鼠标留下泡泡 · 点击爆发 · 空格清屏", 22, height - 20);
}

/* ---------- 窗口变化时重设画布，避免出现滚动条与错位 ---------- */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(255);
}

/* ---------- 演示模式：网址带 ?demo=1 时，自动沿一条漫游路径落泡泡 ----------
   用途：投屏演示、截图、无人操作时也能看到画面动起来 */
let demoMode = false;
let demoX = 0, demoY = 0, demoAngle = 0, demoTick = 0;

function setupDemo() {
  demoMode = location.search.indexOf("demo") > -1;
  demoX = width * 0.3;
  demoY = height * 0.45;
  if (demoMode) {
    // 开场先沿一条随机游走曲线铺好一整条轨迹，第一眼就有画面
    let px = width * 0.28, py = height * 0.4, angle = 0;
    for (let i = 0; i < 170; i++) {
      angle += random(-0.32, 0.32);
      px += cos(angle) * 18;
      py += sin(angle) * 18;
      if (px < 80 || px > width - 80 || py < 80 || py > height - 80) {
        px = random(width * 0.2, width * 0.8);
        py = random(height * 0.2, height * 0.8);
        angle = random(TWO_PI);
      }
      scatterBubbles(px, py, 1, 46, 130);
    }
  }
}

function updateDemo() {
  if (!demoMode) return;
  demoTick++;
  if (demoTick % 4 === 0) {
    // 随机游走：慢慢转弯，轨迹像一条柔和的曲线
    demoAngle += random(-0.35, 0.35);
    demoX += cos(demoAngle) * 26;
    demoY += sin(demoAngle) * 26;
    // 走出画面就回到中间
    if (demoX < 60 || demoX > width - 60 || demoY < 60 || demoY > height - 60) {
      demoX = width * 0.5;
      demoY = height * 0.5;
      demoAngle = random(TWO_PI);
    }
    scatterBubbles(demoX, demoY, 2, 50, 140);
    // 偶尔来一次爆发，画面更有节奏
    if (demoTick % 120 === 0) scatterBubbles(demoX, demoY, 6, 90, 200);
  }
}
