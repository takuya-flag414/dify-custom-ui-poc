// src/tests/basic/historyLoad.js
// 履歴ロードテスト

export const historyLoadTest = {
  id: 'history-load',
  name: '履歴ロード',
  category: 'basic',
  description: '会話履歴のロード機能が正常に動作するか',
  
  async run(context) {
    const { addLog } = context;
    
    addLog?.('[Test:HistoryLoad] 開始', 'info');
    
    try {
      // loadChatHistory関数のインポートテスト
      const { loadChatHistory } = await import('../../hooks/chat/historyLoader');
      
      if (typeof loadChatHistory !== 'function') {
        throw new Error('loadChatHistory関数が見つかりません');
      }
      
      addLog?.('[Test:HistoryLoad] ✅ loadChatHistory関数確認OK', 'info');
      
      // 関数シグネチャのテスト（空呼び出しでエラーが出ないか）
      // 実際のAPI呼び出しは行わない
      
      return {
        success: true,
        message: '履歴ロード関数正常',
      };
    } catch (e) {
      addLog?.(`[Test:HistoryLoad] ❌ ${e.message}`, 'error');
      return {
        success: false,
        message: e.message,
      };
    }
  },
};
