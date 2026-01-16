// src/tests/api/connectionTest.js
// API接続テスト（Real/BEモードのみ）

export const connectionTest = {
  id: 'api-connection',
  name: 'API接続確認',
  category: 'api',
  description: 'Dify APIへの接続が正常か確認',
  
  async run(context) {
    const { mockMode, apiKey, apiUrl, addLog } = context;
    
    addLog?.('[Test:APIConnection] 開始', 'info');
    
    // FEモードではスキップ
    if (mockMode === 'FE') {
      return {
        success: true,
        message: 'FEモードのためスキップ',
        skipped: true,
      };
    }
    
    // 設定確認
    if (!apiKey || !apiUrl) {
      return {
        success: false,
        message: 'API設定が不完全です',
      };
    }
    
    try {
      // 簡易的な接続テスト（HEADリクエスト）
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/parameters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        addLog?.('[Test:APIConnection] ✅ 接続成功', 'info');
        return {
          success: true,
          message: `接続成功 (${response.status})`,
        };
      } else {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        addLog?.('[Test:APIConnection] ❌ タイムアウト', 'error');
        return {
          success: false,
          message: 'タイムアウト (5秒)',
        };
      }
      
      addLog?.(`[Test:APIConnection] ❌ ${e.message}`, 'error');
      return {
        success: false,
        message: e.message,
      };
    }
  },
};
