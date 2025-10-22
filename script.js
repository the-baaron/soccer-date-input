const formContainer = document.getElementById("formContainer");
const gameContainer = document.getElementById("gameContainer");
const nameInput = document.getElementById("nameInput");
const birthDateInput = document.getElementById("birthDateInput");
const submitBtn = document.getElementById("submitBtn");
const gameOnTitle = document.getElementById("gameOnTitle");
const pitch = document.getElementById("pitch");
const player = document.getElementById("player");
const aiPlayer = document.getElementById("aiPlayer");
const ball = document.getElementById("ball");
const playerNameDisplay = document.getElementById("playerNameDisplay");
const dateValueDisplay = document.getElementById("dateValue");
const aiDateValueDisplay = document.getElementById("aiDateValue");
const overlay = document.getElementById("overlay");
const overlayMessage = document.getElementById("overlayMessage");
const overlayButton = document.getElementById("overlayButton");

let gameActive = false;

const PITCH_WIDTH = 800;
const PITCH_HEIGHT = 500;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 24;
const BALL_SIZE = 30;
const NUMBER_SIZE = 50;
const KICK_DISTANCE = 50;
const KICK_FORCE = 10;
const FRICTION = 0.98;
const WALL_BOUNCE = 0.7;

let playerX = 100;
let playerY = (PITCH_HEIGHT - PLAYER_HEIGHT) / 2;
let playerVx = 0;
let playerVy = 0;
let playerAngle = 0;
let aiPlayerX = PITCH_WIDTH - 100 - PLAYER_WIDTH;
let aiPlayerY = (PITCH_HEIGHT - PLAYER_HEIGHT) / 2;
let aiPlayerVx = 0;
let aiPlayerVy = 0;
let aiPlayerAngle = 0;
let ballX = PITCH_WIDTH / 2 - BALL_SIZE / 2;
let ballY = PITCH_HEIGHT / 2 - BALL_SIZE / 2;
let ballVx = 0;
let ballVy = 0;
let ballPatternX = 0;
let ballPatternY = 0;
let ballLastKicker = "player";
let dateInput = "";
let aiDateInput = "";
let numbers = [];
let keys = {};
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let aiMode = "wander";
let aiModeTimer = 0;
let aiWanderDx = 0;
let aiWanderDy = 0;
let playerHasMoved = false;

function init() {
  dateInput = "";
  aiDateInput = "";
  playerHasMoved = false;
  updateDateDisplay();
  updateAIDateDisplay();
  playerX = 100;
  playerY = (PITCH_HEIGHT - PLAYER_HEIGHT) / 2;
  playerVx = 0;
  playerVy = 0;
  aiPlayerX = PITCH_WIDTH - 100 - PLAYER_WIDTH;
  aiPlayerY = (PITCH_HEIGHT - PLAYER_HEIGHT) / 2;
  aiPlayerVx = 0;
  aiPlayerVy = 0;
  ballX = PITCH_WIDTH / 2 - BALL_SIZE / 2;
  ballY = PITCH_HEIGHT / 2 - BALL_SIZE / 2;
  ballVx = 0;
  ballVy = 0;
  ballPatternX = 0;
  ballPatternY = 0;

  document.querySelectorAll(".number").forEach((el) => el.remove());
  numbers = [];

  for (let i = 0; i <= 9; i++) {
    const numberEl = document.createElement("div");
    numberEl.className = "number";
    numberEl.textContent = i;

    let x, y, attempts = 0;
    let validPosition = false;

    while (!validPosition && attempts < 100) {
      const edge = Math.floor(Math.random() * 4);
      const margin = 20;

      if (edge === 0) {
        x = Math.random() * (PITCH_WIDTH - NUMBER_SIZE);
        y = margin;
      } else if (edge === 1) {
        x = PITCH_WIDTH - NUMBER_SIZE - margin;
        y = Math.random() * (PITCH_HEIGHT - NUMBER_SIZE);
      } else if (edge === 2) {
        x = Math.random() * (PITCH_WIDTH - NUMBER_SIZE);
        y = PITCH_HEIGHT - NUMBER_SIZE - margin;
      } else {
        x = margin;
        y = Math.random() * (PITCH_HEIGHT - NUMBER_SIZE);
      }

      validPosition = true;
      for (let j = 0; j < numbers.length; j++) {
        const dx = x - numbers[j].x;
        const dy = y - numbers[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80) {
          validPosition = false;
          break;
        }
      }
      attempts++;
    }

    numberEl.style.left = x + "px";
    numberEl.style.top = y + "px";

    pitch.appendChild(numberEl);
    numbers.push({ element: numberEl, x, y, value: i });
  }

  updatePlayer();
  updateAIPlayer();
  updateBall();
}

function updateDateDisplay() {
  if (!dateInput) {
    dateValueDisplay.textContent = "dd-mm-yyyy";
    birthDateInput.value = "";
    return;
  }

  let formatted = "";
  for (let i = 0; i < 8; i++) {
    if (i === 2 || i === 4) {
      formatted += "-";
    }
    formatted += dateInput[i] || "_";
  }
  dateValueDisplay.textContent = formatted;
  birthDateInput.value = formatted;
}

function updateAIDateDisplay() {
  if (!aiDateInput) {
    aiDateValueDisplay.textContent = "dd-mm-yyyy";
    return;
  }

  let formatted = "";
  for (let i = 0; i < 8; i++) {
    if (i === 2 || i === 4) {
      formatted += "-";
    }
    formatted += aiDateInput[i] || "_";
  }
  aiDateValueDisplay.textContent = formatted;
}

function updatePlayer() {
  player.style.left = playerX + "px";
  player.style.top = playerY + "px";
  player.style.transform = `rotate(${playerAngle + 90}deg)`;
}

function updateAIPlayer() {
  aiPlayer.style.left = aiPlayerX + "px";
  aiPlayer.style.top = aiPlayerY + "px";
  aiPlayer.style.transform = `rotate(${aiPlayerAngle + 90}deg)`;
}

function updateBall() {
  ball.style.left = ballX + "px";
  ball.style.top = ballY + "px";
  ball.style.backgroundPosition = `${ballPatternX}px ${ballPatternY}px`;
}

function updateAI() {
  if (!playerHasMoved) {
    return;
  }

  const acceleration = 0.25;
  const maxSpeed = 3.5;
  const friction = 0.88;

  aiModeTimer++;
  const timeLimit = aiMode === "wander" ? 120 : 120;

  if (aiModeTimer > timeLimit) {
    aiModeTimer = 0;
    if (aiMode === "wander") {
      aiMode = "chase";
    } else {
      aiMode = "wander";
      aiWanderDx = (Math.random() - 0.5) * 2;
      aiWanderDy = (Math.random() - 0.5) * 2;
    }
  }

  let dx = 0;
  let dy = 0;

  if (aiMode === "chase") {
    const ballCenterX = ballX + BALL_SIZE / 2;
    const ballCenterY = ballY + BALL_SIZE / 2;
    const aiCenterX = aiPlayerX + PLAYER_WIDTH / 2;
    const aiCenterY = aiPlayerY + PLAYER_HEIGHT / 2;

    dx = ballCenterX - aiCenterX;
    dy = ballCenterY - aiCenterY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 5) {
      dx /= distance;
      dy /= distance;
    }
  } else {
    dx = aiWanderDx;
    dy = aiWanderDy;
  }

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;

    aiPlayerVx += dx * acceleration;
    aiPlayerVy += dy * acceleration;

    const speed = Math.sqrt(aiPlayerVx * aiPlayerVx + aiPlayerVy * aiPlayerVy);
    if (speed > maxSpeed) {
      aiPlayerVx = (aiPlayerVx / speed) * maxSpeed;
      aiPlayerVy = (aiPlayerVy / speed) * maxSpeed;
    }

    aiPlayerAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  } else {
    aiPlayerVx *= friction;
    aiPlayerVy *= friction;

    if (Math.abs(aiPlayerVx) < 0.1) aiPlayerVx = 0;
    if (Math.abs(aiPlayerVy) < 0.1) aiPlayerVy = 0;
  }

  aiPlayerX += aiPlayerVx;
  aiPlayerY += aiPlayerVy;

  aiPlayerX = Math.max(0, Math.min(PITCH_WIDTH - PLAYER_WIDTH, aiPlayerX));
  aiPlayerY = Math.max(0, Math.min(PITCH_HEIGHT - PLAYER_HEIGHT, aiPlayerY));

  checkPlayerCollision();

  updateAIPlayer();
  checkAIKick();
}

function checkKick() {
  const playerCenterX = playerX + PLAYER_WIDTH / 2;
  const playerCenterY = playerY + PLAYER_HEIGHT / 2;
  const ballCenterX = ballX + BALL_SIZE / 2;
  const ballCenterY = ballY + BALL_SIZE / 2;

  const dx = ballCenterX - playerCenterX;
  const dy = ballCenterY - playerCenterY;

  const angleRad = (playerAngle * Math.PI) / 180;
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);
  const rotatedDx = dx * cos - dy * sin;
  const rotatedDy = dx * sin + dy * cos;

  const ellipseRadiusX = 35;
  const ellipseRadiusY = 20;

  const normalizedDistance =
    (rotatedDx * rotatedDx) / (ellipseRadiusX * ellipseRadiusX) +
    (rotatedDy * rotatedDy) / (ellipseRadiusY * ellipseRadiusY);

  if (normalizedDistance <= 1) {
    const angle = Math.atan2(dy, dx);
    const kickVx = Math.cos(angle) * KICK_FORCE;
    const kickVy = Math.sin(angle) * KICK_FORCE;

    const playerSpeed = Math.sqrt(playerVx * playerVx + playerVy * playerVy);
    if (playerSpeed > 0.5) {
      ballVx = kickVx + playerVx * 0.2;
      ballVy = kickVy + playerVy * 0.2;
      ballLastKicker = "player";
    } else if (ballVx === 0 && ballVy === 0) {
      ballVx = kickVx;
      ballVy = kickVy;
      ballLastKicker = "player";
    }
  }
}

function checkPlayerCollision() {
  const p1CenterX = playerX + PLAYER_WIDTH / 2;
  const p1CenterY = playerY + PLAYER_HEIGHT / 2;
  const p2CenterX = aiPlayerX + PLAYER_WIDTH / 2;
  const p2CenterY = aiPlayerY + PLAYER_HEIGHT / 2;

  const dx = p2CenterX - p1CenterX;
  const dy = p2CenterY - p1CenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = (PLAYER_WIDTH + PLAYER_HEIGHT) / 2;

  if (distance < minDistance) {
    const overlap = minDistance - distance;
    const angle = Math.atan2(dy, dx);

    const pushX = Math.cos(angle) * overlap / 2;
    const pushY = Math.sin(angle) * overlap / 2;

    playerX -= pushX;
    playerY -= pushY;
    aiPlayerX += pushX;
    aiPlayerY += pushY;

    playerX = Math.max(0, Math.min(PITCH_WIDTH - PLAYER_WIDTH, playerX));
    playerY = Math.max(0, Math.min(PITCH_HEIGHT - PLAYER_HEIGHT, playerY));
    aiPlayerX = Math.max(0, Math.min(PITCH_WIDTH - PLAYER_WIDTH, aiPlayerX));
    aiPlayerY = Math.max(0, Math.min(PITCH_HEIGHT - PLAYER_HEIGHT, aiPlayerY));
  }
}

function checkAIKick() {
  const aiCenterX = aiPlayerX + PLAYER_WIDTH / 2;
  const aiCenterY = aiPlayerY + PLAYER_HEIGHT / 2;
  const ballCenterX = ballX + BALL_SIZE / 2;
  const ballCenterY = ballY + BALL_SIZE / 2;

  const dx = ballCenterX - aiCenterX;
  const dy = ballCenterY - aiCenterY;

  const angleRad = (aiPlayerAngle * Math.PI) / 180;
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);
  const rotatedDx = dx * cos - dy * sin;
  const rotatedDy = dx * sin + dy * cos;

  const ellipseRadiusX = 35;
  const ellipseRadiusY = 20;

  const normalizedDistance =
    (rotatedDx * rotatedDx) / (ellipseRadiusX * ellipseRadiusX) +
    (rotatedDy * rotatedDy) / (ellipseRadiusY * ellipseRadiusY);

  if (normalizedDistance <= 1) {
    const angle = Math.atan2(dy, dx);
    const kickVx = Math.cos(angle) * KICK_FORCE;
    const kickVy = Math.sin(angle) * KICK_FORCE;

    const aiSpeed = Math.sqrt(aiPlayerVx * aiPlayerVx + aiPlayerVy * aiPlayerVy);
    if (aiSpeed > 0.5) {
      ballVx = kickVx + aiPlayerVx * 0.2;
      ballVy = kickVy + aiPlayerVy * 0.2;
      ballLastKicker = "ai";
    } else if (ballVx === 0 && ballVy === 0) {
      ballVx = kickVx;
      ballVy = kickVy;
      ballLastKicker = "ai";
    }
  }
}

function updateBallPhysics() {
  if (ballVx !== 0 || ballVy !== 0) {
    ballX += ballVx;
    ballY += ballVy;

    ballPatternX += ballVx;
    ballPatternY += ballVy;

    checkBallPlayerCollision();

    ballVx *= FRICTION;
    ballVy *= FRICTION;

    if (Math.abs(ballVx) < 0.1) ballVx = 0;
    if (Math.abs(ballVy) < 0.1) ballVy = 0;

    if (ballX <= 0) {
      ballX = 0;
      ballVx = Math.abs(ballVx) * WALL_BOUNCE;
    }
    if (ballX >= PITCH_WIDTH - BALL_SIZE) {
      ballX = PITCH_WIDTH - BALL_SIZE;
      ballVx = -Math.abs(ballVx) * WALL_BOUNCE;
    }
    if (ballY <= 0) {
      ballY = 0;
      ballVy = Math.abs(ballVy) * WALL_BOUNCE;
    }
    if (ballY >= PITCH_HEIGHT - BALL_SIZE) {
      ballY = PITCH_HEIGHT - BALL_SIZE;
      ballVy = -Math.abs(ballVy) * WALL_BOUNCE;
    }

    updateBall();
    checkNumberCollision();
  }
}

function checkBallPlayerCollision() {
  const ballCenterX = ballX + BALL_SIZE / 2;
  const ballCenterY = ballY + BALL_SIZE / 2;

  const players = [
    { x: playerX, y: playerY, vx: playerVx, vy: playerVy },
    { x: aiPlayerX, y: aiPlayerY, vx: aiPlayerVx, vy: aiPlayerVy }
  ];

  for (let p of players) {
    const pCenterX = p.x + PLAYER_WIDTH / 2;
    const pCenterY = p.y + PLAYER_HEIGHT / 2;

    const dx = ballCenterX - pCenterX;
    const dy = ballCenterY - pCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = BALL_SIZE / 2 + (PLAYER_WIDTH + PLAYER_HEIGHT) / 4;

    if (distance < minDistance) {
      const overlap = minDistance - distance;
      const angle = Math.atan2(dy, dx);

      ballX += Math.cos(angle) * overlap;
      ballY += Math.sin(angle) * overlap;

      const speed = Math.sqrt(ballVx * ballVx + ballVy * ballVy);
      if (speed > 0.5) {
        ballVx = Math.cos(angle) * speed * WALL_BOUNCE;
        ballVy = Math.sin(angle) * speed * WALL_BOUNCE;
      }
    }
  }
}

function checkNumberCollision() {
  const ballCenterX = ballX + BALL_SIZE / 2;
  const ballCenterY = ballY + BALL_SIZE / 2;

  for (let i = numbers.length - 1; i >= 0; i--) {
    const num = numbers[i];
    const numCenterX = num.x + NUMBER_SIZE / 2;
    const numCenterY = num.y + NUMBER_SIZE / 2;

    const distance = Math.sqrt(
      Math.pow(ballCenterX - numCenterX, 2) +
        Math.pow(ballCenterY - numCenterY, 2)
    );

    if (distance < (BALL_SIZE + NUMBER_SIZE) / 2) {
      if (ballLastKicker === "player") {
        dateInput += num.value;
        updateDateDisplay();
        if (dateInput.length === 8) {
          validateDate("player");
        }
      } else {
        aiDateInput += num.value;
        updateAIDateDisplay();
        if (aiDateInput.length === 8) {
          validateDate("ai");
        }
      }

      let newX, newY, attempts = 0;
      let validPosition = false;

      while (!validPosition && attempts < 100) {
        const edge = Math.floor(Math.random() * 4);
        const margin = 20;

        if (edge === 0) {
          newX = Math.random() * (PITCH_WIDTH - NUMBER_SIZE);
          newY = margin;
        } else if (edge === 1) {
          newX = PITCH_WIDTH - NUMBER_SIZE - margin;
          newY = Math.random() * (PITCH_HEIGHT - NUMBER_SIZE);
        } else if (edge === 2) {
          newX = Math.random() * (PITCH_WIDTH - NUMBER_SIZE);
          newY = PITCH_HEIGHT - NUMBER_SIZE - margin;
        } else {
          newX = margin;
          newY = Math.random() * (PITCH_HEIGHT - NUMBER_SIZE);
        }

        validPosition = true;
        for (let j = 0; j < numbers.length; j++) {
          if (j === i) continue;
          const dx = newX - numbers[j].x;
          const dy = newY - numbers[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            validPosition = false;
            break;
          }
        }
        attempts++;
      }

      num.x = newX;
      num.y = newY;
      num.element.style.left = newX + "px";
      num.element.style.top = newY + "px";

      break;
    }
  }
}

function validateDate(winner) {
  const input = winner === "player" ? dateInput : aiDateInput;
  const day = parseInt(input.substring(0, 2));
  const month = parseInt(input.substring(2, 4));
  const year = parseInt(input.substring(4, 8));

  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  const formattedDate = `${input.substring(0, 2)}-${input.substring(2, 4)}-${input.substring(4, 8)}`;
  const playerName = nameInput.value.trim() || "You";
  const winnerName = winner === "player" ? playerName : "AI";

  if (isValid) {
    overlayMessage.textContent = `${winnerName} win! Valid date: ${formattedDate}`;
  } else {
    overlayMessage.textContent = `${winnerName} completed first but invalid date: ${formattedDate}`;
  }

  gameActive = false;
  overlay.classList.remove("hidden");
}

function gameLoop() {
  if (!gameActive) return;

  const acceleration = 0.3;
  const maxSpeed = 4;
  const friction = 0.88;
  let dx = 0;
  let dy = 0;

  if (mouseDown) {
    const playerCenterX = playerX + PLAYER_WIDTH / 2;
    const playerCenterY = playerY + PLAYER_HEIGHT / 2;
    const diffX = mouseX - playerCenterX;
    const diffY = mouseY - playerCenterY;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    if (distance > 5) {
      dx = diffX / distance;
      dy = diffY / distance;
    }
  } else {
    if (keys["ArrowUp"]) {
      dy = -1;
    }
    if (keys["ArrowDown"]) {
      dy = 1;
    }
    if (keys["ArrowLeft"]) {
      dx = -1;
    }
    if (keys["ArrowRight"]) {
      dx = 1;
    }
  }

  if (dx !== 0 || dy !== 0) {
    playerHasMoved = true;

    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;

    playerVx += dx * acceleration;
    playerVy += dy * acceleration;

    const speed = Math.sqrt(playerVx * playerVx + playerVy * playerVy);
    if (speed > maxSpeed) {
      playerVx = (playerVx / speed) * maxSpeed;
      playerVy = (playerVy / speed) * maxSpeed;
    }

    const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    let angleDiff = targetAngle - (playerAngle % 360);

    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    playerAngle += angleDiff;
  } else {
    playerVx *= friction;
    playerVy *= friction;

    if (Math.abs(playerVx) < 0.1) playerVx = 0;
    if (Math.abs(playerVy) < 0.1) playerVy = 0;
  }

  const currentSpeed = Math.sqrt(playerVx * playerVx + playerVy * playerVy);
  if (currentSpeed > 0.5 && (dx === 0 && dy === 0)) {
    const targetAngle = Math.atan2(playerVy, playerVx) * (180 / Math.PI);
    let angleDiff = targetAngle - (playerAngle % 360);

    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    playerAngle += angleDiff;
  }

  playerX += playerVx;
  playerY += playerVy;

  playerX = Math.max(0, Math.min(PITCH_WIDTH - PLAYER_WIDTH, playerX));
  playerY = Math.max(0, Math.min(PITCH_HEIGHT - PLAYER_HEIGHT, playerY));

  checkPlayerCollision();

  updatePlayer();
  checkKick();
  updateAI();
  updateBallPhysics();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    keys[e.key] = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    keys[e.key] = false;
  }
});

overlayButton.addEventListener("click", () => {
  overlay.classList.add("hidden");
  gameContainer.classList.add("hidden");
  formContainer.classList.remove("expanding");
  formContainer.style.display = "block";
  gameActive = false;
  document.body.style.background = "#f5f5f5";
  birthDateInput.value = "";
  init();
});

birthDateInput.addEventListener("focus", () => {
  if (gameActive) return;

  gameActive = true;
  const playerName = nameInput.value.trim() || "You";
  playerNameDisplay.textContent = playerName;

  formContainer.classList.add("expanding");
  gameContainer.classList.remove("hidden");
  gameContainer.classList.add("appearing");
  document.body.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  setTimeout(() => {
    formContainer.style.display = "none";
    init();
    gameLoop();

    gameOnTitle.classList.remove("hidden");
    gameOnTitle.classList.add("showing");
  }, 200);
});

pitch.addEventListener("mousedown", (e) => {
  mouseDown = true;
  const rect = pitch.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

document.addEventListener("mousemove", (e) => {
  if (mouseDown && gameActive) {
    const rect = pitch.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }
});

document.addEventListener("mouseup", () => {
  mouseDown = false;
});

pitch.addEventListener("touchstart", (e) => {
  e.preventDefault();
  mouseDown = true;
  const rect = pitch.getBoundingClientRect();
  const touch = e.touches[0];
  mouseX = touch.clientX - rect.left;
  mouseY = touch.clientY - rect.top;
});

pitch.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (mouseDown) {
    const rect = pitch.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
  }
});

pitch.addEventListener("touchend", () => {
  mouseDown = false;
});

nameInput.addEventListener("input", () => {
  if (nameInput.value.trim()) {
    birthDateInput.disabled = false;
    submitBtn.disabled = false;
  } else {
    birthDateInput.disabled = true;
    submitBtn.disabled = true;
  }
});
