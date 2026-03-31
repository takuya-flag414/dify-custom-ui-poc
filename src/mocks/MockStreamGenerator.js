// src/mocks/MockStreamGenerator.js
import { sleep, randomDelay } from './mockUtils';

export class MockStreamGenerator {
  constructor() {
    this.encoder = new TextEncoder();
  }

  /**
   * SSE形式のデータラインを作成してエンコードする
   */
  createSSEData(data) {
    const jsonString = JSON.stringify(data);
    return this.encoder.encode(`data: ${jsonString}\n\n`);
  }

  /**
   * シナリオに基づいたReadableStreamを生成する
   * @param {Array} scenario イベントオブジェクトの配列
   * @param {string} conversationId 会話ID (同期用)
   */
  getStream(scenario, conversationId) {
    // ガード節
    if (!scenario || !Array.isArray(scenario)) {
      console.error('[MockStream] Invalid scenario provided:', scenario);
      return new ReadableStream({
        start(controller) { controller.close(); }
      });
    }

    const self = this;
    
    // ★追加: ノードIDをタイトルベースで一時保存するマップ
    // 同じタイトルのノード(Started/Finished)で同じIDを使うため
    const activeNodeIds = new Map();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. ワークフロー開始
          const startEvent = {
            event: 'workflow_started',
            workflow_run_id: `wf_${Date.now()}`,
            task_id: `task_${Date.now()}`,
            data: { id: `wf_${Date.now()}`, status: 'running' }
          };
          controller.enqueue(self.createSSEData(startEvent));
          // ★変更: 初期待機 (3倍速)
          await sleep(333 + randomDelay(0, 100));

          // ★追加: 遅延ルール定義
          const DELAY_RULES = {
            'Query Rewriter': 500,
            'Intent Classifier': 800,
            'LLM_Intent_Analysis': 800,
            'Search Strategy': 1000,
            'LLM_Search_Strategy': 1000,
            'Perplexity Search': 2600,
            'Web Search': 2600,
            'LLM_Search_Partner': 660,
            'default_llm': 400,
            'default_tool': 660
          };

          // 2. シナリオの各イベントを処理
          for (const step of scenario) {
            const baseData = {
              task_id: `task_${Date.now()}`,
              message_id: `msg_${Date.now()}`,
              conversation_id: conversationId,
              created_at: Math.floor(Date.now() / 1000)
            };

            // A. ノード処理 (思考プロセス)
            if (step.event === 'node_started' || step.event === 'node_finished') {
              const nodeTitle = step.data.title;
              let nodeId = step.data.node_id;

              // ★ID管理ロジック
              if (!nodeId) {
                if (step.event === 'node_started') {
                  // 開始時: 新規IDを発行して記憶する
                  nodeId = `node_${nodeTitle}_${Date.now()}`;
                  activeNodeIds.set(nodeTitle, nodeId);
                } else {
                  // 終了時: 記憶しているIDを取り出す
                  nodeId = activeNodeIds.get(nodeTitle) || `node_${nodeTitle}_${Date.now()}`;
                }
              }

              const nodeData = {
                ...baseData,
                event: step.event,
                data: {
                  ...step.data,
                  node_id: nodeId, // 整合性の取れたIDを使用
                  status: step.event === 'node_finished' ? 'succeeded' : 'running'
                }
              };
              controller.enqueue(self.createSSEData(nodeData));
              
              // 思考時間のシミュレーション
              if (step.event === 'node_started') {
                // タイトルに基づいて基本遅延時間を決定
                let baseDelay = DELAY_RULES[nodeTitle];
                
                if (!baseDelay) {
                   baseDelay = step.data.node_type === 'tool' ? DELAY_RULES['default_tool'] : DELAY_RULES['default_llm'];
                }

                // ゆらぎを追加 (3倍速対応 0~166ms)
                const variance = randomDelay(0, 166);
                await sleep(baseDelay + variance);
              }
            }

            // B. メッセージ本文 (ストリーミング生成)
            else if (step.event === 'message') {
              const fullText = step.answer;
              const chunkSize = 15; // JSON構造を少しずつ送る
              
              for (let i = 0; i < fullText.length; i += chunkSize) {
                const chunk = fullText.slice(i, i + chunkSize);
                const msgData = {
                  ...baseData,
                  event: 'message',
                  answer: chunk
                };
                controller.enqueue(self.createSSEData(msgData));
                await sleep(randomDelay(3, 10));
              }
            }

            // C. 完了・メタデータ (出典など)
            else if (step.event === 'message_end') {
              const endData = {
                ...baseData,
                event: 'message_end',
                metadata: step.metadata
              };
              controller.enqueue(self.createSSEData(endData));
            }
          }

          // 3. ワークフロー終了
          const finishEvent = {
            event: 'workflow_finished',
            task_id: `task_${Date.now()}`,
            data: { status: 'succeeded' }
          };
          controller.enqueue(self.createSSEData(finishEvent));
          
          controller.close();

        } catch (error) {
          console.error('[MockStream] Error:', error);
          controller.error(error);
        }
      }
    });

    return stream;
  }
}