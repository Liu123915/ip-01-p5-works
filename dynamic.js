/* ============================================================
   运动轨迹 · 交互动态作品（p5.js）
   ------------------------------------------------------------
   交互（作业要求至少 2 种，这里 3 种）：
     1. 移动鼠标 / 拖动手指 → 沿途落下马卡龙色泡泡，慢慢褪色成轨迹
     2. 点击 / 轻触        → 在原地爆发一圈更大的泡泡
     3. 空格键             → 清屏重来
   配色：白底 + 3 个马卡龙色（樱粉 / 天蓝 / 淡紫），共 4 色

   画法 v2（回应"像墨水、没有泡泡质感"的反馈）：
   · 弃用正片叠底——叠太多层会把颜色压成脏灰，改成普通透明叠加，
     重叠处只轻微加深，每个泡泡的颜色始终看得清；
   · 每个泡泡用径向渐变画成球体：受光面偏左上、中心薄而透、
     边缘因折射而颜色最深，再勾一圈细边 + 一道白色高光弧，
     让它是"一颗泡泡"而不是"一滩墨水"。
   ============================================================ */

// 三个马卡龙色：都很浅、很透，叠起来才有那种软的感觉
const MACARON_COLORS = [
  [255, 225, 235], // 樱粉
  [215, 240, 255], // 天蓝
  [235, 225, 255], // 淡紫
];

let bubbles = []; // 场上所有存活的泡泡
const MAX_BUBBLES = 220; // 上限：超过就回收最旧的，保证不掉帧

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(2, displayDensity()));
  background(255);
  noStroke();
  setupDemo();
}

function draw() {
  updateDemo();
  // 白底每帧只盖 10% 的透明度：旧泡泡慢慢褪成一道轨迹
  background(255, 255, 255, 10);

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];

    // 逐渐变淡，淡到 0 就回收
    // 演示模式（?demo=1）下褪色更慢，投屏 / 截图时轨迹能留住
    bubble.alpha -= demoMode ? 0.0018 : 0.005;
    if (bubble.alpha <= 0) {
      bubbles.splice(i, 1);
      continue;
    }

    // 微弱呼吸：每个泡泡相位不同，所以不会整齐划一地缩放
    bubble.breath = sin(frameCount * 0.025 + bubble.phase) * 0.08 + 1;

    drawBubble(bubble);
  }

  drawHUD();
}

/* ---------- 立体泡泡：径向渐变球体 + 折射细边 + 高光弧 ---------- */
function drawBubble(b) {
  const r = b.r * b.breath;
  const c = b.col;
  const a = constrain(b.alpha, 0, 1);
  // 同色加深：模拟泡泡边缘的折射，颜色深一点但仍是本来的色相
  const deep = [c[0] * 0.74, c[1] * 0.74, c[2] * 0.74];
  const rgba = (col, alpha) =>
    `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${alpha.toFixed(3)})`;

  // 1) 球体：径向渐变的圆心偏向左上（受光方向）
  //    中心薄而透 → 主体淡彩 → 边缘最深，泡泡的体积感就来自这个梯度
  const grad = drawingContext.createRadialGradient(
    b.x - r * 0.32, b.y - r * 0.32, r * 0.05,
    b.x, b.y, r
  );
  grad.addColorStop(0, rgba(c, a * 0.16));   // 受光面：几乎透到纸面
  grad.addColorStop(0.62, rgba(c, a * 0.42)); // 主体
  grad.addColorStop(0.88, rgba(c, a * 0.66)); // 靠边开始变浓
  grad.addColorStop(1, rgba(deep, a * 0.9));  // 边缘折射最深
  drawingContext.fillStyle = grad;
  drawingContext.beginPath();
  drawingContext.arc(b.x, b.y, r, 0, TWO_PI);
  drawingContext.fill();

  // 2) 折射细边：勾出泡泡的薄膜轮廓
  drawingContext.strokeStyle = rgba(deep, a * 0.75);
  drawingContext.lineWidth = Math.max(1, r * 0.028);
  drawingContext.beginPath();
  drawingContext.arc(b.x, b.y, r - 0.5, 0, TWO_PI);
  drawingContext.stroke();

  // 3) 高光弧：左上方一小段白弧，泡泡"有光"的关键
  drawingContext.strokeStyle = `rgba(255,255,255,${(a * 0.85).toFixed(3)})`;
  drawingContext.lineWidth = Math.max(1.5, r * 0.05);
  drawingContext.lineCap = "round";
  drawingContext.beginPath();
  drawingContext.arc(b.x, b.y, r * 0.72, PI * 1.05, PI * 1.45);
  drawingContext.stroke();
}

/* ---------- 交互 1：移动就落下泡泡（鼠标 / 手指通用） ---------- */
function mouseMoved() {
  scatterBubbles(mouseX, mouseY, 1, 44, 120);
  return false;
}

function touchMoved() {
  scatterBubbles(mouseX, mouseY, 1, 44, 120);
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
      alpha: 0.85,          // 出生时的不透明度（渐变会在此基础上分层）
      phase: random(TWO_PI), // 呼吸的起始相位
      breath: 1,
    });
  }
  // 超出上限就回收最旧的，防止长轨迹把帧率拖垮
  if (bubbles.length > MAX_BUBBLES) {
    bubbles.splice(0, bubbles.length - MAX_BUBBLES);
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
    for (let i = 0; i < 120; i++) {
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
  if (demoTick % 6 === 0) {
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
