
import * as THREE from 'three';
import { Fruit } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { Splatter } from './Splatter.js';
import { SoundManager } from './SoundManager.js';

export class GameLogic {
    constructor(scene, camera, onScoreUpdate, onGameOver, onTimeUpdate) {
        this.scene = scene;
        this.camera = camera;
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;
        this.onTimeUpdate = onTimeUpdate;

        this.soundManager = new SoundManager();

        this.fruits = []; // Can contain Fruits or Bombs now
        this.debris = [];
        this.splatter = new Splatter(scene);

        // Debug Cursors
        this.cursors = [];
        const cursorGeo = new THREE.RingGeometry(0.1, 0.15, 32);
        const cursorMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        for (let i = 0; i < 2; i++) {
            const cursor = new THREE.Mesh(cursorGeo, cursorMat);
            cursor.visible = false;
            this.scene.add(cursor);
            this.cursors.push(cursor);
        }

        this.score = 0;
        this.timeLeft = 60; // seconds
        this.isPlaying = false;

        this.lastSpawnTime = 0;
        this.spawnInterval = 1500;

        // Asset paths
        this.fruitTypes = [
            { type: 'watermelon', path: '/assets/watermelon_sprite_1768331316687.png', color: 0xff0000 },
            { type: 'peach', path: '/assets/peach_sprite_1768331331131.png', color: 0xffcc00 },
            { type: 'grape', path: '/assets/grape_sprite_1768331344173.png', color: 0x800080 }
        ];
        this.bombPath = '/assets/bomb_sprite_1768332363486.png';
    }

    startGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.isPlaying = true;
        this.fruits.forEach(f => this.scene.remove(f.mesh));
        this.debris.forEach(d => this.scene.remove(d));
        this.fruits = [];
        this.debris = [];
        this.spawnInterval = 1500;

        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onTimeUpdate) this.onTimeUpdate(Math.ceil(this.timeLeft));
    }

    update(time, handLandmarks, deltaTime) { // Expecting deltaTime in seconds or ms
        if (!this.isPlaying) return;

        // Update Timer
        if (deltaTime) {
            // deltaTime is usually ms passed from requestAnimationFrame
            // Wait, main loop usually passes total time. We need delta.
            // Let's assume we handle delta in main.js or here by tracking lastTime.
        }

    }

    // Changing API to be simpler: update(timeInMs, handLandmarks)
    // We'll calculate delta locally
    updateLoop(time, handLandmarks) {
        if (!this.isPlaying) return;

        const delta = (time - this.lastFrameTime) / 1000;
        this.lastFrameTime = time;
        if (isNaN(delta) || delta > 1) { // First frame or lag
            return;
        }

        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.endGame();
        }

        if (this.onTimeUpdate) this.onTimeUpdate(Math.ceil(this.timeLeft));

        this.spawnObjects(time);
        this.updateObjects(delta); // Pass delta
        this.updateDebris(delta); // Pass delta
        this.splatter.update(delta); // Pass delta
        this.checkCollisions(handLandmarks);
    }

    spawnObjects(time) {
        if (time - this.lastSpawnTime > this.spawnInterval) {
            if (this.spawnInterval > 800) this.spawnInterval -= 10;

            // 20% chance of bomb
            if (Math.random() < 0.2) {
                this.createBomb();
            } else {
                this.createFruit();
            }
            this.lastSpawnTime = time;
        }
    }

    createFruit() {
        const typeData = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
        const boundary = this.getBoundary();
        const fruit = new Fruit(typeData.type, typeData.path, this.scene, boundary);
        fruit.splashColor = typeData.color;
        this.fruits.push(fruit);
    }

    createBomb() {
        const boundary = this.getBoundary();
        const bomb = new Bomb(this.bombPath, this.scene, boundary);
        this.fruits.push(bomb);
    }

    getBoundary() {
        const dist = this.camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * this.camera.aspect;
        return { width, height };
    }

    updateObjects(delta) {
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const obj = this.fruits[i];
            obj.update(delta);
            if (!obj.isActive) {
                if (obj.mesh.parent) this.scene.remove(obj.mesh);
                this.fruits.splice(i, 1);
            }
        }
    }

    updateDebris(delta) {
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const part = this.debris[i];

            // Apply velocity scaled by delta
            part.position.add(part.userData.velocity.clone().multiplyScalar(delta * 60));

            // Gravity: 0.001 per frame @ 60fps ~= 0.06 per sec
            part.userData.velocity.y -= 0.06 * delta;

            // Rotation
            part.rotation.z += part.userData.rotVel.z * delta * 60;

            // Life: 0.02 per frame @ 60fps ~= 1.2 per sec
            part.userData.life -= 1.2 * delta;

            part.material.opacity = Math.max(0, part.userData.life);
            if (part.userData.life <= 0) {
                this.scene.remove(part);
                this.debris.splice(i, 1);
            }
        }
    }

    checkCollisions(handLandmarks) {
        // Reset cursors
        this.cursors.forEach(c => c.visible = false);

        if (!handLandmarks || handLandmarks.length === 0) return;

        const boundary = this.getBoundary();
        const width = boundary.width;
        const height = boundary.height;

        handLandmarks.forEach((landmarks, index) => {
            if (index >= this.cursors.length) return;

            const palm = landmarks[9];
            const worldX = -(palm.x - 0.5) * width;
            const worldY = -(palm.y - 0.5) * height;
            const handPos = new THREE.Vector3(worldX, worldY, 0);

            const cursor = this.cursors[index];
            cursor.position.copy(handPos);
            cursor.visible = true;

            for (let i = this.fruits.length - 1; i >= 0; i--) {
                const obj = this.fruits[i];
                if (handPos.distanceTo(obj.mesh.position) < 0.8) {
                    if (obj.mesh.userData.isBomb) {
                        this.hitBomb(obj, i);
                    } else {
                        this.sliceFruit(obj, i, handPos);
                    }
                }
            }
        });
    }

    sliceFruit(fruit, index, impactPos) {
        const impactVec = impactPos.clone().sub(fruit.mesh.position).normalize();
        const debrisParts = [
            fruit.createHalf(0, impactVec),
            fruit.createHalf(1, impactVec)
        ];
        this.debris.push(...debrisParts);
        this.splatter.createExplosion(fruit.mesh.position, fruit.splashColor);

        this.scene.remove(fruit.mesh);
        this.fruits.splice(index, 1);

        this.score += 10;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        this.soundManager.playSlice();
    }

    hitBomb(bomb, index) {
        this.scene.remove(bomb.mesh);
        this.fruits.splice(index, 1);

        // Punishment
        this.timeLeft -= 3;
        // Trigger red flash or sound?
        this.splatter.createExplosion(bomb.mesh.position, 0x000000, 30); // Big black explosion

        // Maybe play explosion sound?
        // Using slice sound for now or add new one
        this.soundManager.playSplash(); // Beep for now
    }

    endGame() {
        this.isPlaying = false;
        if (this.onGameOver) this.onGameOver(this.score);
    }
}
