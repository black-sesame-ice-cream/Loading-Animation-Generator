document.addEventListener('DOMContentLoaded', () => {
    // --- 要素の取得 ---
    const container = document.getElementById('animation-container');

    // --- グローバル変数 ---
    let colors = [];
    let circleElements = [];
    let animationTimer;

    // --- 保存処理用の関数 ---
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

    // --- 設定項目 ---
    const settings = {
        numCircles: 8,
        circleSize: 50,
        containerSize: 300,
        startColor: { r: 255, g: 255, b: 255, a: 1 },
        endColor: { r: 0, g: 0, b: 0, a: 1 },
        animationInterval: 400,
        marginPercent: 10,
        rotation: 0, // 回転のプロパティを追加 (単位: 度)
        saveAsZip: () => { /* ...保存処理... */ },
        saveAsApng: () => { /* ...保存処理... */ }
    };
    
    // (保存処理の定義)
    settings.saveAsZip = () => startSaving(async () => {
        const frames = generateFrames();
        const zip = new JSZip();
        for (let i = 0; i < frames.length; i++) {
            const blob = await new Promise(resolve => frames[i].toBlob(resolve, 'image/png'));
            zip.file(`frame_${i}.png`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, 'animation_frames.zip');
    });
    settings.saveAsApng = () => startSaving(() => {
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
        downloadFile(blob, 'animation.png');
    });

    // --- アニメーションを再生成するメイン関数 ---
    const regenerateAnimation = () => {
        if (animationTimer) clearInterval(animationTimer);
        container.innerHTML = '';
        colors = [];
        circleElements = [];

        container.style.width = `${settings.containerSize}px`;
        container.style.height = `${settings.containerSize}px`;

        const largeCircleDiameter = settings.containerSize - settings.circleSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, largeCircleDiameter / 2);
        
        // 回転角度を度からラジアンに変換
        const rotationInRadians = settings.rotation * (Math.PI / 180);

        const start = settings.startColor;
        const end = settings.endColor;
        const num = settings.numCircles;

        for (let i = 0; i < num; i++) {
            const ratio = (num === 1) ? 0 : i / (num - 1);
            const r = Math.round(start.r + (end.r - start.r) * ratio);
            const g = Math.round(start.g + (end.g - start.g) * ratio);
            const b = Math.round(start.b + (end.b - start.b) * ratio);
            const a = start.a + (end.a - start.a) * ratio;
            colors.push(`rgba(${r}, ${g}, ${b}, ${a})`);
        }

        for (let i = 0; i < num; i++) {
            // 角度の計算に回転値を加える
            const angle = (num > 0) ? (i / num) * 2 * Math.PI - Math.PI / 2 + rotationInRadians : 0;
            const x = settings.containerSize / 2 + RADIUS * Math.cos(angle);
            const y = settings.containerSize / 2 + RADIUS * Math.sin(angle);
            const circle = document.createElement('div');
            circle.classList.add('circle');
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
            circle.style.width = `${settings.circleSize}px`;
            circle.style.height = `${settings.circleSize}px`;
            circle.style.backgroundColor = colors[i];
            container.appendChild(circle);
            circleElements.push(circle);
        }

        animationTimer = setInterval(() => {
            if (colors.length > 1) {
                colors.unshift(colors.pop());
                circleElements.forEach((circle, index) => {
                    circle.style.backgroundColor = colors[index];
                });
            }
        }, settings.animationInterval);
    };
    
    // --- GUIのセットアップ ---
    const gui = new lil.GUI();
    const generalFolder = gui.addFolder('基本設定');
    generalFolder.add(settings, 'numCircles', 1, 32, 1).name('円の数').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'circleSize', 5, 100, 1).name('円の大きさ').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'containerSize', 100, 800, 10).name('全体の大きさ').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'marginPercent', 0, 100, 1).name('余白率 (%)').onFinishChange(regenerateAnimation);
    generalFolder.add(settings, 'rotation', 0, 360, 1).name('全体回転 (度)').onChange(regenerateAnimation); // 回転スライダーを追加
    generalFolder.add(settings, 'animationInterval', 1, 1000, 1).name('色の移動間隔 (ms)').onFinishChange(regenerateAnimation);

    const startColorFolder = gui.addFolder('最初の色');
    startColorFolder.add(settings.startColor, 'r', 0, 255, 1).name('Red').onFinishChange(regenerateAnimation);
    startColorFolder.add(settings.startColor, 'g', 0, 255, 1).name('Green').onFinishChange(regenerateAnimation);
    startColorFolder.add(settings.startColor, 'b', 0, 255, 1).name('Blue').onFinishChange(regenerateAnimation);
    startColorFolder.add(settings.startColor, 'a', 0, 1, 0.01).name('Alpha').onFinishChange(regenerateAnimation);

    const endColorFolder = gui.addFolder('最後の色');
    endColorFolder.add(settings.endColor, 'r', 0, 255, 1).name('Red').onFinishChange(regenerateAnimation);
    endColorFolder.add(settings.endColor, 'g', 0, 255, 1).name('Green').onFinishChange(regenerateAnimation);
    endColorFolder.add(settings.endColor, 'b', 0, 255, 1).name('Blue').onFinishChange(regenerateAnimation);
    endColorFolder.add(settings.endColor, 'a', 0, 1, 0.01).name('Alpha').onFinishChange(regenerateAnimation);
    
    const saveFolder = gui.addFolder('画像保存');
    saveFolder.add(settings, 'saveAsZip').name('Save as ZIP');
    saveFolder.add(settings, 'saveAsApng').name('Save as APNG');

    // --- 保存処理用のフレーム生成関数 ---
    const generateFrames = () => {
        const frames = [];
        let currentColors = [...colors]; 
        
        const largeCircleDiameter = settings.containerSize - settings.circleSize - (settings.containerSize * (settings.marginPercent / 100));
        const RADIUS = Math.max(0, largeCircleDiameter / 2);
        const rotationInRadians = settings.rotation * (Math.PI / 180);

        for (let i = 0; i < settings.numCircles; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = settings.containerSize;
            canvas.height = settings.containerSize;
            const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let j = 0; j < settings.numCircles; j++) {
                // こちらも同様に回転値を加える
                const angle = (settings.numCircles > 0) ? (j / settings.numCircles) * 2 * Math.PI - Math.PI / 2 + rotationInRadians : 0;
                const x = settings.containerSize / 2 + RADIUS * Math.cos(angle);
                const y = settings.containerSize / 2 + RADIUS * Math.sin(angle);
                ctx.beginPath();
                ctx.arc(x, y, settings.circleSize / 2, 0, 2 * Math.PI);
                ctx.fillStyle = currentColors[j];
                ctx.fill();
            }
            frames.push(canvas);

            if (currentColors.length > 1) {
                currentColors.unshift(currentColors.pop());
            }
        }
        return frames;
    };

    // --- 初期実行 ---
    regenerateAnimation();
});