// src/services/ChatServiceAdapter.ts
import { uploadFile as apiUploadFile, sendChatMessageApi, fetchConversationsApi, ChatMessagePayload } from '../api/dify';
import { MockStreamGenerator, ScenarioStep } from '../mocks/MockStreamGenerator';
import { scenarios } from '../mocks/scenarios';

/**
 * 検索設定の型
 */
export interface SearchSettings {
    ragEnabled?: boolean | 'auto';
    webMode?: 'off' | 'on' | 'auto' | 'force';
    domainFilters?: string[];
    reasoningMode?: 'fast' | 'pro';
}

/**
 * プロンプト設定の型
 */
export interface PromptSettings {
    aiStyle?: 'efficient' | 'partner';
    userProfile?: {
        role?: string;
        department?: string;
    };
    customInstructions?: string;
}

/**
 * アップロードされたファイル情報
 */
export interface UploadedFile {
    id: string;
    name: string;
    type: string;
}

/**
 * メッセージ送信パラメータ
 */
export interface SendMessageParams {
    text: string;
    conversationId?: string;
    files?: UploadedFile[];
    searchSettings?: SearchSettings;
    promptSettings?: PromptSettings;
    displayName?: string;
}

/**
 * サービス設定
 */
export interface ServiceConfig {
    mockMode: 'FE' | 'BE' | 'OFF';
    userId: string;
    apiUrl: string;
    apiKey: string;
}

/**
 * シナリオデータの型（AIスタイル別）
 */
type ScenarioData = ScenarioStep[] | { efficient: ScenarioStep[]; partner: ScenarioStep[] };

/**
 * Intelligence Profile ペイロードを構築する
 */
const buildSystemPromptPayload = (promptSettings: PromptSettings | undefined, displayName: string | undefined): string => {
    const payload = {
        user_context: {
            name: displayName || '',
            role: promptSettings?.userProfile?.role || '',
            department: promptSettings?.userProfile?.department || ''
        },
        custom_directives: {
            free_text: promptSettings?.customInstructions || ''
        },
        meta: {
            client_version: '3.0.0',
            timestamp: new Date().toISOString()
        }
    };
    return JSON.stringify(payload);
};

/**
 * チャットサービスアダプター
 * MockモードとRealモードの違いを吸収し、統一されたインターフェースを提供します。
 */
export const ChatServiceAdapter = {

    async uploadFile(file: File, config: ServiceConfig): Promise<UploadedFile> {
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

    async sendMessage(params: SendMessageParams, config: ServiceConfig): Promise<ReadableStreamDefaultReader<string>> {
        const { text, conversationId, files = [], searchSettings, promptSettings, displayName } = params;
        const { mockMode, userId, apiUrl, apiKey } = config;

        // --- 1. FE Mock Mode ---
        if (mockMode === 'FE') {
            const generator = new MockStreamGenerator();

            const useRag = searchSettings?.ragEnabled === true || searchSettings?.ragEnabled === 'auto';
            const useWeb = searchSettings?.webMode !== 'off';
            const hasFile = files.length > 0;

            let scenarioKey = 'pure';

            // ★Auto Mode (Special Demo)
            if (searchSettings?.ragEnabled === 'auto' && searchSettings?.webMode === 'auto' && !hasFile) {
                scenarioKey = 'auto_demo';
            }
            else if (!useRag && !useWeb) {
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
                else scenarioKey = 'pure';
            }

            const aiStyle = promptSettings?.aiStyle || 'partner';
            const scenarioData: ScenarioData = (scenarios as Record<string, ScenarioData>)[scenarioKey] || (scenarios as Record<string, ScenarioData>)['pure'];

            // 新形式（スタイル別オブジェクト）と旧形式（配列）の両方に対応
            const baseScenario: ScenarioStep[] = Array.isArray(scenarioData)
                ? scenarioData
                : ((scenarioData as { efficient: ScenarioStep[]; partner: ScenarioStep[] })[aiStyle] ||
                    (scenarioData as { efficient: ScenarioStep[]; partner: ScenarioStep[] })['partner']);

            let targetScenario: ScenarioStep[] = [];

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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (stream.pipeThrough as any)(new TextDecoderStream()).getReader();
        }

        // --- 2. Real API / BE Mock Mode ---
        const domainFilterString = searchSettings?.domainFilters?.join(', ') || '';
        const searchModeValue = searchSettings?.webMode || 'auto';
        const now = new Date();
        const currentTimeStr = now.toLocaleString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric',
            weekday: 'long', hour: '2-digit', minute: '2-digit'
        });

        const requestBody: ChatMessagePayload = {
            inputs: {
                isDebugMode: mockMode === 'BE',
                rag_enabled: searchSettings?.ragEnabled === 'auto' ? 'auto' : (searchSettings?.ragEnabled ? 'true' : 'false'),
                web_search_mode: searchModeValue,
                search_mode: searchModeValue === 'force' ? 'force' : 'auto',
                domain_filter: domainFilterString,
                current_time: currentTimeStr,
                ai_style: promptSettings?.aiStyle || 'partner',
                system_prompt: buildSystemPromptPayload(promptSettings, displayName),
                reasoning_mode: searchSettings?.reasoningMode || 'fast',
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

    async testConnection(config: ServiceConfig): Promise<boolean> {
        const { userId, apiUrl, apiKey } = config;

        try {
            const testUserId = userId || `test-user-${Date.now()}`;
            await fetchConversationsApi(testUserId, apiUrl, apiKey, 1);
            return true;
        } catch (e) {
            console.error('[Connection Test Failed]', e);
            throw new Error((e as Error).message || '接続に失敗しました');
        }
    }
};
