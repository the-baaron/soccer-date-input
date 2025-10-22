const formContainer = document.getElementById("formContainer");
const gameContainer = document.getElementById("gameContainer");
const nameInput = document.getElementById("nameInput");
const birthDateInput = document.getElementById("birthDateInput");
const difficultySelect = document.getElementById("difficultySelect");
const submitBtn = document.getElementById("submitBtn");
const gameOnTitle = document.getElementById("gameOnTitle");
const pitch = document.getElementById("pitch");
const player = document.getElementById("player");
const teammatePlayer = document.getElementById("teammatePlayer");
const aiPlayer = document.getElementById("aiPlayer");
const aiPlayer2 = document.getElementById("aiPlayer2");
const ball = document.getElementById("ball");
const playerNameDisplay = document.getElementById("playerNameDisplay");
const dateValueDisplay = document.getElementById("dateValue");
const aiDateValueDisplay = document.getElementById("aiDateValue");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const changeDateButton = document.getElementById("changeDateButton");
const selectDateButton = document.getElementById("selectDateButton");

let gameActive = false;
let easyMode = false;
let teamMode = false;
let selectedDate = "";

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

class AIPlayer {
  constructor(element, startX, startY, team) {
    this.element = element;
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.mode = "wander";
    this.modeTimer = 0;
    this.wanderDx = 0;
    this.wanderDy = 0;
    this.team = team;
    this.initialX = startX;
    this.initialY = startY;
  }

  reset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.mode = "wander";
    this.modeTimer = 0;
    this.wanderDx = 0;
    this.wanderDy = 0;
  }

  update() {
    if (!playerHasMoved) return;

    const acceleration = 0.25;
    const maxSpeed = 3.5;
    const friction = 0.88;

    this.modeTimer++;
    const timeLimit = this.mode === "wander" ? 90 : 180;

    if (this.modeTimer > timeLimit) {
      this.modeTimer = 0;
      if (this.mode === "wander") {
        this.mode = "chase";
      } else {
        this.mode = "wander";
        this.wanderDx = (Math.random() - 0.5) * 2;
        this.wanderDy = (Math.random() - 0.5) * 2;
      }
    }

    let dx = 0;
    let dy = 0;

    if (this.mode === "chase") {
      const ballCenterX = ballX + BALL_SIZE / 2;
      const ballCenterY = ballY + BALL_SIZE / 2;
      const aiCenterX = this.x + PLAYER_WIDTH / 2;
      const aiCenterY = this.y + PLAYER_HEIGHT / 2;

      dx = ballCenterX - aiCenterX;
      dy = ballCenterY - aiCenterY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        dx /= distance;
        dy /= distance;
      }
    } else {
      dx = this.wanderDx;
      dy = this.wanderDy;
    }

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;

      this.vx += dx * acceleration;
      this.vy += dy * acceleration;

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
    } else {
      this.vx *= friction;
      this.vy *= friction;

      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      if (Math.abs(this.vy) < 0.1) this.vy = 0;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.x = Math.max(0, Math.min(PITCH_WIDTH - PLAYER_WIDTH, this.x));
    this.y = Math.max(0, Math.min(PITCH_HEIGHT - PLAYER_HEIGHT, this.y));

    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";
    this.element.style.transform = `rotate(${this.angle + 90}deg)`;
  }

  updatePosition() {
    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";
    this.element.style.transform = `rotate(${this.angle + 90}deg)`;
  }

  checkKick() {
    const aiCenterX = this.x + PLAYER_WIDTH / 2;
    const aiCenterY = this.y + PLAYER_HEIGHT / 2;
    const ballCenterX = ballX + BALL_SIZE / 2;
    const ballCenterY = ballY + BALL_SIZE / 2;

    const dx = ballCenterX - aiCenterX;
    const dy = ballCenterY - aiCenterY;

    const angleRad = (this.angle * Math.PI) / 180;
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

      const aiSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (aiSpeed > 0.5) {
        ballVx = kickVx + this.vx * 0.2;
        ballVy = kickVy + this.vy * 0.2;
        ballLastKicker = this.team;
      } else if (ballVx === 0 && ballVy === 0) {
        ballVx = kickVx;
        ballVy = kickVy;
        ballLastKicker = this.team;
      }
    }
  }
}

let playerX = 100;
let playerY = (PITCH_HEIGHT - PLAYER_HEIGHT) / 2;
let playerVx = 0;
let playerVy = 0;
let playerAngle = 0;
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
let playerHasMoved = false;

let aiPlayers = [];
let teammate = null;

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
  ballX = PITCH_WIDTH / 2 - BALL_SIZE / 2;
  ballY = PITCH_HEIGHT / 2 - BALL_SIZE / 2;
  ballVx = 0;
  ballVy = 0;
  ballPatternX = 0;
  ballPatternY = 0;

  aiPlayers = [];
  teammate = null;

  if (teamMode) {
    teammate = new AIPlayer(
      teammatePlayer,
      150,
      (PITCH_HEIGHT - PLAYER_HEIGHT) / 2 + 100,
      "player"
    );
    aiPlayers.push(
      new AIPlayer(
        aiPlayer,
        PITCH_WIDTH - 100 - PLAYER_WIDTH,
        (PITCH_HEIGHT - PLAYER_HEIGHT) / 2,
        "ai"
      )
    );
    aiPlayers.push(
      new AIPlayer(
        aiPlayer2,
        PITCH_WIDTH - 150 - PLAYER_WIDTH,
        (PITCH_HEIGHT - PLAYER_HEIGHT) / 2 + 100,
        "ai"
      )
    );
  } else if (!easyMode) {
    aiPlayers.push(
      new AIPlayer(
        aiPlayer,
        PITCH_WIDTH - 100 - PLAYER_WIDTH,
        (PITCH_HEIGHT - PLAYER_HEIGHT) / 2,
        "ai"
      )
    );
  }

  document.querySelectorAll(".number").forEach((el) => el.remove());
  numbers = [];

  for (let i = 0; i <= 9; i++) {
    const numberEl = document.createElement("div");
    numberEl.className = "number";
    numberEl.textContent = i;

    let x,
      y,
      attempts = 0;
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
  aiPlayers.forEach((ai) => ai.updatePosition());
  if (teammate) teammate.updatePosition();
  updateBall();
  updateNumberVisibility();
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
  updateNumberVisibility();
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
  updateNumberVisibility();
}

function updatePlayer() {
  player.style.left = playerX + "px";
  player.style.top = playerY + "px";
  player.style.transform = `rotate(${playerAngle + 90}deg)`;
}

function updateBall() {
  ball.style.left = ballX + "px";
  ball.style.top = ballY + "px";
  ball.style.backgroundPosition = `${ballPatternX}px ${ballPatternY}px`;
}

function getValidNumbers(input) {
  const position = input.length;
  const validNumbers = [];

  if (position === 0) {
    validNumbers.push(0, 1, 2, 3);
  } else if (position === 1) {
    const firstDigit = parseInt(input[0]);
    if (firstDigit === 0) {
      validNumbers.push(1, 2, 3, 4, 5, 6, 7, 8, 9);
    } else if (firstDigit === 1 || firstDigit === 2) {
      validNumbers.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
    } else if (firstDigit === 3) {
      validNumbers.push(0, 1);
    }
  } else if (position === 2) {
    validNumbers.push(0, 1);
  } else if (position === 3) {
    const thirdDigit = parseInt(input[2]);
    if (thirdDigit === 0) {
      validNumbers.push(1, 2, 3, 4, 5, 6, 7, 8, 9);
    } else if (thirdDigit === 1) {
      validNumbers.push(0, 1, 2);
    }
  } else if (position === 4) {
    validNumbers.push(1, 2);
  } else if (position === 5) {
    validNumbers.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
  } else if (position === 6) {
    validNumbers.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
  } else if (position === 7) {
    validNumbers.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
  }

  return validNumbers;
}

function updateNumberVisibility() {
  const playerValid = getValidNumbers(dateInput);
  const aiValid = easyMode ? [] : getValidNumbers(aiDateInput);

  numbers.forEach((num) => {
    const validForPlayer = playerValid.includes(num.value);
    const validForAI = aiValid.includes(num.value);

    num.element.classList.remove("player-only", "ai-only", "both-valid");

    if (easyMode) {
      if (validForPlayer) {
        num.element.style.display = "flex";
      } else {
        num.element.style.display = "none";
      }
    } else {
      if (validForPlayer && validForAI) {
        num.element.style.display = "flex";
        num.element.classList.add("both-valid");
      } else if (validForPlayer) {
        num.element.style.display = "flex";
        num.element.classList.add("player-only");
      } else if (validForAI) {
        num.element.style.display = "flex";
        num.element.classList.add("ai-only");
      } else {
        num.element.style.display = "none";
      }
    }
  });
}

function updateAI() {
  aiPlayers.forEach((ai) => {
    ai.update();
    ai.checkKick();
  });
}

function updateTeammate() {
  if (teammate) {
    teammate.update();
    teammate.checkKick();
  }
}

function updateAI2() {}

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
  if (easyMode) return;

  const p1CenterX = playerX + PLAYER_WIDTH / 2;
  const p1CenterY = playerY + PLAYER_HEIGHT / 2;
  const minDistance = (PLAYER_WIDTH + PLAYER_HEIGHT) / 2;

  const allAI = [...aiPlayers];
  if (teammate) allAI.push(teammate);

  for (const ai of allAI) {
    const p2CenterX = ai.x + PLAYER_WIDTH / 2;
    const p2CenterY = ai.y + PLAYER_HEIGHT / 2;

    const dx = p2CenterX - p1CenterX;
    const dy = p2CenterY - p1CenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      const overlap = minDistance - distance;
      const angle = Math.atan2(dy, dx);

      const pushX = (Math.cos(angle) * overlap) / 2;
      const pushY = (Math.sin(angle) * overlap) / 2;

      playerX -= pushX;
      playerY -= pushY;
      ai.x += pushX;
      ai.y += pushY;

      playerX = Math.max(0, Math.min(PITCH_WIDTH - PLAYER_WIDTH, playerX));
      playerY = Math.max(0, Math.min(PITCH_HEIGHT - PLAYER_HEIGHT, playerY));
      ai.x = Math.max(0, Math.min(PITCH_WIDTH - PLAYER_WIDTH, ai.x));
      ai.y = Math.max(0, Math.min(PITCH_HEIGHT - PLAYER_HEIGHT, ai.y));
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

  const players = [{ x: playerX, y: playerY, vx: playerVx, vy: playerVy }];

  if (!easyMode) {
    aiPlayers.forEach((ai) => {
      players.push({ x: ai.x, y: ai.y, vx: ai.vx, vy: ai.vy });
    });
    if (teammate) {
      players.push({
        x: teammate.x,
        y: teammate.y,
        vx: teammate.vx,
        vy: teammate.vy,
      });
    }
  }

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

    if (num.element.style.display === "none") {
      continue;
    }

    const numCenterX = num.x + NUMBER_SIZE / 2;
    const numCenterY = num.y + NUMBER_SIZE / 2;

    const distance = Math.sqrt(
      Math.pow(ballCenterX - numCenterX, 2) +
        Math.pow(ballCenterY - numCenterY, 2)
    );

    if (distance < (BALL_SIZE + NUMBER_SIZE) / 2) {
      if (ballLastKicker === "player") {
        const validForPlayer = getValidNumbers(dateInput).includes(num.value);
        if (!validForPlayer && !easyMode) {
          break;
        }
        dateInput += num.value;
        updateDateDisplay();
        if (dateInput.length === 8) {
          validateDate("player");
        }
      } else {
        const validForAI = getValidNumbers(aiDateInput).includes(num.value);
        if (!validForAI) {
          break;
        }
        aiDateInput += num.value;
        updateAIDateDisplay();
        if (aiDateInput.length === 8) {
          validateDate("ai");
        }
      }

      let newX,
        newY,
        attempts = 0;
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

  const formattedDate = `${input.substring(0, 2)}-${input.substring(
    2,
    4
  )}-${input.substring(4, 8)}`;
  const playerName = nameInput.value.trim() || "You";
  const winnerName = winner === "player" ? playerName : "AI";

  if (isValid && winner === "player") {
    overlayTitle.textContent = `You win!`;
    overlayMessage.textContent = `Your date: ${formattedDate}`;
    selectDateButton.classList.remove("hidden");
    selectedDate = formattedDate;
  } else if (isValid && winner === "ai") {
    overlayTitle.textContent = "You Lost!";
    overlayMessage.textContent = "Better luck next time!";
    selectDateButton.classList.add("hidden");
  } else {
    overlayTitle.textContent = "Invalid Date!";
    overlayMessage.textContent = `${winnerName} completed first but the date ${formattedDate} is invalid.`;
    selectDateButton.classList.add("hidden");
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
  if (currentSpeed > 0.5 && dx === 0 && dy === 0) {
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
  updateTeammate();
  updateAI2();
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

changeDateButton.addEventListener("click", () => {
  overlay.classList.add("hidden");
  selectDateButton.classList.add("hidden");
  selectedDate = "";
  init();
  gameLoop();
});

selectDateButton.addEventListener("click", () => {
  overlay.classList.add("hidden");
  gameContainer.classList.add("hidden");
  formContainer.classList.remove("expanding");
  formContainer.style.display = "block";
  gameActive = false;
  document.body.style.background = "#f5f5f5";
  birthDateInput.value = selectedDate;
  submitBtn.disabled = false;
});

birthDateInput.addEventListener("focus", () => {
  if (gameActive) return;

  gameActive = true;
  easyMode = difficultySelect.value === "easy";
  teamMode = difficultySelect.value === "team";
  const playerName = nameInput.value.trim() || "You";
  playerNameDisplay.textContent = playerName;

  const aiScoreboard = document.querySelector(".ai-score");
  const aiPlayerElement = document.getElementById("aiPlayer");
  const aiPlayer2Element = document.getElementById("aiPlayer2");
  const teammatePlayerElement = document.getElementById("teammatePlayer");

  if (easyMode) {
    aiScoreboard.style.display = "none";
    aiPlayerElement.style.display = "none";
    aiPlayer2Element.style.display = "none";
    teammatePlayerElement.style.display = "none";
  } else if (teamMode) {
    aiScoreboard.style.display = "block";
    aiPlayerElement.style.display = "block";
    aiPlayer2Element.style.display = "block";
    teammatePlayerElement.style.display = "block";
  } else {
    aiScoreboard.style.display = "block";
    aiPlayerElement.style.display = "block";
    aiPlayer2Element.style.display = "none";
    teammatePlayerElement.style.display = "none";
  }

  formContainer.classList.add("expanding");
  gameContainer.classList.remove("hidden");
  gameContainer.classList.add("appearing");
  document.body.style.background =
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

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
