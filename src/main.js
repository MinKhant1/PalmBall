
import '../style.css';
import { HandTracker } from './ar/HandTracker.js';
import { SceneManager } from './ar/SceneManager.js';
import { GameLogic } from './game/GameLogic.js';

const videoElement = document.querySelector('.input_video');
const canvasContainer = document.getElementById('canvas-container');

// UI Elements
const scoreBoard = document.getElementById('score-board');
const timerEl = document.getElementById('timer');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const finalScoreEl = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');
const downloadBtn = document.getElementById('download-btn');
const snapshotImg = document.getElementById('snapshot-img');
const snapshotContainer = document.getElementById('snapshot-container');

let capturedSnapshot = null;
let pendingSnapshot = false;

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

    if (capturedSnapshot && snapshotImg && snapshotContainer) {
      snapshotImg.src = capturedSnapshot;
      snapshotContainer.classList.remove('hidden');
    } else if (snapshotContainer) {
      snapshotContainer.classList.add('hidden');
    }
  },
  (timeLeft) => {
    timerEl.innerText = `Time: ${timeLeft}`;
  },
  () => {
    // On Snapshot Trigger
    // Use requestAnimationFrame to ensure we capture rendered frame?
    // Actually, we want to capture right now or next frame.
    // Logic runs in update loop. Render happens after update.
    // If we capture now, we might get previous frame. 
    // But update is called in animate loop before render.
    // So sceneManager.render() hasn't happened for this frame yet.
    // We should wait for post-render.
    pendingSnapshot = true;
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

  if (pendingSnapshot) {
    const canvas = canvasContainer.querySelector('canvas');
    if (canvas) {
      capturedSnapshot = canvas.toDataURL('image/jpeg', 0.85); // JPG format
      if (snapshotImg) {
        snapshotImg.src = capturedSnapshot;
      }
    }
    pendingSnapshot = false;
  }
}

startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  startGame();
});

restartBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startGame();
});

if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    if (capturedSnapshot) {
      const a = document.createElement('a');
      a.href = capturedSnapshot;
      a.download = `palmball-snapshot-${Date.now()}.jpg`;
      a.click();
    }
  });
}

function startGame() {
  console.log('Main: startGame called'); // DEBUG LOG
  try {
    isPlaying = true;
    capturedSnapshot = null;
    console.log('Main: calling gameLogic.startGame');
    gameLogic.startGame();
    console.log('Main: gameLogic.startGame returned');

    if (snapshotContainer) {
      snapshotContainer.classList.add('hidden'); // Hide until game over
    }

    // Ensure tracking is on
    if (!handTracker.camera) {
      console.log('Main: initializing HandTracker');
      handTracker.start((results) => {
        console.log('HandTracker: Results received', results); // DEBUG LOG
        currentLandmarks = results.multiHandLandmarks;
        if (!sceneManager.scene.background) {
          console.log('SceneManager: Starting video background'); // DEBUG LOG
          sceneManager.startVideoBackground();
        }
      });
    } else {
      console.log('Main: HandTracker already has camera');
    }
  } catch (e) {
    console.error('Main: Error in startGame', e);
  }
}

requestAnimationFrame(animate);
