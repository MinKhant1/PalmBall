
import { HandTracker } from './ar/HandTracker.js';
import { SceneManager } from './ar/SceneManager.js';
import { GameLogic } from './game/GameLogic.js';

const videoElement = document.querySelector('.input_video');
const canvasContainer = document.getElementById('canvas-container');
const scoreBoard = document.getElementById('score-board');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

const sceneManager = new SceneManager(canvasContainer, videoElement);
const handTracker = new HandTracker(videoElement);
const gameLogic = new GameLogic(sceneManager.scene, sceneManager.camera, (score) => {
  scoreBoard.innerText = `Score: ${score}`;
});

let lastTime = 0;
let currentLandmarks = [];
let isPlaying = false;

function animate(time) {
  requestAnimationFrame(animate);

  if (isPlaying) {
    gameLogic.update(time, currentLandmarks);
  }
  sceneManager.render();
}

startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  isPlaying = true;

  handTracker.start((results) => {
    currentLandmarks = results.multiHandLandmarks;
    if (!sceneManager.scene.background) {
      sceneManager.startVideoBackground();
    }
  });
});

requestAnimationFrame(animate);
