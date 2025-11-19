// src/api/dify.js

/**
 * Difyへファイルをアップロードする
 * @param {File} file - ブラウザで選択されたファイルオブジェクト
 * @param {string} user - ユーザーID
 * @param {string} apiUrl - APIのベースURL
 * @param {string} apiKey - APIキー
 */
export const uploadFile = async (file, user, apiUrl, apiKey) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user', user);
  // typeはDify側で自動判別されるため指定不要、またはフォームデータに従う

  try {
    // Dify APIマニュアル (POST /files/upload) 準拠
    const response = await fetch(`${apiUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Content-TypeヘッダーはFormData送信時にブラウザが自動設定するため記述しない
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data; // { id, name, created_by, ... }
  } catch (error) {
    console.error('[API] Upload Error:', error);
    throw error;
  }
};