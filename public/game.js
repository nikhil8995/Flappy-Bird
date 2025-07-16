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
let firstPipePlaced = false;
let showTapHint = true;
let tapHintAlpha = 1;

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}
let pipeSpeed = isMobile() ? 1.2 : 2;

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

// Cloud background variables
const CLOUD_COUNT = 5;
let clouds = [];

function initClouds() {
  clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      radius: 20 + Math.random() * 30,
      speed: 0.3 + Math.random() * 0.7,
      opacity: 0.5 + Math.random() * 0.3
    });
  }
}

function drawBackground() {
  // Draw sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#70c5ce'); // top
  gradient.addColorStop(0.7, '#b2eaff'); // mid
  gradient.addColorStop(1, '#e0f7ff'); // bottom, lighter for smoother look
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw and animate clouds
  clouds.forEach(cloud => {
    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    ctx.beginPath();
    // Draw a simple cloud shape (3 overlapping circles)
    ctx.arc(cloud.x, cloud.y, cloud.radius, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(cloud.x + cloud.radius, cloud.y - cloud.radius, cloud.radius, Math.PI * 1, Math.PI * 2);
    ctx.arc(cloud.x + cloud.radius * 2, cloud.y, cloud.radius, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // Move cloud
    cloud.x -= cloud.speed;
    // Recycle cloud if it goes off screen
    if (cloud.x + cloud.radius * 2 < 0) {
      cloud.x = canvas.width + cloud.radius * 2;
      cloud.y = Math.random() * canvas.height * 0.5;
      cloud.radius = 20 + Math.random() * 30;
      cloud.speed = 0.3 + Math.random() * 0.7;
      cloud.opacity = 0.5 + Math.random() * 0.3;
    }
  });

  // Draw ground (curved, bumpy road)
  const groundHeight = 60;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - groundHeight);
  // Draw bumps
  const bumps = 8;
  for (let i = 0; i <= bumps; i++) {
    const x = (i * canvas.width) / bumps;
    const y = canvas.height - groundHeight + Math.sin(i * Math.PI / 2) * 16;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fillStyle = '#6ec06e'; // green ground
  ctx.fill();
  // Add a brown base
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - groundHeight + 20);
  for (let i = 0; i <= bumps; i++) {
    const x = (i * canvas.width) / bumps;
    const y = canvas.height - groundHeight + 20 + Math.sin(i * Math.PI / 2) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fillStyle = '#b97a56'; // brown dirt
  ctx.fill();
  ctx.restore();
}

function resetGame() {
  birdY = canvas.height / 2;
  birdVelocity = 0;
  pipes = [];
  // Add first pipe at the middle of the screen
  const top = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
  pipes.push({ x: canvas.width / 2, top });
  score = 0;
  gameOver = false;
  initClouds(); // Reset clouds
  firstPipePlaced = false;
  pipeSpeed = isMobile() ? 1.2 : 2; // Reset pipe speed
  showTapHint = true;
  tapHintAlpha = 1;
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
  pipes.forEach(pipe => {
    // Pipe body gradient
    const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    pipeGradient.addColorStop(0, '#43e043'); // left highlight
    pipeGradient.addColorStop(0.3, '#43e043');
    pipeGradient.addColorStop(1, '#228B22'); // right shadow
    ctx.fillStyle = pipeGradient;
    // Top pipe
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.top - PIPE_GAP);

    // Pipe rim (lip) - lighter green
    ctx.fillStyle = '#b6ff7a';
    // Top pipe rim
    ctx.fillRect(pipe.x - 4, pipe.top - 12, PIPE_WIDTH + 8, 12);
    // Bottom pipe rim
    ctx.fillRect(pipe.x - 4, pipe.top + PIPE_GAP, PIPE_WIDTH + 8, 12);

    // Optional: subtle shadow for depth
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    // Top pipe shadow
    ctx.fillRect(pipe.x + 6, 0, 8, pipe.top);
    // Bottom pipe shadow
    ctx.fillRect(pipe.x + 6, pipe.top + PIPE_GAP, 8, canvas.height - pipe.top - PIPE_GAP);
    ctx.restore();
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
  // Increase pipe speed as score increases, but cap it for fairness
  const baseSpeed = isMobile() ? 1.2 : 2;
  pipeSpeed = baseSpeed + Math.min(score * 0.1, 4); // Max speed = 5.2 (mobile) or 6 (desktop)

  if (pipes.length === 0) return; // Should never happen, but safety
  if (pipes[pipes.length - 1].x < canvas.width - 200) {
    const top = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
    pipes.push({ x: pipes[pipes.length - 1].x + 200, top });
  }
  pipes.forEach(pipe => pipe.x -= pipeSpeed);
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

// Sound effects
let flapSound, hitSound;
if (typeof Audio !== 'undefined') {
  flapSound = new Audio('flap.mp3');
  hitSound = new Audio('hit.mp3');
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear for everything
  drawBackground(); // Draw sky and clouds
  drawBird();
  drawPipes();
  drawScore();
  // Show 'Tap anywhere to flap!' overlay
  if ((score === 0 && !gameOver && showTapHint) || (gameOver && showTapHint)) {
    ctx.save();
    ctx.globalAlpha = tapHintAlpha;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tap anywhere to flap!', canvas.width / 2, canvas.height / 2 + 80);
    ctx.restore();
  }

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
      showTapHint = true;
      tapHintAlpha = 1;
      if (hitSound) { hitSound.currentTime = 0; hitSound.play(); }
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
    // Fade in tap hint on game over
    if (showTapHint && tapHintAlpha < 1) {
      tapHintAlpha += 0.02;
    }
  }
}

// Adjust canvas size for responsiveness
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initClouds(); // Re-initialize clouds on resize
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameOver) {
      resetGame();
      gameLoop();
      showTapHint = false;
      tapHintAlpha = 0;
    } else {
      birdVelocity = FLAP;
      showTapHint = false;
      tapHintAlpha = 0;
      if (flapSound) { flapSound.currentTime = 0; flapSound.play(); }
    }
  }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  if (gameOver) {
    resetGame();
    gameLoop();
    showTapHint = false;
    tapHintAlpha = 0;
  } else {
    birdVelocity = FLAP;
    showTapHint = false;
    tapHintAlpha = 0;
    if (flapSound) { flapSound.currentTime = 0; flapSound.play(); }
  }
}, { passive: false }); 