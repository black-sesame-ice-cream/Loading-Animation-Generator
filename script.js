document.addEventListener('DOMContentLoaded', () => {
    // --- 要素の取得 ---
    const container = document.getElementById('animation-container');

    // --- グローバル変数 ---
    let animationTimer;
    let circleElements = [];

    // --- ヘルパー関数 ---
    const getTimestamp = () => {
        const now = new Date();
        const Y = now.getFullYear();
        const M = String(now.getMonth() + 1).padStart(2, '0');
        const D = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        return `${Y}${M}${D}${h}${m}${s}`;
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
    
    // 16進数カラーコードをRGBオブジェクトに変換
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 }; // パース失敗時は黒を返す
    };

    // RGB値を16進数カラーコードに変換
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');


    // --- 設定項目 ---
    const settings = {
        numCircles: 8,
        containerSize: 300,
        animationInterval: 400,
        marginPercent: 10,
        rotation: 0,
        headCount: 8,
        
        startCircle: {
            color: { r: 255, g: 255, b: 255, a: 1.0 },
            size: 50
        },
        endCircle: {
            color: { r: 0, g: 0, b: 0, a: 1.0 },
            size: 10
        },

        proxy: {
            startColorRGB: rgbToHex(255, 255, 255),
            startColorAlpha: 1.0,
            endColorRGB: rgbToHex(0, 0, 0),
            endColorAlpha: 1.0
        },

        saveAsZip: () => {},
        saveAsApng: () => {}
    };
    
    settings.saveAsZip = () => startSaving(async () => {
        const timestamp = getTimestamp();
        const frames = generateFrames();
        const zip = new JSZip();
        for (let i = 0; i < frames.length; i++) {
            const blob = await new Promise(resolve => frames[i].toBlob(resolve, 'image/png'));
            zip.file(`loading_animation_${timestamp}_${i}.png`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, `loading_animation_${timestamp}.zip`);
    });
    settings.saveAsApng = () => startSaving(() => {
        const timestamp = getTimestamp();
        const frames = generateFrames();
        const frameBuffers = [];
        const delays = [];
        frames.forEach(canvas => {
            const ctx = canvas.getContext('2d', { alpha: true });
            const imageData = ctx.getImageData(0, 0, settings.containerSize, settings.containerSize);
            frameBuffers.push(imageData.data.buffer);
            delays.push(settings.animationInterval);
        });
        const apngBuffer = UPNG.encode(frameBuffers, settings.containerSize, settings.containerSize, 0, delays);
        const blob = new Blob([apngBuffer], { type: 'image/png' });
        downloadFile(blob, `loading_animation_${timestamp}.png`);
    });

    // --- アニメーションを再生成するメイン関数 ---
    const regenerateAnimation = () => {
        if (animationTimer) clearInterval(animationTimer);
        container.innerHTML = '';
        const circleProps = [];
        circleElements = [];

        container.style.width = `${settings.containerSize}px`;
        container.style.height = `${settings.containerSize}px`;

        const maxCircleSize = Math.max(settings.startCircle.size, settings.endCircle.size);
        const largeCircleDiameter = settings.containerSize - maxCircleSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, largeCircleDiameter / 2);
        
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
            circleProps.push({ color: `rgba(${r}, ${g}, ${b}, ${a})`, size: size });
        }

        for (let i = 0; i < n; i++) {
            const angle = (n > 0) ? -(i / n) * 2 * Math.PI - Math.PI / 2 + rotationInRadians : 0;
            const x = settings.containerSize / 2 + RADIUS * Math.cos(angle);
            const y = settings.containerSize / 2 + RADIUS * Math.sin(angle);
            const circle = document.createElement('div');
            circle.classList.add('circle');
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
            circle.style.width = `${circleProps[i].size}px`;
            circle.style.height = `${circleProps[i].size}px`;
            circle.style.backgroundColor = circleProps[i].color;
            container.appendChild(circle);
            circleElements.push(circle);
        }

        animationTimer = setInterval(() => {
            if (circleProps.length > 1) {
                circleProps.push(circleProps.shift());
                circleElements.forEach((circle, index) => {
                    circle.style.backgroundColor = circleProps[index].color;
                    circle.style.width = `${circleProps[index].size}px`;
                    circle.style.height = `${circleProps[index].size}px`;
                });
            }
        }, settings.animationInterval);
    };
    
    // --- GUIのセットアップ ---
    const gui = new lil.GUI();
    const generalFolder = gui.addFolder('基本設定');
    generalFolder.add(settings, 'numCircles', 1, 24, 1).name('円の数 (n)').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'headCount', 1, 24, 1).name('先頭数 (m)').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'containerSize', 100, 800, 10).name('全体の大きさ').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'marginPercent', 0, 100, 1).name('余白率 (%)').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'rotation', 0, 360, 1).name('全体回転 (度)').onChange(regenerateAnimation);
    generalFolder.add(settings, 'animationInterval', 1, 1000, 1).name('色の移動間隔 (ms)').onFinishChange(regenerateAnimation);

    const startCircleFolder = gui.addFolder('先頭円');
    startCircleFolder.addColor(settings.proxy, 'startColorRGB').name('色 (RGB)')
        .onFinishChange(value => {
            const rgb = hexToRgb(value);
            settings.startCircle.color.r = rgb.r;
            settings.startCircle.color.g = rgb.g;
            settings.startCircle.color.b = rgb.b;
            regenerateAnimation();
        });
    startCircleFolder.add(settings.proxy, 'startColorAlpha', 0, 1, 0.01).name('透明度 (Alpha)')
        .onFinishChange(value => {
            settings.startCircle.color.a = value;
            regenerateAnimation();
        });
    startCircleFolder.add(settings.startCircle, 'size', 0, 100, 1).name('大きさ').onFinishChange(regenerateAnimation);

    const endCircleFolder = gui.addFolder('末尾円');
    endCircleFolder.addColor(settings.proxy, 'endColorRGB').name('色 (RGB)')
        .onFinishChange(value => {
            const rgb = hexToRgb(value);
            settings.endCircle.color.r = rgb.r;
            settings.endCircle.color.g = rgb.g;
            settings.endCircle.color.b = rgb.b;
            regenerateAnimation();
        });
    endCircleFolder.add(settings.proxy, 'endColorAlpha', 0, 1, 0.01).name('透明度 (Alpha)')
        .onFinishChange(value => {
            settings.endCircle.color.a = value;
            regenerateAnimation();
        });
    endCircleFolder.add(settings.endCircle, 'size', 0, 100, 1).name('大きさ').onFinishChange(regenerateAnimation);
    
    const saveFolder = gui.addFolder('画像保存');
    saveFolder.add(settings, 'saveAsZip').name('Save as ZIP');
    saveFolder.add(settings, 'saveAsApng').name('Save as APNG');

    // --- 保存処理用のフレーム生成関数 ---
    const generateFrames = () => {
        const frames = [];
        let currentProps = [...container.children].map(el => ({
            color: el.style.backgroundColor,
            size: parseFloat(el.style.width)
        }));

        const maxCircleSize = Math.max(settings.startCircle.size, settings.endCircle.size);
        const largeCircleDiameter = settings.containerSize - maxCircleSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, largeCircleDiameter / 2);
        const rotationInRadians = settings.rotation * (Math.PI / 180);

        for (let i = 0; i < settings.numCircles; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = settings.containerSize;
            canvas.height = settings.containerSize;
            const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let j = 0; j < settings.numCircles; j++) {
                const angle = (settings.numCircles > 0) ? -(j / settings.numCircles) * 2 * Math.PI - Math.PI / 2 + rotationInRadians : 0;
                const x = settings.containerSize / 2 + RADIUS * Math.cos(angle);
                const y = settings.containerSize / 2 + RADIUS * Math.sin(angle);
                const props = currentProps[j];
                ctx.beginPath();
                ctx.arc(x, y, props.size / 2, 0, 2 * Math.PI);
                ctx.fillStyle = props.color;
                ctx.fill();
            }
            frames.push(canvas);

            if (currentProps.length > 1) {
                currentProps.push(currentProps.shift());
            }
        }
        return frames;
    };

    // --- 初期実行 ---
    regenerateAnimation();
});