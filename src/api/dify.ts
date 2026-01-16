// src/api/dify.ts

/**
 * ファイルアップロードのレスポンス型
 */
export interface UploadFileResponse {
    id: string;
    name?: string;
    size?: number;
    extension?: string;
    mime_type?: string;
    created_by?: string;
    created_at?: number;
}

/**
 * 会話リストのレスポンス型
 */
export interface ConversationsResponse {
    data: Conversation[];
    has_more: boolean;
    limit: number;
}

/**
 * 会話の型
 */
export interface Conversation {
    id: string;
    name: string;
    inputs?: Record<string, unknown>;
    status?: string;
    introduction?: string;
    created_at?: number;
    updated_at?: number;
}

/**
 * メッセージリストのレスポンス型
 */
export interface MessagesResponse {
    data: Message[];
    has_more: boolean;
    limit: number;
}

/**
 * メッセージの型
 */
export interface Message {
    id: string;
    conversation_id: string;
    inputs?: Record<string, unknown>;
    query: string;
    answer: string;
    message_files?: unknown[];
    feedback?: unknown;
    retriever_resources?: unknown[];
    created_at: number;
}

/**
 * チャットメッセージのペイロード型
 */
export interface ChatMessagePayload {
    inputs?: Record<string, unknown>;
    query: string;
    user: string;
    conversation_id?: string;
    response_mode: 'streaming' | 'blocking';
    files?: unknown[];
}

/**
 * 提案レスポンスの型
 */
export interface SuggestionsResponse {
    result: string;
    data: string[];
}

/**
 * 停止レスポンスの型
 */
export interface StopGenerationResponse {
    result: string;
}

/**
 * Difyへファイルをアップロードする
 * @param file - ブラウザで選択されたファイルオブジェクト
 * @param user - ユーザーID
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 */
export const uploadFile = async (
    file: File,
    user: string,
    apiUrl: string,
    apiKey: string
): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);

    try {
        const response = await fetch(`${apiUrl}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Upload failed with status ${response.status}`);
        }

        const data: UploadFileResponse = await response.json();
        return data;
    } catch (error) {
        console.error('[API] Upload Error:', error);
        throw error;
    }
};

/**
 * 会話リストを取得する
 * @param user - ユーザーID
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 * @param limit - 取得件数
 */
export const fetchConversationsApi = async (
    user: string,
    apiUrl: string,
    apiKey: string,
    limit: number = 20
): Promise<ConversationsResponse> => {
    const response = await fetch(
        `${apiUrl}/conversations?user=${user}&limit=${limit}`,
        {
            headers: { Authorization: `Bearer ${apiKey}` },
        }
    );
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Failed to fetch conversations: ${errData.message || response.status}`);
    }
    return await response.json();
};

/**
 * 特定の会話のメッセージ履歴を取得する
 * @param conversationId - 会話ID
 * @param user - ユーザーID
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 * @param limit - 取得件数
 */
export const fetchMessagesApi = async (
    conversationId: string,
    user: string,
    apiUrl: string,
    apiKey: string,
    limit: number = 50
): Promise<MessagesResponse> => {
    const response = await fetch(
        `${apiUrl}/messages?conversation_id=${conversationId}&user=${user}&limit=${limit}`,
        {
            headers: { Authorization: `Bearer ${apiKey}` },
        }
    );
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Failed to fetch messages: ${errData.message || response.status}`);
    }
    return await response.json();
};

/**
 * チャットメッセージを送信する（ストリーミング）
 * @param payload - 送信データ
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 * @returns fetchのResponseオブジェクト
 */
export const sendChatMessageApi = async (
    payload: ChatMessagePayload,
    apiUrl: string,
    apiKey: string
): Promise<Response> => {
    const response = await fetch(`${apiUrl}/chat-messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.code || 'API Error');
    }

    return response;
};

/**
 * 提案された質問を取得する
 * @param messageId - メッセージID
 * @param user - ユーザーID
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 */
export const fetchSuggestionsApi = async (
    messageId: string,
    user: string,
    apiUrl: string,
    apiKey: string
): Promise<SuggestionsResponse> => {
    const response = await fetch(`${apiUrl}/messages/${messageId}/suggested?user=${user}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.status}`);
    }

    return await response.json();
};

/**
 * 会話を削除する
 * @param conversationId - 削除対象の会話ID
 * @param user - ユーザーID
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 * @returns 成功すればtrue
 */
export const deleteConversationApi = async (
    conversationId: string,
    user: string,
    apiUrl: string,
    apiKey: string
): Promise<boolean> => {
    const response = await fetch(`${apiUrl}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ user }),
    });

    if (response.status !== 204) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} ${errorText}`);
    }

    return true;
};

/**
 * 会話の名前を変更する
 * @param conversationId - 会話ID
 * @param name - 新しい名前
 * @param user - ユーザーID
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 */
export const renameConversationApi = async (
    conversationId: string,
    name: string,
    user: string,
    apiUrl: string,
    apiKey: string
): Promise<Conversation> => {
    const response = await fetch(`${apiUrl}/conversations/${conversationId}/name`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ name, user }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Rename failed with status ${response.status}`);
    }

    return await response.json();
};

/**
 * 生成を停止する（ストリーミングモード専用）
 * @param taskId - タスクID（ストリーミングチャンクから取得）
 * @param user - ユーザーID
 * @param apiUrl - APIのベースURL
 * @param apiKey - APIキー
 * @returns 成功時は { result: 'success' }
 */
export const stopGenerationApi = async (
    taskId: string,
    user: string,
    apiUrl: string,
    apiKey: string
): Promise<StopGenerationResponse> => {
    const response = await fetch(`${apiUrl}/chat-messages/${taskId}/stop`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ user }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stop generation failed: ${response.status} ${errorText}`);
    }

    return await response.json();
};
