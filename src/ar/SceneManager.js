
import * as THREE from 'three';

export class SceneManager {
    constructor(canvasContainer, videoElement) {
        this.container = canvasContainer;
        this.videoElement = videoElement;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 10);
        this.scene.add(directionalLight);

        this.camera.position.z = 5;

        // Handle Window Resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    startVideoBackground() {
        if (this.videoElement) {
            const texture = new THREE.VideoTexture(this.videoElement);
            texture.colorSpace = THREE.SRGBColorSpace;
            // Mirror the specific texture to match CSS transform
            texture.center.set(0.5, 0.5);
            texture.repeat.set(-1, 1);
            this.scene.background = texture;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
