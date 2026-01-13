
import * as THREE from 'three';
import { loadTextureWithTransparency } from './TextureUtils.js';

export class Fruit {
    constructor(type, texturePath, scene, boundary) {
        this.type = type;
        this.scene = scene;
        this.boundary = boundary; // { width, height, depth }
        this.isActive = true;

        // Load texture with transparency fix
        const map = loadTextureWithTransparency(texturePath);

        // Geometry
        const geometry = new THREE.PlaneGeometry(0.8, 0.8);
        const material = new THREE.MeshBasicMaterial({
            map: map,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = { parentFruit: this };

        // Physics
        this.velocity = new THREE.Vector3();
        this.rotationalVelocity = new THREE.Vector3();

        this.initSpawn();
        this.scene.add(this.mesh);
    }

    initSpawn() {
        // Spawn from random edge
        const side = Math.floor(Math.random() * 4); // 0: Top, 1: Bottom, 2: Left, 3: Right
        const w = this.boundary.width;
        const h = this.boundary.height;

        let startPos = new THREE.Vector3();

        switch (side) {
            case 0: // Top
                startPos.set((Math.random() - 0.5) * w, h / 2 + 1, 0);
                break;
            case 1: // Bottom
                startPos.set((Math.random() - 0.5) * w, -h / 2 - 1, 0);
                break;
            case 2: // Left
                startPos.set(-w / 2 - 1, (Math.random() - 0.5) * h, 0);
                break;
            case 3: // Right
                startPos.set(w / 2 + 1, (Math.random() - 0.5) * h, 0);
                break;
        }

        this.mesh.position.copy(startPos);

        // Target random point near center
        const target = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0);
        const direction = new THREE.Vector3().subVectors(target, startPos).normalize();

        // Speed varies
        const speed = 0.03 + Math.random() * 0.04;
        this.velocity = direction.multiplyScalar(speed);

        // Rotation
        this.rotationalVelocity.set(0, 0, (Math.random() - 0.5) * 0.1);
    }

    update() {
        if (!this.isActive) return;

        this.mesh.position.add(this.velocity);
        this.mesh.rotation.z += this.rotationalVelocity.z;

        // Check bounds to remove
        const b = 2; // buffer
        if (Math.abs(this.mesh.position.x) > this.boundary.width / 2 + b ||
            Math.abs(this.mesh.position.y) > this.boundary.height / 2 + b) {
            this.isActive = false;
            this.scene.remove(this.mesh);
        }
    }

    slice(impactVec) {
        this.isActive = false;
        this.scene.remove(this.mesh);

        // Create two halves
        this.createHalf(0, impactVec);
        this.createHalf(1, impactVec);
    }

    createHalf(index, impactVec) {
        // Clone material but adjust UV transform?
        // PlaneGeometry UVs are 0..1.
        // To slice, we can modify texture.offset/repeat or geometry UVs.
        // Easier: Use two PlaneGeometries, one showing left half, one right half.

        const map = this.mesh.material.map.clone(); // Clone texture reference? Texture itself is shared usually.
        // If we clone texture object, we can offset.
        // Texture object is lightweight wrapper.
        map.offset.x = index === 0 ? 0 : 0.5;
        map.repeat.x = 0.5;

        const geometry = new THREE.PlaneGeometry(0.4, 0.8); // Half width
        const material = new THREE.MeshBasicMaterial({
            map: map,
            transparent: true,
            side: THREE.DoubleSide
        });

        const half = new THREE.Mesh(geometry, material);
        half.position.copy(this.mesh.position);
        half.rotation.copy(this.mesh.rotation);

        // Offset position slightly
        const offset = index === 0 ? -0.2 : 0.2;
        // Rotate offset by current rotation
        const localOffset = new THREE.Vector3(offset, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), this.mesh.rotation.z);
        half.position.add(localOffset);

        // Velocity separation
        const sepVel = localOffset.clone().normalize().multiplyScalar(0.05);
        // Add gravity effect later?

        // Add to specific "debris" list in GameLogic or just Fire and Forget?
        // For now, let's just make them fly apart and fade.
        // We'll return them to be managed by GameLogic.

        half.userData = {
            velocity: this.velocity.clone().add(sepVel),
            rotVel: new THREE.Vector3(0, 0, (Math.random() - 0.5) * 0.2),
            isDebris: true,
            life: 1.0 // for fade out
        };

        this.scene.add(half);
        return half;
    }
}
