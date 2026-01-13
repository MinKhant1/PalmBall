
import * as THREE from 'three';

export function loadTextureWithTransparency(url, scene) {
    const texture = new THREE.Texture();
    const loader = new THREE.ImageLoader();

    loader.load(url, (image) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // If close to white
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // Alpha 0
            }
        }

        ctx.putImageData(imageData, 0, 0);

        texture.image = canvas;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
    });

    return texture;
}
