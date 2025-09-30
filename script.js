document.addEventListener('DOMContentLoaded', () => {
    // --- Get Elements ---
    const container = document.getElementById('animation-container');

    // --- Global Variables ---
    let animationTimer;
    let elements = [];
    let guiControllers = {};

    // --- Helper Functions ---
    const getTimestamp = () => {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    };

    const startSaving = (processFunc) => {
        clearInterval(animationTimer);
        setTimeout(async () => {
            await processFunc();
            regenerateAnimation();
        }, 100);
    };

    const downloadFile = (blob, filename) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');

    // --- Settings ---
    const settings = {
        numCircles: 8,
        containerSize: 300,
        loopTime: 1000,
        marginPercent: 10,
        rotation: 0,
        headCount: 6,
        
        startCircle: {
            color: { r: 155, g: 155, b: 155, a: 1.0 },
            size: 50
        },
        endCircle: {
            color: { r: 50, g: 50, b: 50, a: 1.0 },
            size: 0
        },

        proxy: {
            startColorRGB: rgbToHex(155, 155, 155),
            startColorAlpha: 1.0,
            endColorRGB: rgbToHex(50, 50, 50),
            endColorAlpha: 1.0
        },
        
        useImage: false,
        imageSrc: null,
        imageElement: null,
        imageFilename: null,
        colorMode: 'original',
        imageOrientation: 'fixed',

        loadImage: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                settings.imageFilename = file.name;
                const reader = new FileReader();
                reader.onload = res => {
                    const img = new Image();
                    img.onload = () => {
                        settings.imageElement = img;
                        settings.imageSrc = res.target.result;
                        settings.useImage = true;
                        guiControllers.useImage.updateDisplay();
                        regenerateAnimation();
                    };
                    img.src = res.target.result;
                };
                reader.readAsDataURL(file);
            };
            input.click();
        },
        removeImage: () => {
            settings.useImage = false;
            settings.imageSrc = null;
            settings.imageElement = null;
            settings.imageFilename = null;
            guiControllers.useImage.updateDisplay();
            regenerateAnimation();
        },

        saveAsZip: () => {},
        saveAsApng: () => {}
    };
    
    settings.saveAsZip = () => startSaving(async () => {
        const timestamp = getTimestamp();
        const frames = await generateFrames();
        const zip = new JSZip();
        for (let i = 0; i < frames.length; i++) {
            const blob = await new Promise(resolve => frames[i].toBlob(resolve, 'image/png'));
            zip.file(`loading_animation_${timestamp}_${i}.png`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, `loading_animation_${timestamp}.zip`);
    });

    settings.saveAsApng = () => startSaving(async () => {
        const timestamp = getTimestamp();
        const frames = await generateFrames();
        const frameBuffers = frames.map(canvas => {
            const ctx = canvas.getContext('2d', { alpha: true });
            return ctx.getImageData(0, 0, settings.containerSize, settings.containerSize).data.buffer;
        });
        const stepInterval = settings.numCircles > 1 ? settings.loopTime / settings.numCircles : settings.loopTime;
        const delays = Array(frames.length).fill(stepInterval);
        const apngBuffer = UPNG.encode(frameBuffers, settings.containerSize, settings.containerSize, 0, delays);
        downloadFile(new Blob([apngBuffer], { type: 'image/png' }), `loading_animation_${timestamp}.png`);
    });

    const createTintedImage = (image, color) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // Apply color if not fully transparent
                data[i] = color.r;
                data[i + 1] = color.g;
                data[i + 2] = color.b;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    };

    // --- Animation Update and Regeneration ---
    const updateGui = () => {
        const isOriginalColor = settings.useImage && settings.colorMode === 'original';
        guiControllers.startColorRGB.domElement.style.pointerEvents = isOriginalColor ? 'none' : 'auto';
        guiControllers.startColorRGB.domElement.style.opacity = isOriginalColor ? 0.5 : 1;
        guiControllers.endColorRGB.domElement.style.pointerEvents = isOriginalColor ? 'none' : 'auto';
        guiControllers.endColorRGB.domElement.style.opacity = isOriginalColor ? 0.5 : 1;
        
        if (settings.useImage && settings.imageFilename) {
            let displayName = settings.imageFilename;
            if (displayName.length > 20) {
                displayName = displayName.substring(0, 17) + '...';
            }
            guiControllers.useImage.name(`Use: ${displayName}`);
        } else {
            guiControllers.useImage.name('Use Image');
        }

        guiControllers.colorMode.domElement.style.display = settings.useImage ? 'block' : 'none';
        guiControllers.imageOrientation.domElement.style.display = settings.useImage ? 'block' : 'none';
        guiControllers.removeImage.domElement.style.display = settings.useImage ? 'block' : 'none';
    };

    const regenerateAnimation = () => {
        if (animationTimer) clearInterval(animationTimer);
        container.innerHTML = '';
        elements = [];
        
        updateGui();

        const propsArray = [];
        container.style.width = `${settings.containerSize}px`;
        container.style.height = `${settings.containerSize}px`;

        const maxElementSize = Math.max(settings.startCircle.size, settings.endCircle.size);
        const orbitDiameter = settings.containerSize - maxElementSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, orbitDiameter / 2);
        
        const rotationInRadians = settings.rotation * (Math.PI / 180);
        const start = settings.startCircle;
        const end = settings.endCircle;
        const n = settings.numCircles;
        const m = settings.headCount;
        const gradientLength = Math.min(n, m);

        for (let i = 0; i < n; i++) {
            let r, g, b, a, size;
            if (i < gradientLength) {
                const ratio = (gradientLength <= 1) ? 0 : i / (gradientLength - 1);
                r = Math.round(start.color.r + (end.color.r - start.color.r) * ratio);
                g = Math.round(start.color.g + (end.color.g - start.color.g) * ratio);
                b = Math.round(start.color.b + (end.color.b - start.color.b) * ratio);
                a = start.color.a + (end.color.a - start.color.a) * ratio;
                size = start.size + (end.size - start.size) * ratio;
            } else {
                r = end.color.r; g = end.color.g; b = end.color.b; a = end.color.a;
                size = end.size;
            }
            propsArray.push({ color: {r,g,b,a}, size: size });
        }

        const tintedImageDataUrlCache = {};
        if (settings.useImage && settings.colorMode === 'silhouette' && settings.imageElement) {
            propsArray.forEach(prop => {
                const colorKey = `rgb(${prop.color.r},${prop.color.g},${prop.color.b})`;
                if (!tintedImageDataUrlCache[colorKey]) {
                    const tintedCanvas = createTintedImage(settings.imageElement, prop.color);
                    tintedImageDataUrlCache[colorKey] = tintedCanvas.toDataURL();
                }
            });
        }

        for (let i = 0; i < n; i++) {
            const angle = (n > 0) ? -(i / n) * 2 * Math.PI - Math.PI / 2 + rotationInRadians : 0;
            const x = settings.containerSize / 2 + RADIUS * Math.cos(angle);
            const y = settings.containerSize / 2 + RADIUS * Math.sin(angle);
            const el = document.createElement('div');
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;

            if (settings.useImage && settings.imageOrientation === 'center') {
                const rotationInRad = angle + Math.PI / 2;
                el.style.transform = `translate(-50%, -50%) rotate(${rotationInRad}rad)`;
            } else {
                el.style.transform = 'translate(-50%, -50%)';
            }

            container.appendChild(el);
            elements.push(el);
        }
        
        const updateElements = (props) => {
            elements.forEach((el, index) => {
                const currentProps = props[index];
                if (settings.useImage && settings.imageSrc) {
                    el.className = 'image-element';
                    const img = settings.imageElement;
                    const scale = currentProps.size / Math.max(img.width, img.height);
                    el.style.width = `${img.width * scale}px`;
                    el.style.height = `${img.height * scale}px`;
                    el.style.opacity = currentProps.color.a;

                    if (settings.colorMode === 'silhouette') {
                        const colorKey = `rgb(${currentProps.color.r},${currentProps.color.g},${currentProps.color.b})`;
                        el.style.backgroundImage = `url(${tintedImageDataUrlCache[colorKey]})`;
                        el.style.backgroundColor = 'transparent';
                    } else {
                        el.style.backgroundColor = 'transparent';
                         el.style.backgroundImage = `url(${settings.imageSrc})`;
                    }
                } else {
                    el.className = 'circle';
                    el.style.width = `${currentProps.size}px`;
                    el.style.height = `${currentProps.size}px`;
                    el.style.backgroundColor = `rgba(${currentProps.color.r}, ${currentProps.color.g}, ${currentProps.color.b}, ${currentProps.color.a})`;
                    el.style.backgroundImage = 'none';
                }
            });
        };
        
        updateElements(propsArray);

        const stepInterval = settings.numCircles > 1 ? settings.loopTime / settings.numCircles : settings.loopTime;
        animationTimer = setInterval(() => {
            if (propsArray.length > 1) {
                propsArray.push(propsArray.shift());
                updateElements(propsArray);
            }
        }, stepInterval);
    };
    
    // --- GUI Setup ---
    const gui = new lil.GUI();
    const generalFolder = gui.addFolder('General Settings');
    generalFolder.add(settings, 'numCircles', 1, 24, 1).name('Number of Elements').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'headCount', 1, 24, 1).name('Gradient Length').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'containerSize', 100, 1080, 10).name('Container Size (px)').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'marginPercent', 0, 100, 1).name('Margin (%)').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'rotation', 0, 360, 1).name('Global Rotation (deg)').onChange(regenerateAnimation);
    generalFolder.add(settings, 'loopTime', 100, 3000, 1).name('Loop Time (ms)').onFinishChange(regenerateAnimation);

    const startCircleFolder = gui.addFolder('Start Element');
    guiControllers.startColorRGB = startCircleFolder.addColor(settings.proxy, 'startColorRGB').name('Color (RGB)')
        .onFinishChange(value => {
            const rgb = hexToRgb(value);
            settings.startCircle.color.r = rgb.r; settings.startCircle.color.g = rgb.g; settings.startCircle.color.b = rgb.b;
            regenerateAnimation();
        });
    startCircleFolder.add(settings.proxy, 'startColorAlpha', 0, 1, 0.01).name('Opacity (Alpha)').onFinishChange(value => {
        settings.startCircle.color.a = value; regenerateAnimation();
    });
    startCircleFolder.add(settings.startCircle, 'size', 0, 100, 1).name('Size').onFinishChange(regenerateAnimation);

    const endCircleFolder = gui.addFolder('End Element');
    guiControllers.endColorRGB = endCircleFolder.addColor(settings.proxy, 'endColorRGB').name('Color (RGB)')
        .onFinishChange(value => {
            const rgb = hexToRgb(value);
            settings.endCircle.color.r = rgb.r; settings.endCircle.color.g = rgb.g; settings.endCircle.color.b = rgb.b;
            regenerateAnimation();
        });
    endCircleFolder.add(settings.proxy, 'endColorAlpha', 0, 1, 0.01).name('Opacity (Alpha)').onFinishChange(value => {
        settings.endCircle.color.a = value; regenerateAnimation();
    });
    endCircleFolder.add(settings.endCircle, 'size', 0, 100, 1).name('Size').onFinishChange(regenerateAnimation);

    const imageFolder = gui.addFolder('Image Settings');
    imageFolder.add(settings, 'loadImage').name('Select Image...');
    guiControllers.useImage = imageFolder.add(settings, 'useImage').name('Use Image').onFinishChange(regenerateAnimation);
    guiControllers.colorMode = imageFolder.add(settings, 'colorMode', ['silhouette', 'original']).name('Color Mode').onFinishChange(regenerateAnimation);
    guiControllers.imageOrientation = imageFolder.add(settings, 'imageOrientation', ['fixed', 'center']).name('Image Orientation').onFinishChange(regenerateAnimation);
    guiControllers.removeImage = imageFolder.add(settings, 'removeImage').name('Remove Image');
    
    const saveFolder = gui.addFolder('Export');
    saveFolder.add(settings, 'saveAsZip').name('Save as PNG (ZIP)');
    saveFolder.add(settings, 'saveAsApng').name('Save as APNG');

    // --- Frame Generation for Saving ---
    const generateFrames = async () => {
        const frames = [];
        const n = settings.numCircles;

        // Calculate gradient properties
        const start = settings.startCircle;
        const end = settings.endCircle;
        const m = settings.headCount;
        const gradientLength = Math.min(n, m);
        let propsArray = [];
        for (let i = 0; i < n; i++) {
            let r, g, b, a, size;
             if (i < gradientLength) {
                const ratio = (gradientLength <= 1) ? 0 : i / (gradientLength - 1);
                r = Math.round(start.color.r + (end.color.r - start.color.r) * ratio);
                g = Math.round(start.color.g + (end.color.g - start.color.g) * ratio);
                b = Math.round(start.color.b + (end.color.b - start.color.b) * ratio);
                a = start.color.a + (end.color.a - start.color.a) * ratio;
                size = start.size + (end.size - start.size) * ratio;
            } else {
                r = end.color.r; g = end.color.g; b = end.color.b; a = end.color.a;
                size = end.size;
            }
            propsArray.push({ color: {r,g,b,a}, size: size });
        }

        const maxElementSize = Math.max(start.size, end.size);
        const orbitDiameter = settings.containerSize - maxElementSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, orbitDiameter / 2);
        const rotationInRadians = settings.rotation * (Math.PI / 180);
        
        // Tinted image cache for silhouette mode
        const tintedImageCache = {};
        if (settings.useImage && settings.colorMode === 'silhouette' && settings.imageElement) {
             for (const prop of propsArray) {
                const colorKey = `rgb(${prop.color.r},${prop.color.g},${prop.color.b})`;
                if (!tintedImageCache[colorKey]) {
                    tintedImageCache[colorKey] = createTintedImage(settings.imageElement, prop.color);
                }
            }
        }

        for (let i = 0; i < n; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = settings.containerSize;
            canvas.height = settings.containerSize;
            const ctx = canvas.getContext('2d', { alpha: true });
            
            for (let j = 0; j < n; j++) {
                const angle = (n > 0) ? -(j / n) * 2 * Math.PI - Math.PI / 2 + rotationInRadians : 0;
                const x = settings.containerSize / 2 + RADIUS * Math.cos(angle);
                const y = settings.containerSize / 2 + RADIUS * Math.sin(angle);
                const props = propsArray[j];
                
                if (settings.useImage && settings.imageElement) {
                    const img = settings.imageElement;
                    const scale = props.size / Math.max(img.naturalWidth, img.naturalHeight);
                    const w = img.naturalWidth * scale;
                    const h = img.naturalHeight * scale;
                    ctx.globalAlpha = props.color.a;
                    
                    ctx.save();
                    ctx.translate(x, y);

                    if (settings.imageOrientation === 'center') {
                        const rotationInRad = angle + Math.PI / 2;
                        ctx.rotate(rotationInRad);
                    }

                    let imageToDraw;
                    if (settings.colorMode === 'silhouette') {
                        const colorKey = `rgb(${props.color.r},${props.color.g},${props.color.b})`;
                        imageToDraw = tintedImageCache[colorKey];
                    } else {
                        imageToDraw = img;
                    }
                    
                    ctx.drawImage(imageToDraw, -w / 2, -h / 2, w, h);
                    ctx.restore();

                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.beginPath();
                    ctx.arc(x, y, props.size / 2, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(${props.color.r}, ${props.color.g}, ${props.color.b}, ${props.color.a})`;
                    ctx.fill();
                }
            }
            frames.push(canvas);

            if (propsArray.length > 1) {
                propsArray.push(propsArray.shift());
            }
        }
        return frames;
    };

    // --- Initial Run ---
    regenerateAnimation();
});

