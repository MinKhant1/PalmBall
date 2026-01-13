
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
    console.log('HandTracker: start called'); // DEBUG LOG
    this.onResultsCallback = onResults;
    this.hands.onResults(this.handleResults.bind(this));

    if (this.videoElement) {
      console.log('HandTracker: Initializing Camera'); // DEBUG LOG
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          // console.log('HandTracker: Camera onFrame'); // DEBUG LOG (Too spammy?)
          await this.hands.send({ image: this.videoElement });
        },
        width: 1280,
        height: 720
      });
      this.camera.start()
        .then(() => console.log('HandTracker: Camera started'))
        .catch(err => console.error('HandTracker: Camera failed to start', err)); // DEBUG LOG
    } else {
      console.error('HandTracker: No video element found!');
    }
  }

  handleResults(results) {
    // console.log('HandTracker: handleResults'); // DEBUG LOG
    if (this.onResultsCallback) {
      this.onResultsCallback(results);
    }
  }
}
