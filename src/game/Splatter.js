
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

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Move: scale velocity by 60
            p.position.add(p.userData.velocity.clone().multiplyScalar(delta * 60));

            // Life: 0.02 per frame -> 1.2 per second
            p.userData.life -= 1.2 * delta;
            p.scale.setScalar(Math.max(0, p.userData.life));

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }
}
