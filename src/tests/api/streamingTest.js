// src/tests/api/streamingTest.js
// Streaming受信テスト（Real/BEモードのみ）

export const streamingTest = {
  id: 'streaming-test',
  name: 'Streaming受信',
  category: 'api',
  description: 'SSEストリーミングが正常に動作するか',
  
  async run(context) {
    const { mockMode, addLog } = context;
    
    addLog?.('[Test:Streaming] 開始', 'info');
    
    // FEモードではスキップ
    if (mockMode === 'FE') {
      return {
        success: true,
        message: 'FEモードのためスキップ',
        skipped: true,
      };
    }
    
    try {
      // nodeEventHandlers のSSE処理関数確認
      const { 
        processNodeStarted, 
        processQueryRewriteFinished 
      } = await import('../../hooks/chat/nodeEventHandlers');
      
      if (typeof processNodeStarted !== 'function') {
        throw new Error('processNodeStarted関数が見つかりません');
      }
      
      // messageEventHandlers の確認
      const { 
        determineProtocolMode, 
        extractMessageContent 
      } = await import('../../hooks/chat/messageEventHandlers');
      
      if (typeof determineProtocolMode !== 'function') {
        throw new Error('determineProtocolMode関数が見つかりません');
      }
      
      // determineProtocolModeのロジックテスト
      const mode1 = determineProtocolMode('{"thinking": "test"}');
      if (mode1 !== 'JSON') {
        throw new Error(`determineProtocolMode: 期待値JSON, 実際${mode1}`);
      }
      
      const mode2 = determineProtocolMode('Hello, world!');
      if (mode2 !== 'RAW') {
        throw new Error(`determineProtocolMode: 期待値RAW, 実際${mode2}`);
      }
      
      addLog?.('[Test:Streaming] ✅ SSE処理関数正常', 'info');
      
      return {
        success: true,
        message: 'SSE処理関数正常',
      };
    } catch (e) {
      addLog?.(`[Test:Streaming] ❌ ${e.message}`, 'error');
      return {
        success: false,
        message: e.message,
      };
    }
  },
};
