import { Paragraph, ImageRun, TextRun } from 'docx';

/**
 * Base64のData URLを Blob に変換する（ブラウザ環境で最も安定して画像埋め込みを行う手法）
 */
function base64ToBlob(base64Str: string): Blob {
  const parts = base64Str.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const raw = window.atob(parts[1] || parts[0]);
  const uint8Array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    uint8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uint8Array], { type: mime });
}

/**
 * 画像キャプチャ対象のブロック（Chart, Svg）を画像要素としてWordに埋め込む
 */
export function renderImageBlock(
  block: any,
  pageIndex: number,
  blockIndex: number,
  imageCache: Map<string, string>
): Paragraph[] {
  const elementId = `json-doc-block-${pageIndex}-${blockIndex}`;
  const dataUrl = imageCache.get(elementId);

  if (!dataUrl) {
    console.warn(`Image URL not found in cache for block ID: ${elementId}`);
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

  // Blobデータを生成
  const blob = base64ToBlob(dataUrl);

  // 用紙サイズ（標準A4印刷幅: 約 450〜500pt）に合わせた表示サイズの初期設定
  let width = 450;
  let height = 300;

  if (block.type === 'svg') {
    width = 450;
    height = 200;
  } else if (block.type === 'chart') {
    width = 450;
    height = 280;
  }

  return [
    new Paragraph({
      children: [
        new ImageRun({
          data: blob, // Uint8ArrayではなくBlobを渡すことで、Zip内部での破損を防止
          transformation: {
            width: width,
            height: height,
          },
        } as any),
      ],
      spacing: {
        before: 120,
        after: 120,
      },
    }),
  ];
}
