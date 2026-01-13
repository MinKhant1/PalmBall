
import * as THREE from 'three';
import { loadTextureWithTransparency } from './TextureUtils.js';

export class Bomb {
    constructor(texturePath, scene, boundary) {
        this.scene = scene;
        this.boundary = boundary;
        this.isActive = true;

        // Load texture
        const map = loadTextureWithTransparency(texturePath);

        const geometry = new THREE.PlaneGeometry(0.8, 0.8);
        const material = new THREE.MeshBasicMaterial({
            map: map,
            transparent: true,
            side: THREE.DoubleSide,
            color: 0xffaaaa // Tint slightly red
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = { isBomb: true };

        this.velocity = new THREE.Vector3();
        this.rotationalVelocity = new THREE.Vector3();
        this.pulseTime = 0;

        this.initSpawn();
        this.scene.add(this.mesh);
    }

    initSpawn() {
        const side = Math.floor(Math.random() * 4);
        const w = this.boundary.width;
        const h = this.boundary.height;

        let startPos = new THREE.Vector3();

        switch (side) {
            case 0: startPos.set((Math.random() - 0.5) * w, h / 2 + 1, 0); break;
            case 1: startPos.set((Math.random() - 0.5) * w, -h / 2 - 1, 0); break;
            case 2: startPos.set(-w / 2 - 1, (Math.random() - 0.5) * h, 0); break;
            case 3: startPos.set(w / 2 + 1, (Math.random() - 0.5) * h, 0); break;
        }

        this.mesh.position.copy(startPos);

        const target = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0);
        const direction = new THREE.Vector3().subVectors(target, startPos).normalize();

        const speed = 0.04 + Math.random() * 0.03; // Bombs might be slightly faster
        this.velocity = direction.multiplyScalar(speed);

        this.rotationalVelocity.set(0, 0, (Math.random() - 0.5) * 0.1);
    }

    update() {
        if (!this.isActive) return;

        this.mesh.position.add(this.velocity);
        this.mesh.rotation.z += this.rotationalVelocity.z;

        // Pulsate size
        this.pulseTime += 0.1;
        const scale = 1 + Math.sin(this.pulseTime) * 0.1;
        this.mesh.scale.set(scale, scale, 1);

        const b = 2;
        if (Math.abs(this.mesh.position.x) > this.boundary.width / 2 + b ||
            Math.abs(this.mesh.position.y) > this.boundary.height / 2 + b) {
            this.isActive = false;
            this.scene.remove(this.mesh);
        }
    }
}
