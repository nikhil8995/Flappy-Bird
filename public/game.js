const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.5;
const FLAP = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const BIRD_SIZE = 30;

// Game variables
let birdY = canvas.height / 2;
let birdVelocity = 0;
let pipes = [];
let score = 0;
let gameOver = false;
let bestScore = localStorage.getItem('flappyBestScore') ? parseInt(localStorage.getItem('flappyBestScore')) : 0;

const birdFrames = [
  new Image(),
  new Image()
];
birdFrames[0].src = 'frame-1.png'; // wings up
birdFrames[1].src = 'frame-2.png'; // wings down

let currentBirdFrame = 0;
let birdFrameTick = 0;
let imagesLoaded = 0;
let imagesFailed = false;

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === birdFrames.length) {
    resetGame();
    gameLoop();
  }
}

function onImageError(e) {
  imagesFailed = true;
  console.error('Failed to load bird image:', e.target.src);
  resetGame();
  gameLoop();
}

birdFrames[0].onload = onImageLoad;
birdFrames[1].onload = onImageLoad;
birdFrames[0].onerror = onImageError;
birdFrames[1].onerror = onImageError;

function resetGame() {
  birdY = canvas.height / 2;
  birdVelocity = 0;
  pipes = [];
  score = 0;
  gameOver = false;
}

function drawBird() {
  ctx.save();
  ctx.translate(80, birdY);
  if (!imagesFailed && birdFrames[currentBirdFrame].complete && birdFrames[currentBirdFrame].naturalWidth > 0) {
    ctx.drawImage(
      birdFrames[currentBirdFrame],
      0, 0, birdFrames[currentBirdFrame].width, birdFrames[currentBirdFrame].height, // source
      -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE // destination
    );
  } else {
    // fallback: draw a yellow circle if images fail
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Animate: switch frame every 8 ticks
  birdFrameTick++;
  if (birdFrameTick % 8 === 0) {
    currentBirdFrame = (currentBirdFrame + 1) % birdFrames.length;
  }
}

function drawPipes() {
  ctx.fillStyle = '#228B22';
  pipes.forEach(pipe => {
    // Top pipe
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.top - PIPE_GAP);
  });
}

function drawScore() {
  ctx.fillStyle = '#333';
  ctx.font = '32px Arial';
  ctx.fillText(score, canvas.width / 2 - 10, 50);
  // Draw best score at the bottom
  ctx.font = '20px Arial';
  ctx.fillText('Best: ' + bestScore, canvas.width / 2 - 40, canvas.height - 20);
}

function updatePipes() {
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
    const top = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
    pipes.push({ x: canvas.width, top });
  }
  pipes.forEach(pipe => pipe.x -= 2);
  // Remove off-screen pipes
  if (pipes.length && pipes[0].x + PIPE_WIDTH < 0) {
    pipes.shift();
    score++;
  }
}

function checkCollision() {
  if (birdY + BIRD_SIZE / 2 > canvas.height || birdY - BIRD_SIZE / 2 < 0) {
    return true;
  }
  for (let pipe of pipes) {
    if (
      80 + BIRD_SIZE / 2 > pipe.x &&
      80 - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH &&
      (birdY - BIRD_SIZE / 2 < pipe.top || birdY + BIRD_SIZE / 2 > pipe.top + PIPE_GAP)
    ) {
      return true;
    }
  }
  return false;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  drawPipes();
  drawScore();

  if (!gameOver) {
    birdVelocity += GRAVITY;
    birdY += birdVelocity;
    updatePipes();
    if (checkCollision()) {
      gameOver = true;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBestScore', bestScore);
      }
    }
    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press Space to Restart', canvas.width / 2 - 120, canvas.height / 2 + 40);
  }
}

// Adjust canvas size for responsiveness
function resizeCanvas() {
  const ratio = 400 / 600;
  let width = Math.min(window.innerWidth * 0.9, 400);
  let height = width / ratio;
  if (height > 600) {
    height = 600;
    width = height * ratio;
  }
  canvas.width = width;
  canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameOver) {
      resetGame();
      gameLoop();
    } else {
      birdVelocity = FLAP;
    }
  }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  if (gameOver) {
    resetGame();
    gameLoop();
  } else {
    birdVelocity = FLAP;
  }
}, { passive: false }); 