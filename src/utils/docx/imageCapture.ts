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
    // html-to-image の toPng を実行
    // レイアウト崩れを防ぎ、余白や背景色を綺麗に反映させるためのオプションを指定
    const dataUrl = await toPng(element, {
      cacheBust: true,
      backgroundColor: '#ffffff', // キャプチャ時の背景色を白に固定
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        width: element.style.width || 'auto',
        height: element.style.height || 'auto',
      }
    });
    return dataUrl;
  } catch (error) {
    console.error(`Failed to capture element ${elementId}:`, error);
    return null;
  }
}
