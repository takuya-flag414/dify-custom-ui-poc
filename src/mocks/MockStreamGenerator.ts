// src/mocks/MockStreamGenerator.ts
import { sleep, randomDelay } from './mockUtils';

/**
 * シナリオステップの型定義
 */
export interface ScenarioStep {
    event: 'node_started' | 'node_finished' | 'message' | 'message_end' | string;
    data?: {
        title?: string;
        node_type?: string;
        node_id?: string;
        inputs?: Record<string, unknown>;
        outputs?: Record<string, unknown>;
        status?: string;
        [key: string]: unknown;
    };
    answer?: string;
    metadata?: {
        retriever_resources?: unknown[];
        [key: string]: unknown;
    };
}

/**
 * SSEイベントデータの型定義
 */
interface SSEEventData {
    event: string;
    task_id?: string;
    message_id?: string;
    conversation_id?: string;
    workflow_run_id?: string;
    created_at?: number;
    data?: Record<string, unknown>;
    answer?: string;
    metadata?: Record<string, unknown>;
}

export class MockStreamGenerator {
    private encoder: TextEncoder;

    constructor() {
        this.encoder = new TextEncoder();
    }

    /**
     * SSE形式のデータラインを作成してエンコードする
     */
    createSSEData(data: SSEEventData): Uint8Array {
        const jsonString = JSON.stringify(data);
        return this.encoder.encode(`data: ${jsonString}\n\n`);
    }

    /**
     * シナリオに基づいたReadableStreamを生成する
     * @param scenario イベントオブジェクトの配列
     * @param conversationId 会話ID (同期用)
     */
    getStream(scenario: ScenarioStep[], conversationId: string): ReadableStream<Uint8Array> {
        // ガード節
        if (!scenario || !Array.isArray(scenario)) {
            console.error('[MockStream] Invalid scenario provided:', scenario);
            return new ReadableStream({
                start(controller) { controller.close(); }
            });
        }

        const self = this;

        // ★追加: ノードIDをタイトルベースで一時保存するマップ
        const activeNodeIds = new Map<string, string>();

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                try {
                    // 1. ワークフロー開始
                    const startEvent: SSEEventData = {
                        event: 'workflow_started',
                        workflow_run_id: `wf_${Date.now()}`,
                        task_id: `task_${Date.now()}`,
                        data: { id: `wf_${Date.now()}`, status: 'running' }
                    };
                    controller.enqueue(self.createSSEData(startEvent));
                    await sleep(200);

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
                            const nodeTitle = step.data?.title || 'Unknown';
                            let nodeId = step.data?.node_id;

                            // ★ID管理ロジック
                            if (!nodeId) {
                                if (step.event === 'node_started') {
                                    nodeId = `node_${nodeTitle}_${Date.now()}`;
                                    activeNodeIds.set(nodeTitle, nodeId);
                                } else {
                                    nodeId = activeNodeIds.get(nodeTitle) || `node_${nodeTitle}_${Date.now()}`;
                                }
                            }

                            const nodeData: SSEEventData = {
                                ...baseData,
                                event: step.event,
                                data: {
                                    ...step.data,
                                    node_id: nodeId,
                                    status: step.event === 'node_finished' ? 'succeeded' : 'running'
                                }
                            };
                            controller.enqueue(self.createSSEData(nodeData));

                            // 思考時間のシミュレーション
                            if (step.event === 'node_started') {
                                const waitTime = step.data?.node_type === 'tool' ? 1500 : 600;
                                await sleep(waitTime);
                            }
                        }

                        // B. メッセージ本文 (ストリーミング生成)
                        else if (step.event === 'message') {
                            const fullText = step.answer || '';
                            const chunkSize = 5;

                            for (let i = 0; i < fullText.length; i += chunkSize) {
                                const chunk = fullText.slice(i, i + chunkSize);
                                const msgData: SSEEventData = {
                                    ...baseData,
                                    event: 'message',
                                    answer: chunk
                                };
                                controller.enqueue(self.createSSEData(msgData));
                                await sleep(randomDelay(10, 30));
                            }
                        }

                        // C. 完了・メタデータ (出典など)
                        else if (step.event === 'message_end') {
                            const endData: SSEEventData = {
                                ...baseData,
                                event: 'message_end',
                                metadata: step.metadata
                            };
                            controller.enqueue(self.createSSEData(endData));
                        }
                    }

                    // 3. ワークフロー終了
                    const finishEvent: SSEEventData = {
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
