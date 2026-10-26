/* ============================================================
   运动轨迹（交互动态）—— 必须有 draw() 循环 + 至少 2 种交互
   ------------------------------------------------------------
   四种交互（超过作业要求的 2 种）：
     1. 鼠标 / 手指移动 → 牵引粒子（吸引或排斥）
     2. 点击 / 轻触      → 从指尖爆发一圈新粒子
     3. 空格键          → 切换「吸引 / 排斥」模式
     4. R 键            → 清空重来
   配色沿用《几何构成》的 5 个颜色：墨黑 / 米白 / 蓝 / 橙 / 黄
   ============================================================ */

const INK = [20, 20, 22];
const PAPER = [242, 234, 210];
const BLUE = [96, 136, 168];
const ORANGE = [232, 74, 22];
const YELLOW = [246, 188, 72];

// 粒子可能取的颜色（底色墨黑不参与，保证粒子看得见）
const PARTICLE_COLORS = [ORANGE, YELLOW, BLUE, PAPER];

const BASE_COUNT = 80; // 常态保持的粒子数
const MAX_COUNT = 300; // 上限，防止狂点卡顿
const TRAIL_LENGTH = 16; // 每个粒子保留的轨迹点数量
const MOUSE_RANGE = 280; // 鼠标影响半径（像素）
const MAX_SPEED = 4.5; // 速度上限，防止飞出去

let particles = [];
let attractMode = true; // true = 吸过来，false = 推出去

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(...INK);
  for (let i = 0; i < BASE_COUNT; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
}

/* ---------- 粒子类：负责自己的运动、轨迹、绘制 ---------- */
class Particle {
  constructor(x, y, boost = 1) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.6, 2.2) * boost);
    this.color = random(PARTICLE_COLORS);
    this.size = random(2.6, 6.2);
    this.trail = []; // 轨迹点队列
    this.life = 255; // 生命值，归零后重生
  }

  update() {
    // 1) 记录轨迹点
    this.trail.push({ x: this.pos.x, y: this.pos.y });
    if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

    // 2) 鼠标 / 手指牵引
    const d = dist(this.pos.x, this.pos.y, mouseX, mouseY);
    if (mouseX > 0 && mouseY > 0 && d < MOUSE_RANGE && d > 2) {
      const pull = (1 - d / MOUSE_RANGE) * 0.3; // 越近力越大
      const dir = createVector(mouseX - this.pos.x, mouseY - this.pos.y);
      dir.normalize();
      if (attractMode) this.vel.add(dir.mult(pull));
      else this.vel.sub(dir.mult(pull * 1.5));
    }

    // 3) 阻尼 + 限速 + 位移
    this.vel.mult(0.986);
    this.vel.limit(MAX_SPEED);
    this.pos.add(this.vel);

    // 4) 出界回绕（从另一边回来，不会堆在边缘）
    if (this.pos.x < -30) this.pos.x = width + 30;
    if (this.pos.x > width + 30) this.pos.x = -30;
    if (this.pos.y < -30) this.pos.y = height + 30;
    if (this.pos.y > height + 30) this.pos.y = -30;

    // 5) 生命衰减：耗尽就换个地方重生，画面永不静止
    this.life -= 1;
    if (this.life <= 0) {
      this.pos.set(random(width), random(height));
      this.vel = p5.Vector.random2D().mult(random(0.6, 2));
      this.trail = [];
      this.life = random(180, 420);
    }
  }

  show() {
    // 轨迹：越靠近头部越亮越粗
    noFill();
    for (let i = 1; i < this.trail.length; i++) {
      const prev = this.trail[i - 1];
      const cur = this.trail[i];
      const t = i / this.trail.length;
      stroke(this.color[0], this.color[1], this.color[2], 150 * t * t);
      strokeWeight(this.size * (0.15 + 0.85 * t));
      line(prev.x, prev.y, cur.x, cur.y);
    }

    // 粒子本体：一点点柔光，让轨迹有“头”
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], 90);
    circle(this.pos.x, this.pos.y, this.size * 3.2);
    fill(this.color[0], this.color[1], this.color[2], 240);
    circle(this.pos.x, this.pos.y, this.size);
  }
}

/* ---------- 主循环 ---------- */
function draw() {
  // 半透明覆盖：上一帧的痕迹慢慢变暗，于是形成拖尾余晖
  noStroke();
  fill(INK[0], INK[1], INK[2], 32);
  rect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
  }

  // 数量不足就补回来
  while (particles.length < BASE_COUNT) {
    particles.push(new Particle(random(width), random(height)));
  }

  drawHUD();
}

/* ---------- 屏幕左下角的操作提示 ---------- */
function drawHUD() {
  const modeText = attractMode ? "吸引" : "排斥";
  noStroke();
  fill(PAPER[0], PAPER[1], PAPER[2], 150);
  textSize(13);
  textAlign(LEFT, BOTTOM);
  text(
    `模式：${modeText}（空格切换）  ·  点击爆发  ·  R 重置  ·  粒子 ${particles.length}`,
    22,
    height - 20
  );

  // 左上角标题（避开返回按钮）
  fill(PAPER[0], PAPER[1], PAPER[2], 110);
  textSize(12);
  textAlign(LEFT, TOP);
  text("运动轨迹 · 刘晓茹", 22, 58);
}

/* ---------- 交互 1 & 2：点击爆发 ---------- */
function mousePressed() {
  burst(mouseX, mouseY, 18);
  return false;
}

function touchStarted() {
  burst(mouseX, mouseY, 18);
  return false;
}

function burst(x, y, count) {
  for (let i = 0; i < count; i++) {
    const p = new Particle(x, y, 2.4);
    // 让爆发方向呈放射状，看起来像“炸开”
    const angle = (TWO_PI / count) * i + random(-0.15, 0.15);
    p.vel = p5.Vector.fromAngle(angle).mult(random(2.2, 5.4));
    particles.push(p);
  }
  // 超出上限就丢掉最早的
  while (particles.length > MAX_COUNT) particles.shift();
}

/* ---------- 交互 3 & 4：键盘 ---------- */
function keyPressed() {
  if (key === " ") {
    attractMode = !attractMode;
    // 切换时给个视觉反馈：原地爆一小圈
    burst(width / 2, height / 2, 8);
    return false;
  }
  if (key === "r" || key === "R") {
    particles = [];
    background(...INK);
    for (let i = 0; i < BASE_COUNT; i++) {
      particles.push(new Particle(random(width), random(height)));
    }
    return false;
  }
}

/* ---------- 窗口大小变化时重设画布，避免错位 ---------- */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(...INK);
}
