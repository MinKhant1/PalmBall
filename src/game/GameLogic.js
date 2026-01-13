
import * as THREE from 'three';

export class GameLogic {
    constructor(scene, camera, onScoreUpdate) {
        this.scene = scene;
        this.camera = camera;
        this.onScoreUpdate = onScoreUpdate;
        this.balls = [];
        this.score = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = 1000; // ms
    }

    update(time, handLandmarks) {
        this.spawnBalls(time);
        this.updateBalls(time);
        this.checkCollisions(handLandmarks);
    }

    spawnBalls(time) {
        if (time - this.lastSpawnTime > this.spawnInterval) {
            this.createBall();
            this.lastSpawnTime = time;
        }
    }

    createBall() {
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
        const ball = new THREE.Mesh(geometry, material);

        // Random position within view at Z=0
        // Visible height at z=0 (camera z=5)
        // vFOV = camera.fov (75)
        // height = 2 * tan(fov/2) * distance
        const dist = this.camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * this.camera.aspect;

        ball.position.x = (Math.random() - 0.5) * width;
        ball.position.y = (Math.random() - 0.5) * height; // Start somewhere visible
        // Maybe pop out from bottom? For now just static or floating up.
        ball.position.y = -height / 2 - 0.5; // Start below
        ball.position.z = 0;

        ball.userData = { velocity: new THREE.Vector3(0, (Math.random() * 0.02 + 0.01), 0) };

        this.scene.add(ball);
        this.balls.push(ball);
    }

    updateBalls(time) {
        const dist = this.camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;

        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            ball.position.add(ball.userData.velocity);

            // Remove if out of view (top)
            if (ball.position.y > height / 2 + 1) {
                this.scene.remove(ball);
                this.balls.splice(i, 1);
            }
        }
    }

    checkCollisions(handLandmarks) {
        if (!handLandmarks || handLandmarks.length === 0) return;

        const dist = this.camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * this.camera.aspect;

        for (const landmarks of handLandmarks) {
            // Index finger tip is index 8
            const tip = landmarks[8];

            // Map 0..1 to world coords at Z=0
            // MediaPipe x is 0(left) to 1(right). Three.js x is -width/2 to width/2
            // MediaPipe y is 0(top) to 1(bottom). Three.js y is height/2 to -height/2

            const handX = (tip.x - 0.5) * width * -1; // Mirror horizontally? MediaPipe matches video?
            // Usually MediaPipe video is mirrored. If we mirrored video container with scale(-1,1),
            // the landmarks might need adjustment or not.
            // Let's assume standard mapping first.

            // NOTE: VideoTexture is often mirrored if using user-facing camera.
            // If we mirrored CSS, visual is good.
            // MP landmarks: "x" is normalized.

            const worldX = -(tip.x - 0.5) * width; // Flip x for mirror effect
            const worldY = -(tip.y - 0.5) * height;

            const handPos = new THREE.Vector3(worldX, worldY, 0);

            for (let i = this.balls.length - 1; i >= 0; i--) {
                const ball = this.balls[i];
                if (handPos.distanceTo(ball.position) < 0.5) { // Radius 0.3 + buffer
                    // POP!
                    this.popBall(ball, i);
                }
            }
        }
    }

    popBall(ball, index) {
        this.scene.remove(ball);
        this.balls.splice(index, 1);
        this.score++;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        console.log("Score:", this.score);
        // Add sound or particle effect later
    }
}
