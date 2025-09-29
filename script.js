// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 設定項目 (変更なし) ---
    const NUM_CIRCLES = 8;
    const ANIMATION_INTERVAL = 400;
    const CONTAINER_SIZE = 300;
    const CIRCLE_SIZE = 50;
    
    // --- 要素の取得 (変更なし) ---
    const container = document.getElementById('animation-container');
    const saveButton = document.getElementById('save-button');
    saveButton.textContent = 'Save as APNG';

    // --- 変数定義 (変更なし) ---
    const RADIUS = (CONTAINER_SIZE - CIRCLE_SIZE) / 2;
    const colors = [];
    const circleElements = [];
    let animationTimer;

    // --- 初期化処理 (変更なし) ---
    const startColor = { r: 50, g: 50, b: 50 };
    const endColor = { r: 200, g: 200, b: 200 };
    for (let i = 0; i < NUM_CIRCLES; i++) {
        const ratio = i / (NUM_CIRCLES - 1);
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    for (let i = 0; i < NUM_CIRCLES; i++) {
        const angle = (i / NUM_CIRCLES) * 2 * Math.PI - Math.PI / 2;
        const x = CONTAINER_SIZE / 2 + RADIUS * Math.cos(angle);
        const y = CONTAINER_SIZE / 2 + RADIUS * Math.sin(angle);
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        circle.style.backgroundColor = colors[i];
        container.appendChild(circle);
        circleElements.push(circle);
    }

    // --- アニメーション処理 (変更なし) ---
    const updateColors = () => {
        colors.unshift(colors.pop());
        circleElements.forEach((circle, index) => {
            circle.style.backgroundColor = colors[index];
        });
    };
    animationTimer = setInterval(updateColors, ANIMATION_INTERVAL);

    // ★★★ ここから保存処理をWeb Workerを使うように変更 ★★★
    saveButton.addEventListener('click', () => {
        clearInterval(animationTimer);
        saveButton.disabled = true;
        saveButton.textContent = '1/2: Capturing frames...'; // UIフィードバックを改善

        const canvas = document.createElement('canvas');
        canvas.width = CONTAINER_SIZE;
        canvas.height = CONTAINER_SIZE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        const frames = [];
        const delays = [];
        let currentColors = [...colors];

        // 1. まずはメインスレッドで軽いフレームのキャプチャのみ行う
        for (let i = 0; i < NUM_CIRCLES; i++) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let j = 0; j < NUM_CIRCLES; j++) {
                const angle = (j / NUM_CIRCLES) * 2 * Math.PI - Math.PI / 2;
                const x = CONTAINER_SIZE / 2 + RADIUS * Math.cos(angle);
                const y = CONTAINER_SIZE / 2 + RADIUS * Math.sin(angle);
                ctx.beginPath();
                ctx.arc(x, y, CIRCLE_SIZE / 2, 0, 2 * Math.PI);
                ctx.fillStyle = currentColors[j];
                ctx.fill();
            }
            frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            delays.push(ANIMATION_INTERVAL);
            currentColors.unshift(currentColors.pop());
        }

        // 2. Web Workerを起動し、重いAPNG生成を依頼する
        saveButton.textContent = '2/2: Generating APNG... (Please wait)';
        const worker = new Worker('worker.js');

        // Workerにフレームデータと遅延時間を送信
        worker.postMessage({ frames, delays });

        // 3. Workerからの処理結果を受け取る
        worker.onmessage = (event) => {
            const { success, blob, error } = event.data;

            if (success) {
                // 4. 成功したらダウンロード処理を実行
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'animation.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                alert('APNGの生成に失敗しました。詳細はコンソールを確認してください。');
                console.error('APNG generation failed:', error);
            }
            
            // 5. 後処理
            saveButton.disabled = false;
            saveButton.textContent = 'Save as APNG';
            animationTimer = setInterval(updateColors, ANIMATION_INTERVAL);
            worker.terminate(); // Workerを終了させる
        };

        // Workerでエラーが発生した場合の処理
        worker.onerror = (error) => {
            alert('ワーカー処理中にエラーが発生しました。');
            console.error('Worker error:', error);
            // 後処理
            saveButton.disabled = false;
            saveButton.textContent = 'Save as APNG';
            animationTimer = setInterval(updateColors, ANIMATION_INTERVAL);
            worker.terminate();
        };
    });
});