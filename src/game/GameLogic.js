
import * as THREE from 'three';
import { Fruit } from './Fruit.js';
import { Splatter } from './Splatter.js';
import { SoundManager } from './SoundManager.js';

export class GameLogic {
    constructor(scene, camera, onScoreUpdate) {
        this.scene = scene;
        this.camera = camera;
        this.onScoreUpdate = onScoreUpdate;

        this.soundManager = new SoundManager();

        this.fruits = [];
        this.debris = [];
        this.splatter = new Splatter(scene);

        // Debug Cursor
        const cursorGeo = new THREE.RingGeometry(0.1, 0.15, 32);
        const cursorMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        this.debugCursor = new THREE.Mesh(cursorGeo, cursorMat);
        this.debugCursor.visible = false;
        this.scene.add(this.debugCursor);

        this.score = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = 1500; // Slower spawn for starters

        // Asset paths
        this.fruitTypes = [
            { type: 'watermelon', path: '/assets/watermelon_sprite_1768331316687.png', color: 0xff0000 },
            { type: 'peach', path: '/assets/peach_sprite_1768331331131.png', color: 0xffcc00 },
            { type: 'grape', path: '/assets/grape_sprite_1768331344173.png', color: 0x800080 }
        ];
    }

    update(time, handLandmarks) {
        this.spawnFruits(time);
        this.updateFruits();
        this.updateDebris();
        this.splatter.update();
        this.checkCollisions(handLandmarks);
    }

    spawnFruits(time) {
        if (time - this.lastSpawnTime > this.spawnInterval) {
            // Speed up over time?
            if (this.spawnInterval > 800) this.spawnInterval -= 10;

            this.createFruit();
            this.lastSpawnTime = time;
        }
    }

    createFruit() {
        const typeData = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];

        const dist = this.camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * this.camera.aspect;

        const boundary = { width, height };

        const fruit = new Fruit(typeData.type, typeData.path, this.scene, boundary);
        // Attach color for splash
        fruit.splashColor = typeData.color;

        this.fruits.push(fruit);
    }

    updateFruits() {
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            fruit.update();
            if (!fruit.isActive) {
                // If it wasn't sliced (just went off screen), remove it
                if (fruit.mesh.parent) this.scene.remove(fruit.mesh); // Should handle self-removal but double check
                this.fruits.splice(i, 1);
            }
        }
    }

    updateDebris() {
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const part = this.debris[i];
            part.position.add(part.userData.velocity);
            part.userData.velocity.y -= 0.001; // Gravity
            part.rotation.z += part.userData.rotVel.z;

            part.userData.life -= 0.02;
            part.material.opacity = part.userData.life;

            if (part.userData.life <= 0) {
                this.scene.remove(part);
                this.debris.splice(i, 1);
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
            // Use Middle Finger MCP (Index 9) as a proxy for the Palm Center
            const palm = landmarks[9];

            // Map 0..1 to world coords at Z=0
            const worldX = -(palm.x - 0.5) * width; // Flip x for mirror effect
            const worldY = -(palm.y - 0.5) * height;

            const handPos = new THREE.Vector3(worldX, worldY, 0);

            // Update debug cursor
            this.debugCursor.position.copy(handPos);
            this.debugCursor.visible = true;

            for (let i = this.fruits.length - 1; i >= 0; i--) {
                const fruit = this.fruits[i];
                // Distance check
                if (handPos.distanceTo(fruit.mesh.position) < 0.8) {
                    this.sliceFruit(fruit, i, handPos);
                }
            }
        }
    }

    sliceFruit(fruit, index, impactPos) {
        // Impact vector relative to fruit center?
        const impactVec = impactPos.clone().sub(fruit.mesh.position).normalize();

        // Visuals
        const debrisParts = [
            fruit.createHalf(0, impactVec),
            fruit.createHalf(1, impactVec)
        ];
        this.debris.push(...debrisParts);

        // Particles
        this.splatter.createExplosion(fruit.mesh.position, fruit.splashColor);

        // Remove original
        this.scene.remove(fruit.mesh);
        this.fruits.splice(index, 1);

        // Score
        this.score += 10;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);

        // Play sound
        this.soundManager.playSlice();
    }
}
