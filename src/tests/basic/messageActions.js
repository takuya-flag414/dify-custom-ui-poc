// src/tests/basic/messageActions.js
// 停止・編集・再生成テスト

export const messageActionsTest = {
  id: 'message-actions',
  name: '停止・編集・再生成',
  category: 'basic',
  description: 'メッセージアクション関数が正常に動作するか',
  
  async run(context) {
    const { addLog } = context;
    
    addLog?.('[Test:MessageActions] 開始', 'info');
    
    try {
      // messageActions モジュールのインポートテスト
      const { 
        executeStopGeneration, 
        prepareMessageEdit, 
        prepareRegenerate 
      } = await import('../../hooks/chat/messageActions');
      
      const errors = [];
      
      // 各関数の存在確認
      if (typeof executeStopGeneration !== 'function') {
        errors.push('executeStopGeneration関数が見つかりません');
      }
      if (typeof prepareMessageEdit !== 'function') {
        errors.push('prepareMessageEdit関数が見つかりません');
      }
      if (typeof prepareRegenerate !== 'function') {
        errors.push('prepareRegenerate関数が見つかりません');
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      
      // prepareMessageEdit のロジックテスト
      const editResult = prepareMessageEdit({
        messageId: 'test-123',
        messages: [
          { id: 'test-123', role: 'user', text: 'test' },
          { id: 'test-456', role: 'ai', text: 'response' },
        ],
        addLog: () => {},
      });
      
      if (!editResult.previousMessages) {
        throw new Error('prepareMessageEdit: previousMessagesが返されません');
      }
      
      addLog?.('[Test:MessageActions] ✅ prepareMessageEdit OK', 'info');
      
      // prepareRegenerate のロジックテスト
      const regenResult = prepareRegenerate({
        messages: [
          { id: 'test-123', role: 'user', text: 'test' },
          { id: 'test-456', role: 'ai', text: 'response' },
        ],
        addLog: () => {},
      });
      
      if (!regenResult.targetUserMessage) {
        throw new Error('prepareRegenerate: targetUserMessageが返されません');
      }
      
      addLog?.('[Test:MessageActions] ✅ prepareRegenerate OK', 'info');
      
      return {
        success: true,
        message: '3関数すべて正常',
      };
    } catch (e) {
      addLog?.(`[Test:MessageActions] ❌ ${e.message}`, 'error');
      return {
        success: false,
        message: e.message,
      };
    }
  },
};
