// src/services/ChatServiceAdapter.js
import { uploadFile as apiUploadFile, sendChatMessageApi, fetchConversationsApi } from '../api/dify';
import { MockStreamGenerator } from '../mocks/MockStreamGenerator';
import { scenarios } from '../mocks/scenarios';

/**
 * チャットサービスアダプター
 * MockモードとRealモードの違いを吸収し、統一されたインターフェースを提供します。
 */
export const ChatServiceAdapter = {

  // ... (uploadFile, sendMessage は変更なしのため省略。既存のコードを維持してください) ...
  async uploadFile(file, config) {
    const { mockMode, userId, apiUrl, apiKey } = config;

    if (mockMode === 'FE') {
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        id: `mock_file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'document'
      };
    }

    const res = await apiUploadFile(file, userId, apiUrl, apiKey);
    return {
      id: res.id,
      name: file.name,
      type: 'document'
    };
  },

  async sendMessage(params, config) {
    const { text, conversationId, files = [], searchSettings, promptSettings } = params;
    const { mockMode, userId, apiUrl, apiKey } = config;

    // --- 1. FE Mock Mode ---
    if (mockMode === 'FE') {
      const generator = new MockStreamGenerator();

      const useRag = searchSettings?.ragEnabled;
      const useWeb = searchSettings?.webMode !== 'off';
      const hasFile = files.length > 0;

      let scenarioKey = 'pure';
      if (!useRag && !useWeb) {
        scenarioKey = hasFile ? 'fast_file' : 'fast_pure';
      } else if (hasFile) {
        if (!useRag && !useWeb) scenarioKey = 'file_only';
        else if (!useRag && useWeb) scenarioKey = 'file_web';
        else if (useRag && !useWeb) scenarioKey = 'file_rag';
        else scenarioKey = 'full';
      } else {
        if (useRag && !useWeb) scenarioKey = 'rag_only';
        else if (!useRag && useWeb) scenarioKey = 'web_only';
        else if (useRag && useWeb) scenarioKey = 'hybrid';
        else scenarioKey = 'pure'; // ★追加: RAGもWebもOFFの場合
      }

      // ★AIスタイルに基づいてシナリオを選択
      const aiStyle = promptSettings?.aiStyle || 'partner';
      const scenarioData = scenarios[scenarioKey] || scenarios['pure'];
      
      // 新形式（スタイル別オブジェクト）と旧形式（配列）の両方に対応
      const baseScenario = Array.isArray(scenarioData)
        ? scenarioData  // 旧形式（後方互換）
        : (scenarioData[aiStyle] || scenarioData['partner']); // 新形式
      
      let targetScenario = [];

      if (hasFile) {
        baseScenario.forEach(step => {
          if (step.data?.node_type === 'document-extractor') {
            if (step.event === 'node_started') {
              files.forEach((file, idx) => {
                targetScenario.push({
                  ...step,
                  data: {
                    ...step.data,
                    title: 'ドキュメント抽出',
                    node_id: `mock_node_doc_${Date.now()}_${idx}`,
                    inputs: { target_file: file.name }
                  }
                });
              });
            } else if (step.event === 'node_finished') {
              files.forEach((file, idx) => {
                targetScenario.push({
                  ...step,
                  data: {
                    ...step.data,
                    title: 'ドキュメント抽出',
                    node_id: `mock_node_doc_${Date.now()}_${idx}`,
                    status: 'succeeded'
                  }
                });
              });
            }
          } else {
            targetScenario.push(step);
          }
        });
      } else {
        targetScenario = baseScenario;
      }

      const mockConversationId = conversationId || `mock_gen_${Date.now()}`;
      const stream = generator.getStream(targetScenario, mockConversationId);

      return stream.pipeThrough(new TextDecoderStream()).getReader();
    }

    // --- 2. Real API / BE Mock Mode ---
    const domainFilterString = searchSettings?.domainFilters?.join(', ') || '';
    const searchModeValue = searchSettings?.webMode || 'auto';
    const now = new Date();
    const currentTimeStr = now.toLocaleString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric',
      weekday: 'long', hour: '2-digit', minute: '2-digit'
    });

    const requestBody = {
      inputs: {
        isDebugMode: mockMode === 'BE',
        rag_enabled: searchSettings?.ragEnabled ? 'true' : 'false',
        web_search_mode: searchModeValue,
        search_mode: searchModeValue === 'force' ? 'force' : 'auto',
        domain_filter: domainFilterString,
        current_time: currentTimeStr,
        // ★追加: AI回答スタイルとシステムプロンプト
        ai_style: promptSettings?.aiStyle || 'partner',
        system_prompt: promptSettings?.systemPrompt || '',
      },
      query: text,
      user: userId,
      conversation_id: conversationId || '',
      response_mode: 'streaming',
      files: files.map(f => ({
        type: 'document',
        transfer_method: 'local_file',
        upload_file_id: f.id
      }))
    };

    const response = await sendChatMessageApi(requestBody, apiUrl, apiKey);

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return response.body.pipeThrough(new TextDecoderStream()).getReader();
  },

  // ★変更: 接続テストの実装 (エミュレーション撤廃)
  async testConnection(config) {
    const { userId, apiUrl, apiKey } = config;

    // ★変更: FEモードの分岐を削除し、常に実際のAPIを確認する

    try {
      // ユーザーIDが無い場合は一時的なIDを使用
      const testUserId = userId || `test-user-${Date.now()}`;
      // 会話リストを1件だけ取得することでAPIキーの有効性を確認
      await fetchConversationsApi(testUserId, apiUrl, apiKey, 1);
      return true;
    } catch (e) {
      console.error('[Connection Test Failed]', e);
      throw new Error(e.message || '接続に失敗しました');
    }
  }
};