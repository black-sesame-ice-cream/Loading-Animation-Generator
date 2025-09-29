# Loading Animation Generator
## Overview
This is a web tool for generating loading animations. You can customize the number, size, color, and motion of the elements to create your own unique animation. It supports both simple circles and user-uploaded PNG images as animation elements. The created animations can be exported as a sequence of PNG images (in a ZIP file) or as an APNG file.

## 概要
これはローディングアニメーションを生成するためのWebツールです。要素の数、大きさ、色、動きをカスタマイズして、独自のアニメーションを作成できます。アニメーションの要素として、シンプルな円とユーザーがアップロードしたPNG画像の両方をサポートしています。作成したアニメーションは、連番のPNG画像（ZIPファイル形式）またはAPNGファイルとしてエクスポートできます。

## Demo
You can try this tool on the page below.

https://black-sesame-ice-cream.github.io/Loading-Animation-Generator/

## デモ
以下のページでこのツールを試すことができます。

https://black-sesame-ice-cream.github.io/Loading-Animation-Generator/

## Controls
### General Settings
- Number of Elements: Adjusts the total number of circles or images in the animation.

- Gradient Length: Sets the number of elements over which the gradient (from the start element to the end element) is applied.

- Container Size (px): Changes the width and height of the animation canvas.

- Margin (%): Defines the empty space from the edge of the container to the animation's orbit.

- Global Rotation (deg): Rotates the entire animation around its center.

- Loop Time (ms): Sets the duration for one full animation cycle, in milliseconds.

### Start Element / End Element
- Color (RGB): Sets the color of the element. This is disabled when using an image in 'original' color mode.

- Opacity (Alpha): Controls the transparency of the element.

- Size: Determines the size (diameter for circles, length of the longest side for images) of the element.

### Image Settings
- Select Image...: Opens a file dialog to upload a PNG image.

- Use Image: Toggles between using the default circles and the uploaded PNG image. The checkbox label will show the filename.

- Color Mode:

    - silhouette: Tints the uploaded image with the colors set in the Start/End Element panels.

    - original: Uses the original colors of the uploaded image.

- Image Orientation:

    - fixed: All images maintain the same orientation.

    - center: Each image rotates to face the center of the animation.

- Remove Image: Discards the uploaded image and reverts to using circles.

### Export
- Save as PNG (ZIP): Exports the animation as a sequence of individual PNG frames, packaged in a ZIP file.

- Save as APNG: Exports the animation as a single Animated PNG (APNG) file.

## 各種設定

### 一般設定

- Number of Elements (要素の数): アニメーションに含まれる円または画像の総数を設定します。

- Gradient Length (グラデーションの長さ): 開始要素から終了要素へのグラデーションが適用される要素の数を設定します。

- Container Size (px) (全体の大きさ): アニメーションのキャンバスの幅および高さを設定します。

- Margin (%) (余白): キャンバスの端からアニメーションの軌道までの空白スペースを設定します。

- Global Rotation (deg) (全体回転): アニメーション全体をその中心を軸に回転させます。

- Loop Time (ms) (1ループの時間): アニメーションの1サイクルにかかる時間をミリ秒単位で設定します。

### 開始要素 / 終了要素
- Color (RGB) (色): 要素の色を設定します。画像を「オリジナル」カラーモードで使用している場合は無効になります。

- Opacity (Alpha) (透明度): 要素の透明度を設定します。

- Size (大きさ): 要素の大きさ（円の場合は直径、画像の場合は長辺の長さ）を設定します。

### 画像設定
- Select Image... (画像を選択...): PNG画像をアップロードするためのファイルダイアログを開きます。

- Use Image (画像を使用): デフォルトの円とアップロードされたPNG画像の使用を切り替えます。チェックボックスのラベルにはファイル名が表示されます。

- Color Mode (カラーモード):

    - silhouette (シルエット): アップロードされた画像を、開始/終了要素パネルで設定された色で塗りつぶします。

    - original (オリジナル): アップロードされた画像の元の色を使用します。

- Image Orientation (画像の向き):

    - fixed (固定): すべての画像が同じ向きを維持します。

    - center (中心を向く): 各画像がアニメーションの中心を向くように回転します。

- Remove Image (画像を削除): アップロードされた画像を破棄し、円の使用に戻ります。

### エクスポート
- Save as PNG (ZIP): アニメーションを個別のPNGフレームのシーケンスとして、ZIPファイルにパッケージ化してエクスポートします。

- Save as APNG: アニメーションを単一のアニメーションPNG（APNG）ファイルとしてエクスポートします。

## Tech Stack
HTML

CSS

JavaScript

lil-gui (for the control panel)

JSZip (for creating ZIP files)

UPNG.js (for creating APNG files)