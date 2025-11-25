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

  try {
    const response = await fetch(`${apiUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Upload Error:', error);
    throw error;
  }
};

/**
 * 会話リストを取得する
 * @param {string} user - ユーザーID
 * @param {string} apiUrl - APIのベースURL
 * @param {string} apiKey - APIキー
 * @param {number} limit - 取得件数
 */
export const fetchConversationsApi = async (user, apiUrl, apiKey, limit = 20) => {
  const response = await fetch(
    `${apiUrl}/conversations?user=${user}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(`Failed to fetch conversations: ${errData.message || response.status}`);
  }
  return await response.json();
};

/**
 * 特定の会話のメッセージ履歴を取得する
 * @param {string} conversationId - 会話ID
 * @param {string} user - ユーザーID
 * @param {string} apiUrl - APIのベースURL
 * @param {string} apiKey - APIキー
 * @param {number} limit - 取得件数
 */
export const fetchMessagesApi = async (conversationId, user, apiUrl, apiKey, limit = 50) => {
  const response = await fetch(
    `${apiUrl}/messages?conversation_id=${conversationId}&user=${user}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(`Failed to fetch messages: ${errData.message || response.status}`);
  }
  return await response.json();
};

/**
 * チャットメッセージを送信する（ストリーミング）
 * @param {Object} payload - 送信データ
 * @param {string} apiUrl - APIのベースURL
 * @param {string} apiKey - APIキー
 * @returns {Promise<Response>} fetchのResponseオブジェクト
 */
export const sendChatMessageApi = async (payload, apiUrl, apiKey) => {
  const response = await fetch(`${apiUrl}/chat-messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.code || 'API Error');
  }
  
  return response;
};

/**
 * 提案された質問を取得する
 * @param {string} messageId - メッセージID
 * @param {string} user - ユーザーID
 * @param {string} apiUrl - APIのベースURL
 * @param {string} apiKey - APIキー
 */
export const fetchSuggestionsApi = async (messageId, user, apiUrl, apiKey) => {
  const response = await fetch(`${apiUrl}/messages/${messageId}/suggested?user=${user}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  
  if (!response.ok) {
    // 失敗しても致命的ではないため、nullを返すかエラーを投げるか呼び出し元で判断
    // ここではエラーを投げる
    throw new Error(`Failed to fetch suggestions: ${response.status}`);
  }
  
  return await response.json();
};