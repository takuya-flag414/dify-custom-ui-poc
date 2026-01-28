// src/utils/errorHandler.ts

/**
 * エラータイプの定義
 */
export type ErrorType = 'CONFIG_ERROR' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';

/**
 * アクションタイプの定義
 */
export type ActionType = 'config' | 'retry';

/**
 * エラー分析結果の型定義
 */
export interface AnalyzedError {
    errorType: ErrorType;
    title: string;
    description: string;
    actionType: ActionType;
}

/**
 * 設定エラーオブジェクトの型定義
 */
export interface ConfigError {
    id: string;
    role: 'system';
    type: 'error';
    rawError: string;
    timestamp: string;
}

/**
 * エラーメッセージを解析し、UI表示用のデータセットを返します。
 * @param error - エラーオブジェクトまたはメッセージ文字列
 * @returns { title, description, actionType, errorType }
 */
export const analyzeError = (error: string | Error | unknown): AnalyzedError => {
    const msg = ((error as Error)?.message || error || '').toString();

    // --- 1. 設定未完了 (API Key/URL) ---
    // "API_KEY_MISSING" はアプリ内部で生成する特定コード
    if (msg === 'API_KEY_MISSING' || msg.includes('API KEY or URL not set') || msg.includes('401') || msg.includes('Unauthorized')) {
        return {
            errorType: 'CONFIG_ERROR',
            title: 'API設定が必要です',
            description: 'APIキーまたはエンドポイントURLが設定されていません。「API設定を開く」ボタンから設定を行ってください。',
            actionType: 'config'
        };
    }

    // --- 2. 通信エラー / ネットワーク切断 ---
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network request failed')) {
        return {
            errorType: 'NETWORK_ERROR',
            title: '通信エラーが発生しました',
            description: 'サーバーに接続できませんでした。インターネット接続を確認するか、しばらく待ってから再試行してください。',
            actionType: 'retry'
        };
    }

    // --- 3. サーバーエラー / JSONパースエラー ---
    if (msg.includes('JSON') || msg.includes('Unexpected token') || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
        return {
            errorType: 'SERVER_ERROR',
            title: '応答がありませんでした',
            description: 'AIサーバーからの応答形式が正しくありません。一時的な障害の可能性があります。',
            actionType: 'retry'
        };
    }

    // --- 4. その他の予期せぬエラー ---
    return {
        errorType: 'UNKNOWN_ERROR',
        title: '予期せぬエラー',
        description: `処理中にエラーが発生しました: ${msg}`,
        actionType: 'retry'
    };
};

/**
 * 設定未入力時のエラーオブジェクトを生成するヘルパー関数
 */
export const createConfigError = (): ConfigError => {
    return {
        id: `err_${Date.now()}`,
        role: 'system',
        type: 'error',
        rawError: 'API_KEY_MISSING',
        timestamp: new Date().toISOString()
    };
};

/**
 * ワークフローエラータイプの定義
 */
export type WorkflowErrorType = 'PLUGIN_ERROR' | 'API_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_WORKFLOW_ERROR';

/**
 * ワークフローエラー情報の型定義
 */
export interface WorkflowError {
    errorType: WorkflowErrorType;
    nodeTitle: string;
    originalMessage: string;
    userFriendlyMessage: string;
}

/**
 * ワークフローのエラーメッセージを解析し、ユーザーフレンドリーな形式に変換
 * @param nodeTitle - エラーが発生したノードのタイトル
 * @param errorMessage - 元のエラーメッセージ
 * @returns WorkflowError オブジェクト
 */
export const analyzeWorkflowError = (nodeTitle: string, errorMessage: string): WorkflowError => {
    // Perplexity HTTPエラー
    if (errorMessage.includes('HTTPError') && errorMessage.toLowerCase().includes('perplexity')) {
        return {
            errorType: 'PLUGIN_ERROR',
            nodeTitle,
            originalMessage: errorMessage,
            userFriendlyMessage: 'Web検索サービス(Perplexity)で一時的なエラーが発生しました。しばらくお待ちいただくか、質問を変えてお試しください。'
        };
    }

    // 400 Bad Request エラー
    if (errorMessage.includes('400') && errorMessage.includes('Bad Request')) {
        return {
            errorType: 'API_ERROR',
            nodeTitle,
            originalMessage: errorMessage,
            userFriendlyMessage: '外部サービスへのリクエストが拒否されました。入力内容に問題がある可能性があります。'
        };
    }

    // プラグイン作者への問い合わせを促すエラー
    if (errorMessage.includes('please contact the author')) {
        return {
            errorType: 'PLUGIN_ERROR',
            nodeTitle,
            originalMessage: errorMessage,
            userFriendlyMessage: '外部プラグインでエラーが発生しました。管理者にお問い合わせください。'
        };
    }

    // タイムアウトエラー
    if (errorMessage.toLowerCase().includes('timeout') || errorMessage.includes('timed out')) {
        return {
            errorType: 'TIMEOUT_ERROR',
            nodeTitle,
            originalMessage: errorMessage,
            userFriendlyMessage: '処理がタイムアウトしました。しばらく待ってから再度お試しください。'
        };
    }

    // デフォルト: 元のメッセージを含めて表示
    return {
        errorType: 'UNKNOWN_WORKFLOW_ERROR',
        nodeTitle,
        originalMessage: errorMessage,
        userFriendlyMessage: `処理中にエラーが発生しました: ${errorMessage}`
    };
};
