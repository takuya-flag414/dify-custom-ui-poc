/* src/utils/errorHandler.js */

/**
 * エラーメッセージを解析し、UI表示用のデータセットを返します。
 * @param {string|Error} error - エラーオブジェクトまたはメッセージ文字列
 * @returns {Object} { title, description, actionType, errorType }
 */
export const analyzeError = (error) => {
  const msg = (error?.message || error || '').toString();

  // --- 1. 設定未完了 (API Key/URL) ---
  // "API_KEY_MISSING" はアプリ内部で生成する特定コード
  if (msg === 'API_KEY_MISSING' || msg.includes('API KEY or URL not set') || msg.includes('401') || msg.includes('Unauthorized')) {
    return {
      errorType: 'CONFIG_ERROR',
      title: 'API設定が必要です',
      description: 'APIキーまたはエンドポイントURLが設定されていません。「API設定を開く」ボタンから設定を行ってください。',
      actionType: 'config' // 設定ボタンを表示
    };
  }

  // --- 2. 通信エラー / ネットワーク切断 ---
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network request failed')) {
    return {
      errorType: 'NETWORK_ERROR',
      title: '通信エラーが発生しました',
      description: 'サーバーに接続できませんでした。インターネット接続を確認するか、しばらく待ってから再試行してください。',
      actionType: 'retry' // 再試行ボタンを表示
    };
  }

  // --- 3. サーバーエラー / JSONパースエラー ---
  if (msg.includes('JSON') || msg.includes('Unexpected token') || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
    return {
      errorType: 'SERVER_ERROR',
      title: '応答がありませんでした',
      description: 'AIサーバーからの応答形式が正しくありません。一時的な障害の可能性があります。',
      actionType: 'retry'
    };
  }

  // --- 4. その他の予期せぬエラー ---
  return {
    errorType: 'UNKNOWN_ERROR',
    title: '予期せぬエラー',
    description: `処理中にエラーが発生しました: ${msg}`,
    actionType: 'retry'
  };
};

/**
 * 設定未入力時のエラーオブジェクトを生成するヘルパー関数
 */
export const createConfigError = () => {
  return {
    id: `err_${Date.now()}`,
    role: 'system',
    type: 'error',
    rawError: 'API_KEY_MISSING',
    timestamp: new Date().toISOString()
  };
};