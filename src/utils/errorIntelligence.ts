// src/utils/errorIntelligence.ts
// IntelligenceErrorHandler - エラーカタログ & 分析ロジック

/**
 * エラー種別（5カテゴリ）
 */
export type IntelligenceErrorType =
    | 'CAPACITY_OVERLOAD'  // 503, Overloaded
    | 'CONTEXT_LIMIT'      // context_length, token limit
    | 'SAFETY_POLICY'      // safety, violation
    | 'NETWORK_LOST'       // NetworkError, Offline
    | 'CONFIG_MISSING'     // API Key/URL未設定
    | 'UNKNOWN';           // その他

/**
 * エラーの深刻度
 */
export type ErrorSeverity = 'warning' | 'critical';

/**
 * エラーに対するアクション種別
 */
export type ErrorAction = 'auto-retry' | 'suggest' | 'guidance' | 'manual-retry' | 'config' | 'report';

/**
 * アイコン種別
 */
export type ErrorIcon = 'clock' | 'chat' | 'shield' | 'wifi' | 'settings' | 'alert';

/**
 * 分析済みエラー情報
 */
export interface IntelligenceError {
    type: IntelligenceErrorType;
    severity: ErrorSeverity;
    title: string;
    description: string;
    action: ErrorAction;
    retryDelayMs: number;
    maxRetries: number;
    icon: ErrorIcon;
}

/**
 * エラーカタログ定義
 */
const ERROR_CATALOG: Record<IntelligenceErrorType, Omit<IntelligenceError, 'type'>> = {
    CAPACITY_OVERLOAD: {
        severity: 'warning',
        title: 'AI脳がフル回転中です',
        description: '混雑が緩和されるまで待機しています...',
        action: 'auto-retry',
        retryDelayMs: 3000,
        maxRetries: 3,
        icon: 'clock',
    },
    CONTEXT_LIMIT: {
        severity: 'warning',
        title: '会話が長くなりました',
        description: '記憶を整理して続きを話しましょう。会話をクリアするか、要約を試してください。',
        action: 'suggest',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'chat',
    },
    SAFETY_POLICY: {
        severity: 'warning',
        title: 'そのリクエストにはお答えできないようです',
        description: '別の聞き方を試してみてください。',
        action: 'guidance',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'shield',
    },
    NETWORK_LOST: {
        severity: 'critical',
        title: 'ネットワーク接続を確認してください',
        description: 'サーバーに接続できませんでした。インターネット接続を確認してから再試行してください。',
        action: 'manual-retry',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'wifi',
    },
    CONFIG_MISSING: {
        severity: 'critical',
        title: 'API設定が必要です',
        description: 'APIキーまたはエンドポイントURLが設定されていません。設定画面から入力してください。',
        action: 'config',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'settings',
    },
    UNKNOWN: {
        severity: 'critical',
        title: '予期せぬ問題が発生しました',
        description: '問題が解決しない場合は、管理者にお問い合わせください。',
        action: 'report',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'alert',
    },
};

/**
 * エラーメッセージを解析し、IntelligenceError を返す
 */
export function analyzeIntelligenceError(raw: string | Error | unknown): IntelligenceError {
    const msg = ((raw as Error)?.message || raw || '').toString().toLowerCase();

    let errorType: IntelligenceErrorType;

    // 1. Capacity Overload (503, Overloaded)
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('service unavailable') || msg.includes('capacity')) {
        errorType = 'CAPACITY_OVERLOAD';
    }
    // 2. Context Limit (token, context_length)
    else if (msg.includes('context_length') || msg.includes('token') || msg.includes('too long') || msg.includes('maximum context')) {
        errorType = 'CONTEXT_LIMIT';
    }
    // 3. Safety Policy (safety, violation)
    else if (msg.includes('safety') || msg.includes('violation') || msg.includes('content_filter') || msg.includes('blocked')) {
        errorType = 'SAFETY_POLICY';
    }
    // 4. Network Lost
    else if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed') || msg.includes('offline') || msg.includes('ERR_INTERNET_DISCONNECTED'.toLowerCase())) {
        errorType = 'NETWORK_LOST';
    }
    // 5. Config Missing
    else if (msg.includes('api_key_missing') || msg.includes('api key or url not set') || msg.includes('401') || msg.includes('unauthorized')) {
        errorType = 'CONFIG_MISSING';
    }
    // 6. Unknown
    else {
        errorType = 'UNKNOWN';
    }

    return {
        type: errorType,
        ...ERROR_CATALOG[errorType],
    };
}
