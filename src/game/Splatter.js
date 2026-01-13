
import * as THREE from 'three';

export class Splatter {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createExplosion(position, color, count = 15) {
        const geometry = new THREE.PlaneGeometry(0.05, 0.05);
        const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });

        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);

            // Random spread
            particle.position.x += (Math.random() - 0.5) * 0.2;
            particle.position.y += (Math.random() - 0.5) * 0.2;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );

            particle.userData = { velocity, life: 1.0 };
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position.add(p.userData.velocity);
            p.userData.life -= 0.02;
            p.scale.setScalar(p.userData.life);

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }
}
