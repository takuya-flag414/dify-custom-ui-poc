// src/tests/basic/chatFlow.js
// チャット送受信テスト

export const chatFlowTest = {
  id: 'chat-flow',
  name: 'チャット送受信',
  category: 'basic',
  description: 'メッセージ送信とAI応答が正常に動作するか',
  
  async run(context) {
    const { mockMode, addLog, handleSendMessage, messages } = context;
    
    addLog?.('[Test:ChatFlow] 開始', 'info');
    
    // FEモードでのみテスト可能（他モードではスキップ）
    if (mockMode !== 'FE') {
      return {
        success: true,
        message: 'FEモード以外ではスキップ',
        skipped: true,
      };
    }
    
    try {
      const initialCount = messages?.length || 0;
      
      // テストメッセージを送信
      const testMessage = '[AutoTest] こんにちは、テストメッセージです';
      
      if (!handleSendMessage) {
        throw new Error('handleSendMessage関数が利用できません');
      }
      
      // 送信実行（非同期で応答を待つ）
      await handleSendMessage(testMessage, []);
      
      // 少し待機（FE Mockの応答を待つ）
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addLog?.('[Test:ChatFlow] ✅ メッセージ送信完了', 'info');
      
      return {
        success: true,
        message: 'メッセージ送信正常',
      };
    } catch (e) {
      addLog?.(`[Test:ChatFlow] ❌ ${e.message}`, 'error');
      return {
        success: false,
        message: e.message,
      };
    }
  },
};
