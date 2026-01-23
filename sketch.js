// Y-position of the floor (ground level)
let floorY3;

// --- Jump + bounce tuning ---
let jumpBuffer = 0;
let coyoteTime = 0;

const JUMP_BUFFER_FRAMES = 8;
const COYOTE_FRAMES = 8;

const HAPPY_BOUNCE = -2.2;
const BOUNCE_THRESHOLD = 1.5;

// Player character (soft, animated blob)
let blob3 = {
  x: 80,
  y: 0,

  r: 26,
  points: 48,
  wobble: 7,
  wobbleFreq: 0.9,

  t: 0,
  tSpeed: 0.012,

  vx: 0,
  vy: 0,

  accel: 0.7,
  maxRun: 4.8,
  gravity: 0.45,
  jumpV: -12.5,

  onGround: false,

  frictionGround: 0.92,
  frictionAir: 0.998,
};

let platforms = [];

function setup() {
  createCanvas(640, 360);
  floorY3 = height - 36;

  noStroke();
  textFont("sans-serif");
  textSize(14);

  platforms = [
    { x: 0, y: floorY3, w: width, h: height - floorY3 },
    { x: 120, y: floorY3 - 70, w: 120, h: 12 },
    { x: 300, y: floorY3 - 120, w: 90, h: 12 },
    { x: 440, y: floorY3 - 180, w: 130, h: 12 },
    { x: 520, y: floorY3 - 70, w: 90, h: 12 },
  ];

  blob3.y = floorY3 - blob3.r - 1;
}

function draw() {
  background(210, 235, 255);

  fill(255, 210, 160);
  for (const p of platforms) {
    rect(p.x, p.y, p.w, p.h, 6);
  }

  // --- Input ---
  let move = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) move -= 1;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) move += 1;
  blob3.vx += blob3.accel * move;

  blob3.vx *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vx = constrain(blob3.vx, -blob3.maxRun, blob3.maxRun);

  blob3.vy += blob3.gravity;

  // --- Jump buffer + coyote time ---
  if (blob3.onGround) {
    coyoteTime = COYOTE_FRAMES;
  } else {
    coyoteTime--;
  }
  jumpBuffer--;

  let box = {
    x: blob3.x - blob3.r,
    y: blob3.y - blob3.r,
    w: blob3.r * 2,
    h: blob3.r * 2,
  };

  // Horizontal collisions
  box.x += blob3.vx;
  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vx > 0) box.x = s.x - box.w;
      else if (blob3.vx < 0) box.x = s.x + s.w;
      blob3.vx = 0;
    }
  }

  // Vertical collisions
  box.y += blob3.vy;
  blob3.onGround = false;

  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vy > 0) {
        box.y = s.y - box.h;

        if (blob3.vy > BOUNCE_THRESHOLD) {
          blob3.vy = HAPPY_BOUNCE;
        } else {
          blob3.vy = 0;
        }

        blob3.onGround = true;
      } else if (blob3.vy < 0) {
        box.y = s.y + s.h;
        blob3.vy = 0;
      }
    }
  }

  // --- Execute buffered jump ---
  if (jumpBuffer > 0 && coyoteTime > 0) {
    blob3.vy = blob3.jumpV;
    blob3.onGround = false;
    jumpBuffer = 0;
  }

  if (blob3.onGround && abs(blob3.vx) < 0.1) {
    blob3.y += sin(frameCount * 0.1) * 0.2;
  }

  blob3.x = box.x + box.w / 2;
  blob3.y = box.y + box.h / 2;
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);

  blob3.t += blob3.tSpeed;
  drawBlobCircle(blob3);

  fill(0);
  text("Move: A/D or ←/→  •  Jump: Space/W/↑", 10, 18);
}

function overlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function drawBlobCircle(b) {
  fill(255, 170, 200);
  beginShape();

  const stretch = b.onGround ? 1.08 : 0.95;

  for (let i = 0; i < b.points; i++) {
    const a = (i / b.points) * TAU;
    const n = noise(
      cos(a) * b.wobbleFreq + 100,
      sin(a) * b.wobbleFreq + 100,
      b.t
    );

    const r = b.r * stretch + map(n, 0, 1, -b.wobble, b.wobble);
    vertex(b.x + cos(a) * r, b.y + sin(a) * r);
  }

  endShape(CLOSE);
}

// --- Jump input (buffered) ---
function keyPressed() {
  if (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) {
    jumpBuffer = JUMP_BUFFER_FRAMES;
  }
}

