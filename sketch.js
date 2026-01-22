// Y-position of the floor (ground level)
let floorY3;

// Player character (soft, animated blob)
let blob3 = {
  // Position (centre of the blob)
  x: 80,
  y: 0,

  // Visual properties
  r: 26, // Base radius
  points: 48, // Number of points used to draw the blob
  wobble: 7, // Edge deformation amount
  wobbleFreq: 0.9,

  // Time values for breathing animation
  t: 0,
  tSpeed: 0.012,

  // Physics: velocity
  vx: 0, // Horizontal velocity
  vy: 0, // Vertical velocity

  // Movement tuning
  accel: 0.7,
  maxRun: 4.8,
  gravity: 0.45, // Downward force
  jumpV: -12.5, // Initial jump impulse

  // State
  onGround: false, // True when standing on a platform

  // Friction
  frictionGround: 0.92,
  frictionAir: 0.998,
};

// List of solid platforms the blob can stand on
// Each platform is an axis-aligned rectangle (AABB)
let platforms = [];

function setup() {
  createCanvas(640, 360);

  // Define the floor height
  floorY3 = height - 36;

  noStroke();
  textFont("sans-serif");
  textSize(14);

  // Create platforms (floor + steps)
  platforms = [
    { x: 0, y: floorY3, w: width, h: height - floorY3 }, // floor
    { x: 120, y: floorY3 - 70, w: 120, h: 12 }, // low step
    { x: 300, y: floorY3 - 120, w: 90, h: 12 }, // mid step
    { x: 440, y: floorY3 - 180, w: 130, h: 12 }, // high step
    { x: 520, y: floorY3 - 70, w: 90, h: 12 }, // return ramp
  ];

  // Start the blob resting on the floor
  blob3.y = floorY3 - blob3.r - 1;
}

function draw() {
  background(210, 235, 255); // calm happy sky

  // --- Draw all platforms ---
  fill(255, 210, 160); // happy warm platforms
  for (const p of platforms) {
    rect(p.x, p.y, p.w, p.h, 6);
  }

  // --- Input: left/right movement ---
  let move = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) move -= 1; // A or ←
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) move += 1; // D or →
  blob3.vx += blob3.accel * move;

  // --- Apply friction and clamp speed ---
  blob3.vx *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vx = constrain(blob3.vx, -blob3.maxRun, blob3.maxRun);

  // --- Apply gravity ---
  blob3.vy += blob3.gravity;

  // --- Collision representation ---
  // We collide using a rectangle (AABB),
  // even though the blob is drawn as a circle
  let box = {
    x: blob3.x - blob3.r,
    y: blob3.y - blob3.r,
    w: blob3.r * 2,
    h: blob3.r * 2,
  };

  // --- STEP 1: Move horizontally, then resolve X collisions ---
  box.x += blob3.vx;
  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vx > 0) {
        // Moving right → hit the left side of a platform
        box.x = s.x - box.w;
      } else if (blob3.vx < 0) {
        // Moving left → hit the right side of a platform
        box.x = s.x + s.w;
      }
      blob3.vx = 0;
    }
  }

  // --- STEP 2: Move vertically, then resolve Y collisions ---
  box.y += blob3.vy;
  blob3.onGround = false;

  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vy > 0) {
        // Falling → land on top of a platform
        box.y = s.y - box.h;
        blob3.vy = -2.2;
        blob3.onGround = true;
      } else if (blob3.vy < 0) {
        // Rising → hit the underside of a platform
        box.y = s.y + s.h;
        blob3.vy = 0;
      }
    }
  }

  if (blob3.onGround && abs(blob3.vx) < 0.1) {
    blob3.y += sin(frameCount * 0.1) * 0.3;
  }

  // --- Convert collision box back to blob centre ---
  blob3.x = box.x + box.w / 2;
  blob3.y = box.y + box.h / 2;

  // Keep blob inside the canvas horizontally
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);

  // --- Draw the animated blob ---
  blob3.t += blob3.tSpeed;
  drawBlobCircle(blob3);

  // --- HUD ---
  fill(0);
  text("Move: A/D or ←/→  •  Jump: Space/W/↑  •  Land on platforms", 10, 18);
}

// Axis-Aligned Bounding Box (AABB) overlap test
// Returns true if rectangles a and b intersect
function overlap(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// Draws the blob using Perlin noise for a soft, breathing effect
function drawBlobCircle(b) {
  fill(255, 170, 200); // happy pink
  beginShape();

  const stretch = b.onGround ? 1.08 : 0.95;

  for (let i = 0; i < b.points; i++) {
    const a = (i / b.points) * TAU;

    // Noise-based radius offset
    const n = noise(
      cos(a) * b.wobbleFreq + 100,
      sin(a) * b.wobbleFreq + 100,
      b.t,
    );

    const r = b.r * stretch + map(n, 0, 1, -b.wobble, b.wobble);

    vertex(b.x + cos(a) * r, b.y + sin(a) * r);
  }

  endShape(CLOSE);
}

// Jump input (only allowed when grounded)
function keyPressed() {
  if (
    (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) &&
    blob3.onGround
  ) {
    blob3.vy = blob3.jumpV;
    blob3.onGround = false;
  }
}

/* In-class tweaks for experimentation:
   • Add a new platform:
     platforms.push({ x: 220, y: floorY3 - 150, w: 80, h: 12 });

   • “Ice” feel → frictionGround = 0.95
   • “Sand” feel → frictionGround = 0.80
*/
