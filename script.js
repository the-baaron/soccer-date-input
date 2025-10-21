const pitch = document.getElementById("pitch");
const player = document.getElementById("player");
const ball = document.getElementById("ball");
const scoreboard = document.getElementById("scoreboard");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMain = document.getElementById("overlay-main");
const overlaySub = document.getElementById("overlay-sub");
const numbers = document.querySelectorAll(".number");

let keys = {};
let score = "";
let ballVelocity = { x: 0, y: 0 };
let playerVelocity = { x: 0, y: 0 };
let lastNumberHit = null;

const playerRadius = 40;
const ballRadius = 20;

document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function randomizeNumbers() {
  const digits = [...Array(10).keys()].sort(() => Math.random() - 0.5);
  numbers.forEach((num, i) => (num.textContent = digits[i]));
}

function initGame() {
  randomizeNumbers();
  score = "";
  scoreboard.textContent = "Enter date (DDMMYYYY):";
  playerVelocity = { x: 0, y: 0 };
  ballVelocity = { x: 0, y: 0 };
  lastNumberHit = null;

  setCenter(player, 150, pitch.clientHeight / 2);
  setCenter(ball, 250, pitch.clientHeight / 2);
}

function getCenter(el) {
  const rect = el.getBoundingClientRect();
  const parent = pitch.getBoundingClientRect();
  return {
    x: rect.left - parent.left + rect.width / 2,
    y: rect.top - parent.top + rect.height / 2,
  };
}

function setCenter(el, cx, cy) {
  el.style.left = cx - el.offsetWidth / 2 + "px";
  el.style.top = cy - el.offsetHeight / 2 + "px";
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function movePlayer() {
  const pos = getCenter(player);
  const playerSpeed = 0.5;
  const friction = 0.9;

  if (keys["ArrowUp"]) playerVelocity.y -= playerSpeed;
  if (keys["ArrowDown"]) playerVelocity.y += playerSpeed;
  if (keys["ArrowLeft"]) playerVelocity.x -= playerSpeed;
  if (keys["ArrowRight"]) playerVelocity.x += playerSpeed;

  playerVelocity.x *= friction;
  playerVelocity.y *= friction;

  pos.x += playerVelocity.x;
  pos.y += playerVelocity.y;

  pos.x = Math.max(playerRadius, Math.min(pitch.clientWidth - playerRadius, pos.x));
  pos.y = Math.max(playerRadius, Math.min(pitch.clientHeight - playerRadius, pos.y));

  setCenter(player, pos.x, pos.y);

  const ballPos = getCenter(ball);
  const d = distance(pos, ballPos);
  if (d < playerRadius + ballRadius - 5) {
    const dx = ballPos.x - pos.x;
    const dy = ballPos.y - pos.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    ballVelocity.x = (dx / len) * 6;
    ballVelocity.y = (dy / len) * 6;
  }
}

function moveBall() {
  let pos = getCenter(ball);
  pos.x += ballVelocity.x;
  pos.y += ballVelocity.y;

  if (pos.x - ballRadius < 0) {
    pos.x = ballRadius + 1;
    ballVelocity.x = Math.abs(ballVelocity.x) || 1;
  }
  if (pos.x + ballRadius > pitch.clientWidth) {
    pos.x = pitch.clientWidth - ballRadius - 1;
    ballVelocity.x = -Math.abs(ballVelocity.x) || -1;
  }
  if (pos.y - ballRadius < 0) {
    pos.y = ballRadius + 1;
    ballVelocity.y = Math.abs(ballVelocity.y) || 1;
  }
  if (pos.y + ballRadius > pitch.clientHeight) {
    pos.y = pitch.clientHeight - ballRadius - 1;
    ballVelocity.y = -Math.abs(ballVelocity.y) || -1;
  }

  ballVelocity.x *= 0.985;
  ballVelocity.y *= 0.985;
  if (Math.abs(ballVelocity.x) < 0.05) ballVelocity.x = 0;
  if (Math.abs(ballVelocity.y) < 0.05) ballVelocity.y = 0;

  setCenter(ball, pos.x, pos.y);
  checkNumberHit();
}

function checkNumberHit() {
  const ballRect = ball.getBoundingClientRect();
  let hitSomething = false;

  numbers.forEach((num) => {
    const numRect = num.getBoundingClientRect();
    const overlap = !(
      ballRect.right < numRect.left ||
      ballRect.left > numRect.right ||
      ballRect.bottom < numRect.top ||
      ballRect.top > numRect.bottom
    );

    if (overlap) {
      hitSomething = true;
      if (lastNumberHit !== num) {
        addDigit(num.textContent);
        lastNumberHit = num;
      }
    }
  });

  if (!hitSomething) lastNumberHit = null;
}

function addDigit(n) {
  if (score.length >= 8) return;
  score += n;
  scoreboard.textContent = "Date: " + formatDate(score);
  if (score.length === 8) validateDate();
}

function formatDate(s) {
  if (s.length <= 2) return s;
  if (s.length <= 4) return `${s.slice(0, 2)}/${s.slice(2)}`;
  return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4)}`;
}

function validateDate() {
  const d = score.slice(0, 2);
  const m = score.slice(2, 4);
  const y = score.slice(4);
  const date = new Date(`${y}-${m}-${d}`);
  const valid =
    date &&
    date.getFullYear() == y &&
    date.getMonth() + 1 == parseInt(m) &&
    date.getDate() == parseInt(d);
  valid ? showConfirm() : showInvalid();
}

function showInvalid() {
  overlay.style.display = "flex";
  overlayTitle.textContent = "Invalid date";
  overlayMain.textContent = "Try again";
  overlaySub.textContent = "";
  overlayMain.onclick = resetGame;
}

function showConfirm() {
  overlay.style.display = "flex";
  overlayTitle.textContent = "Please confirm";
  overlayMain.textContent = "Start over";
  overlaySub.textContent = "Submit";
  overlayMain.onclick = resetGame;
  overlaySub.onclick = () => {
    overlay.style.display = "none";
    scoreboard.textContent = "🎉 Submitted: " + formatDate(score);
  };
}

function resetGame() {
  overlay.style.display = "none";
  initGame();
}

function loop() {
  movePlayer();
  moveBall();
  requestAnimationFrame(loop);
}

initGame();
loop();
