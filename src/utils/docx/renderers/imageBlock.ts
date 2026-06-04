import { Paragraph, ImageRun, TextRun, AlignmentType } from 'docx';

/**
 * DataURL (base64文字列) を Uint8Array に変換する
 * docx ライブラリは Uint8Array を公式サポートしており、
 * Blob を as any で渡す方法より確実に動作する
 */
function base64ToUint8Array(dataUrl: string): Uint8Array {
  // "data:image/png;base64,iVBOR..." から Base64部分のみを抽出
  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binaryStr = window.atob(base64Data);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * 画像キャプチャ対象のブロック（Chart, Svg, Mermaid）を画像要素としてWordに埋め込む
 * ImageRun.data には docx 公式サポート型である Uint8Array を渡す
 */
export function renderImageBlock(
  block: any,
  pageIndex: number,
  blockIndex: number,
  imageCache: Map<string, string>
): Paragraph[] {
  // ブロックタイプも含めた一意なDOMのIDで画像キャッシュを参照
  const elementId = `json-doc-block-${pageIndex}-${blockIndex}-${block.type}`;
  console.log(`[ImageBlock] 画像取得: elementId="${elementId}" (type=${block.type})`);

  const cacheValue = imageCache.get(elementId);

  if (!cacheValue) {
    console.error(`[ImageBlock] ✕ キャッシュで画像が見つかりません: "${elementId}"`);
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: `[画像データの取得に失敗しました: ${block.type}]`,
            color: 'FF0000',
          }),
        ],
      }),
    ];
  }

  let dataUrl: string;
  let originalWidth = 450;
  let originalHeight = 300;

  try {
    const parsed = JSON.parse(cacheValue);
    dataUrl = parsed.dataUrl;
    originalWidth = parsed.width || 450;
    originalHeight = parsed.height || 300;
  } catch (e) {
    // 過去互換（単一文字列だった場合）
    dataUrl = cacheValue;
    if (block.type === 'svg') originalHeight = 200;
    else if (block.type === 'chart') originalHeight = 280;
    else if (block.type === 'mermaid') originalHeight = 350;
  }

  // DataURL → Uint8Array に変換（docx ライブラリが公式サポートする型）
  const uint8Array = base64ToUint8Array(dataUrl);
  console.log(`[ImageBlock] ✓ Uint8Array変換完了: ${uint8Array.length} bytes`);

  // 用紙サイズ（標準A4印刷幅: 約 450〜500pt）に合わせたアスペクト比の維持
  const maxWidth = 490; // A4印刷幅の実用的な最大値
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > maxWidth) {
    const ratio = maxWidth / originalWidth;
    targetWidth = maxWidth;
    targetHeight = Math.round(originalHeight * ratio);
  }

  console.log(`[ImageBlock] ✓ Word埋め込みサイズ: ${targetWidth}x${targetHeight}`);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          // Uint8Array を直接渡す（docx 公式サポート型）
          data: uint8Array,
          transformation: {
            width: targetWidth,
            height: targetHeight,
          },
          type: 'png',
        } as any),
      ],
      spacing: {
        before: 120,
        after: 120,
      },
    }),
  ];
}
