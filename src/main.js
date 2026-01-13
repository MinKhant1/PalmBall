
import '../style.css';
import { HandTracker } from './ar/HandTracker.js';
import { SceneManager } from './ar/SceneManager.js';
import { GameLogic } from './game/GameLogic.js';

const videoElement = document.querySelector('.input_video');
const canvasContainer = document.getElementById('canvas-container');

// UI Elements
const scoreBoard = document.getElementById('score-board');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const finalScoreEl = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');
const timerEl = document.getElementById('timer');

const sceneManager = new SceneManager(canvasContainer, videoElement);
const handTracker = new HandTracker(videoElement);

const gameLogic = new GameLogic(
  sceneManager.scene,
  sceneManager.camera,
  (score) => {
    scoreBoard.innerText = `Score: ${score}`;
  },
  (finalScore) => {
    // Game Over
    finalScoreEl.innerText = finalScore;
    gameOverScreen.classList.remove('hidden');
  },
  (timeLeft) => {
    timerEl.innerText = `Time: ${timeLeft}`;
  }
);

let lastTime = 0;
let currentLandmarks = [];
let isPlaying = false;

function animate(time) {
  requestAnimationFrame(animate);

  if (isPlaying) {
    gameLogic.updateLoop(time, currentLandmarks);
  }
  sceneManager.render();
}

startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  startGame();
});

restartBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startGame();
});

function startGame() {
  isPlaying = true;
  gameLogic.startGame();

  // Ensure tracking is on
  if (!handTracker.camera) {
    handTracker.start((results) => {
      currentLandmarks = results.multiHandLandmarks;
      if (!sceneManager.scene.background) {
        sceneManager.startVideoBackground();
      }
    });
  }
}

requestAnimationFrame(animate);
