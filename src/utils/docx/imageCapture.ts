import { toPng } from 'html-to-image';

/**
 * 指定されたIDのDOM要素をPNG画像（Data URL）としてキャプチャする
 * @param elementId DOM要素のID
 * @returns Base64データURL、取得失敗時はnull
 */
export async function captureElementById(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`DOM element not found for capture: ${elementId}`);
    return null;
  }

  try {
    const width = element.offsetWidth || 500;
    const height = element.offsetHeight || 300;

    // html-to-image の toPng を実行
    // レイアウト崩れを防ぎ、余白や背景色を綺麗に反映させるためのオプションを指定
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2, // 高解像度キャプチャを有効化 (品質向上)
      backgroundColor: '#ffffff', // キャプチャ時の背景色を白に固定
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        width: element.style.width || 'auto',
        height: element.style.height || 'auto',
      }
    });
    // 寸法情報と一緒にJSON文字列化して返す
    return JSON.stringify({ dataUrl, width, height });
  } catch (error) {
    console.error(`Failed to capture element ${elementId}:`, error);
    return null;
  }
}
