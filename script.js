document.addEventListener('DOMContentLoaded', () => {
    // --- Get Elements ---
    const container = document.getElementById('animation-container');

    // --- Global Variables ---
    let animationTimer;
    let elements = []; // Will store { container, outline, image } objects
    let guiControllers = {};
    const DEFAULT_CIRCLE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGESURBVHhe7doxAQAwEAOh+jed9B8sHIqAH9szHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHnAeMB5wHnAeMB5wHjAecB4wHjAecB4wHnAeMB5wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHnAeMB5wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHnAeMB5wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB5wHjAecB4wHnAeMB5wHnAeMB5wHnAeMB5wHjAecB4wHnAeMB4wHhABj2sBGguLA1cAAAAASUVORK5CYII=';
    const DEFAULT_STICK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEVSURBVHhe7dihAcAwEATR/p/2b3hIQUjYvYc8s2sDIDMAmQDIBCATgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgEwAZAIgEwCYAMgEgMwAZg4sBjd4fI82nAAAAAElFTkSuQmCC';

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
        
        startElement: {
            tintColor: { r: 155, g: 155, b: 155 },
            tintAlpha: 1.0,
            opacity: 1.0,
            size: 50
        },
        endElement: {
            tintColor: { r: 50, g: 50, b: 50 },
            tintAlpha: 0.0,
            opacity: 1.0,
            size: 0
        },

        outline: {
            enable: false,
            color: { r: 255, g: 255, b: 255 },
            width: 5 
        },

        proxy: {
            startTintColorRGB: rgbToHex(155, 155, 155),
            startTintAlpha: 1.0,
            startOpacity: 1.0,
            endTintColorRGB: rgbToHex(50, 50, 50),
            endTintAlpha: 0.0,
            endOpacity: 1.0,
            outlineColorRGB: rgbToHex(255, 255, 255)
        },
        
        userUploadedImageElement: null,
        defaultCircleElement: null,
        defaultStickElement: null,
        imageFilename: null,
        imageOrientation: 'fixed',

        uploadImage: () => {
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
                        settings.userUploadedImageElement = img;
                        settings.outline.enable = false;
                        guiControllers.enableOutline.updateDisplay();
                        regenerateAnimation();
                    };
                    img.src = res.target.result;
                };
                reader.readAsDataURL(file);
            };
            input.click();
        },
        useDefaultCircle: () => {
            settings.userUploadedImageElement = null;
            settings.imageFilename = 'circle.png';
            settings.outline.enable = false;
            guiControllers.enableOutline.updateDisplay();
            regenerateAnimation();
        },
        useDefaultStick: () => {
            settings.userUploadedImageElement = null;
            settings.imageFilename = 'stick.png';
            settings.outline.enable = false;
            guiControllers.enableOutline.updateDisplay();
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

    const applyTint = (image, tintColor, tintAlpha) => {
        const canvas = document.createElement('canvas');
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        ctx.drawImage(image, 0, 0);

        if (tintAlpha > 0) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) {
                    const origR = data[i];
                    const origG = data[i + 1];
                    const origB = data[i + 2];

                    data[i]   = tintColor.r * tintAlpha + origR * (1 - tintAlpha);
                    data[i+1] = tintColor.g * tintAlpha + origG * (1 - tintAlpha);
                    data[i+2] = tintColor.b * tintAlpha + origB * (1 - tintAlpha);
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }
        return canvas;
    };

    const createOutlineOnlyImage = (baseImage, outlineWidth, outlineColorRgb) => {
        const sw = baseImage.width;
        const sh = baseImage.height;
        const padding = Math.ceil(outlineWidth);
        const dw = sw + padding * 2;
        const dh = sh + padding * 2;

        const canvas = document.createElement('canvas');
        canvas.width = dw;
        canvas.height = dh;
        const ctx = canvas.getContext('2d');
        
        const silhouetteCanvas = document.createElement('canvas');
        silhouetteCanvas.width = sw;
        silhouetteCanvas.height = sh;
        const silhouetteCtx = silhouetteCanvas.getContext('2d');
        silhouetteCtx.drawImage(baseImage, 0, 0);
        silhouetteCtx.globalCompositeOperation = 'source-in';
        silhouetteCtx.fillStyle = `rgb(${outlineColorRgb.r}, ${outlineColorRgb.g}, ${outlineColorRgb.b})`;
        silhouetteCtx.fillRect(0, 0, sw, sh);

        const step = 1;
        for (let y = -outlineWidth; y <= outlineWidth; y += step) {
            for (let x = -outlineWidth; x <= outlineWidth; x += step) {
                if (x * x + y * y <= outlineWidth * outlineWidth) {
                    ctx.drawImage(silhouetteCanvas, padding + x, padding + y);
                }
            }
        }
        
        return canvas;
    };
    
    let propsArray = [];

    // --- Animation Update and Regeneration ---
    const updateGui = () => {
        let filename = settings.imageFilename || 'circle.png';
        if (filename.length > 20) {
            filename = filename.substring(0, 17) + '...';
        }
        guiControllers.imageFilename.name(`Current: ${filename}`);
        
        const hasUserImage = !!settings.userUploadedImageElement;
        guiControllers.useDefaultCircle.domElement.style.display = hasUserImage ? 'block' : 'none';
        guiControllers.useDefaultStick.domElement.style.display = hasUserImage ? 'block' : 'none';
        guiControllers.imageOrientation.domElement.style.display = hasUserImage ? 'block' : 'none';
    };

    const regenerateAnimation = () => {
        if (animationTimer) clearInterval(animationTimer);
        container.innerHTML = '';
        elements = [];
        
        updateGui();
        
        propsArray = [];
        const start = settings.startElement;
        const end = settings.endElement;
        const n = settings.numCircles;
        const m = settings.headCount;
        const gradientLength = Math.min(n, m);

        for (let i = 0; i < n; i++) {
            let r, g, b, tintAlpha, opacity, size;
            if (i < gradientLength) {
                const ratio = (gradientLength <= 1) ? 0 : i / (gradientLength - 1);
                r = Math.round(start.tintColor.r + (end.tintColor.r - start.tintColor.r) * ratio);
                g = Math.round(start.tintColor.g + (end.tintColor.g - start.tintColor.g) * ratio);
                b = Math.round(start.tintColor.b + (end.tintColor.b - start.tintColor.b) * ratio);
                tintAlpha = start.tintAlpha + (end.tintAlpha - start.tintAlpha) * ratio;
                opacity = start.opacity + (end.opacity - start.opacity) * ratio;
                size = start.size + (end.size - start.size) * ratio;
            } else {
                r = end.tintColor.r; g = end.tintColor.g; b = end.tintColor.b;
                tintAlpha = end.tintAlpha;
                opacity = end.opacity;
                size = end.size;
            }
            propsArray.push({ tintColor: {r,g,b}, tintAlpha, opacity, size });
        }
        
        let sourceImage;
        if(settings.imageFilename === 'stick.png') {
            sourceImage = settings.defaultStickElement;
        } else if (settings.userUploadedImageElement) {
            sourceImage = settings.userUploadedImageElement;
        } else {
            sourceImage = settings.defaultCircleElement;
        }

        let maxElementSize = Math.max(settings.startElement.size, settings.endElement.size);
        if (settings.outline.enable) {
            maxElementSize += settings.outline.width * 2;
        }
        const orbitDiameter = settings.containerSize - maxElementSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, orbitDiameter / 2);
        
        const rotationInRadians = settings.rotation * (Math.PI / 180);

        const outlineOnlyImageURL = settings.outline.enable ? createOutlineOnlyImage(sourceImage, settings.outline.width, settings.outline.color).toDataURL() : null;

        const tintedImageCache = {};
        propsArray.forEach(prop => {
            const colorKey = `rgba(${prop.tintColor.r},${prop.tintColor.g},${prop.tintColor.b},${prop.tintAlpha.toFixed(2)})`;
            if (!tintedImageCache[colorKey]) {
                const tintedCanvas = applyTint(sourceImage, prop.tintColor, prop.tintAlpha);
                tintedImageCache[colorKey] = tintedCanvas.toDataURL();
            }
        });

        for (let i = 0; i < settings.numCircles; i++) {
            const elementContainer = document.createElement('div');
            elementContainer.className = 'element-container';
            
            let outlineLayer = null;
            if (settings.outline.enable) {
                outlineLayer = document.createElement('div');
                outlineLayer.className = 'outline-layer';
                outlineLayer.style.backgroundImage = `url(${outlineOnlyImageURL})`;
                elementContainer.appendChild(outlineLayer);
            }
            
            const imageLayer = document.createElement('div');
            imageLayer.className = 'image-layer';
            elementContainer.appendChild(imageLayer);

            container.appendChild(elementContainer);
            elements.push({ container: elementContainer, outline: outlineLayer, image: imageLayer });
        }
        
        const updateElements = (localPropsArray) => {
            elements.forEach((el, index) => {
                const currentProps = localPropsArray[index];
                const scale = currentProps.size / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight);
                
                const imageWidth = sourceImage.naturalWidth * scale;
                const imageHeight = sourceImage.naturalHeight * scale;
                
                let containerWidth = imageWidth;
                let containerHeight = imageHeight;
                
                if(el.outline){
                     containerWidth += settings.outline.width * 2;
                     containerHeight += settings.outline.width * 2;
                }

                el.container.style.width = `${containerWidth}px`;
                el.container.style.height = `${containerHeight}px`;
                el.container.style.opacity = currentProps.opacity;
                
                const angle = (settings.numCircles > 0) ? -(index / settings.numCircles) * 2 * Math.PI - Math.PI / 2 + rotationInRadians : 0;
                const x = settings.containerSize / 2 + RADIUS * Math.cos(angle);
                const y = settings.containerSize / 2 + RADIUS * Math.sin(angle);

                el.container.style.left = `${x}px`;
                el.container.style.top = `${y}px`;

                if (settings.imageOrientation === 'center' && settings.userUploadedImageElement) {
                    const rotationInRad = angle + Math.PI / 2;
                    el.container.style.transform = `translate(-50%, -50%) rotate(${rotationInRad}rad)`;
                } else {
                    el.container.style.transform = `translate(-50%, -50%)`;
                }
                
                if (el.outline) {
                    el.outline.style.width = '100%';
                    el.outline.style.height = '100%';
                }
                
                el.image.style.width = `${imageWidth}px`;
                el.image.style.height = `${imageHeight}px`;
                const colorKey = `rgba(${currentProps.tintColor.r},${currentProps.tintColor.g},${currentProps.tintColor.b},${currentProps.tintAlpha.toFixed(2)})`;
                el.image.style.backgroundImage = `url(${tintedImageCache[colorKey]})`;
            });
        };
        
        let animationProps = [...propsArray];
        updateElements(animationProps);

        const stepInterval = settings.numCircles > 1 ? settings.loopTime / settings.numCircles : settings.loopTime;
        animationTimer = setInterval(() => {
            if (animationProps.length > 1) {
                animationProps.push(animationProps.shift());
                updateElements(animationProps);
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

    const startFolder = gui.addFolder('Start Element');
    startFolder.addColor(settings.proxy, 'startTintColorRGB').name('Tint Color (RGB)')
        .onFinishChange(value => {
            settings.startElement.tintColor = hexToRgb(value);
            regenerateAnimation();
        });
    startFolder.add(settings.proxy, 'startTintAlpha', 0, 1, 0.01).name('Tint Alpha').onFinishChange(value => {
        settings.startElement.tintAlpha = value; regenerateAnimation();
    });
    startFolder.add(settings.proxy, 'startOpacity', 0, 1, 0.01).name('Opacity').onFinishChange(value => {
        settings.startElement.opacity = value; regenerateAnimation();
    });
    startFolder.add(settings.startElement, 'size', 0, 200, 1).name('Size').onFinishChange(regenerateAnimation);

    const endFolder = gui.addFolder('End Element');
    endFolder.addColor(settings.proxy, 'endTintColorRGB').name('Tint Color (RGB)')
        .onFinishChange(value => {
            settings.endElement.tintColor = hexToRgb(value);
            regenerateAnimation();
        });
    endFolder.add(settings.proxy, 'endTintAlpha', 0, 1, 0.01).name('Tint Alpha').onFinishChange(value => {
        settings.endElement.tintAlpha = value; regenerateAnimation();
    });
     endFolder.add(settings.proxy, 'endOpacity', 0, 1, 0.01).name('Opacity').onFinishChange(value => {
        settings.endElement.opacity = value; regenerateAnimation();
    });
    endFolder.add(settings.endElement, 'size', 0, 200, 1).name('Size').onFinishChange(regenerateAnimation);

    const imageFolder = gui.addFolder('Image Settings');
    imageFolder.add(settings, 'uploadImage').name('Upload Custom Image...');
    guiControllers.useDefaultCircle = imageFolder.add(settings, 'useDefaultCircle').name('Use Default Circle');
    guiControllers.useDefaultStick = imageFolder.add(settings, 'useDefaultStick').name('Use Default Stick');
    guiControllers.imageFilename = imageFolder.add({filename: ''}, 'filename').name('Current:').listen();
    guiControllers.imageFilename.domElement.style.pointerEvents = 'none';
    guiControllers.imageOrientation = imageFolder.add(settings, 'imageOrientation', ['fixed', 'center']).name('Image Orientation').onFinishChange(regenerateAnimation);

    const outlineFolder = gui.addFolder('Outline Settings');
    guiControllers.enableOutline = outlineFolder.add(settings.outline, 'enable').name('Enable Outline').onFinishChange(regenerateAnimation);
    outlineFolder.addColor(settings.proxy, 'outlineColorRGB').name('Color (RGB)')
        .onFinishChange(value => {
            settings.outline.color = hexToRgb(value);
            if(settings.outline.enable) regenerateAnimation();
        });
    outlineFolder.add(settings.outline, 'width', 0, 25, 0.1).name('Width (px)').onFinishChange(()=> {
        if(settings.outline.enable) regenerateAnimation();
    });
    
    const saveFolder = gui.addFolder('Export');
    saveFolder.add(settings, 'saveAsZip').name('Save as PNG (ZIP)');
    saveFolder.add(settings, 'saveAsApng').name('Save as APNG');

    // --- Frame Generation for Saving ---
    const generateFrames = async () => {
        const frames = [];
        const n = settings.numCircles;
        let frameProps = [...propsArray];
        
        let sourceImage;
        if(settings.imageFilename === 'stick.png') {
            sourceImage = settings.defaultStickElement;
        } else {
            sourceImage = settings.userUploadedImageElement || settings.defaultCircleElement;
        }

        let maxElementSize = Math.max(settings.startElement.size, settings.endElement.size);
         if (settings.outline.enable) {
            maxElementSize += settings.outline.width * 2;
        }
        const orbitDiameter = settings.containerSize - maxElementSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, orbitDiameter / 2);
        const rotationInRadians = settings.rotation * (Math.PI / 180);
        
        const outlineImage = settings.outline.enable ? createOutlineOnlyImage(sourceImage, settings.outline.width, settings.outline.color) : null;
        
        const tintedImageCache = {};
        for (const prop of frameProps) {
            const colorKey = `rgba(${prop.tintColor.r},${prop.tintColor.g},${prop.tintColor.b},${prop.tintAlpha.toFixed(2)})`;
            if (!tintedImageCache[colorKey]) {
                tintedImageCache[colorKey] = applyTint(sourceImage, prop.tintColor, prop.tintAlpha);
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
                const props = frameProps[j];
                const scale = props.size / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight);
                
                ctx.save();
                ctx.translate(x, y);

                if (settings.imageOrientation === 'center' && settings.userUploadedImageElement) {
                    const rotationInRad = angle + Math.PI / 2;
                    ctx.rotate(rotationInRad);
                }

                ctx.globalAlpha = props.opacity;

                // Draw Outline Layer
                if (outlineImage) {
                    const outlineW = outlineImage.width * scale;
                    const outlineH = outlineImage.height * scale;
                    ctx.drawImage(outlineImage, -outlineW / 2, -outlineH / 2, outlineW, outlineH);
                }

                // Draw Image Layer
                const colorKey = `rgba(${props.tintColor.r},${props.tintColor.g},${props.tintColor.b},${props.tintAlpha.toFixed(2)})`;
                const imageToDraw = tintedImageCache[colorKey];
                const w = imageToDraw.width * scale;
                const h = imageToDraw.height * scale;
                ctx.drawImage(imageToDraw, -w / 2, -h / 2, w, h);

                ctx.restore();
            }
            frames.push(canvas);

            if (frameProps.length > 1) {
                frameProps.push(frameProps.shift());
            }
        }
        return frames;
    };

    // --- Initial Run ---
    const defaultCircleImg = new Image();
    defaultCircleImg.onload = () => {
        settings.defaultCircleElement = defaultCircleImg;
        const defaultStickImg = new Image();
        defaultStickImg.onload = () => {
            settings.defaultStickElement = defaultStickImg;
            regenerateAnimation();
        };
        defaultStickImg.src = DEFAULT_STICK_IMAGE;
    };
    defaultCircleImg.src = DEFAULT_CIRCLE_IMAGE;
});
