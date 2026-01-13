
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export class HandTracker {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.camera = null;
    this.onResultsCallback = null;
  }

  start(onResults) {
    this.onResultsCallback = onResults;
    this.hands.onResults(this.handleResults.bind(this));

    if (this.videoElement) {
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          await this.hands.send({ image: this.videoElement });
        },
        width: 1280,
        height: 720
      });
      this.camera.start();
    }
  }

  handleResults(results) {
    if (this.onResultsCallback) {
      this.onResultsCallback(results);
    }
  }
}
