// src/utils/errorIntelligence.ts
// IntelligenceErrorHandler - エラーカタログ & 分析ロジック
// ★改修: HTTPステータスコード対応 & retryStrategy追加

/**
 * エラー種別（拡張版：HTTPステータスコード対応）
 */
export type IntelligenceErrorType =
    | 'BAD_REQUEST'        // 400: リクエスト不正
    | 'AUTH_DENIED'        // 401/403: 認証・権限エラー
    | 'NOT_FOUND'          // 404: リソース不在
    | 'PAYLOAD_TOO_LARGE'  // 413: サイズ超過
    | 'RATE_LIMITED'       // 429: レートリミット
    | 'SERVER_ERROR'       // 500/502/503: サーバーエラー
    | 'CAPACITY_OVERLOAD'  // 503, Overloaded（既存互換）
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
 * リトライ戦略
 * - immediate-restore: 手動修正が必要 → 即座にテキスト復元
 * - auto-retry: 一時的エラー → 自動再送信後、失敗時に復元
 * - no-retry: リトライ不要（コンテキスト超過・ポリシー違反等）
 */
export type RetryStrategy = 'immediate-restore' | 'auto-retry' | 'no-retry';

/**
 * アイコン種別
 */
export type ErrorIcon = 'clock' | 'chat' | 'shield' | 'wifi' | 'settings' | 'alert' | 'lock' | 'file' | 'search';

/**
 * 分析済みエラー情報
 */
export interface IntelligenceError {
    type: IntelligenceErrorType;
    severity: ErrorSeverity;
    title: string;
    description: string;
    action: ErrorAction;
    retryStrategy: RetryStrategy;
    retryDelayMs: number;
    maxRetries: number;
    icon: ErrorIcon;
    statusCode?: number;          // HTTPステータスコード
    rawErrorMessage?: string;     // 生のエラーメッセージ（詳細表示用）
    isWorkflowError?: boolean;    // ★追加: ワークフローエラー由来フラグ
}

/**
 * エラーカタログ定義（HTTPステータスコード対応版）
 */
const ERROR_CATALOG: Record<IntelligenceErrorType, Omit<IntelligenceError, 'type' | 'statusCode' | 'rawErrorMessage'>> = {
    BAD_REQUEST: {
        severity: 'warning',
        title: '入力内容に問題があります',
        description: '入力内容に問題があるため、処理を完了できませんでした。内容をご確認の上、もう一度お試しください。',
        action: 'manual-retry',
        retryStrategy: 'immediate-restore',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'alert',
    },
    AUTH_DENIED: {
        severity: 'critical',
        title: 'アクセス権限がありません',
        description: 'セッションが切れている可能性があるため、ページを再読み込みするか、再度ログインをお願いします。',
        action: 'config',
        retryStrategy: 'immediate-restore',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'lock',
    },
    NOT_FOUND: {
        severity: 'warning',
        title: '対象が見つかりませんでした',
        description: '設定が変更されたか、削除された可能性があります。',
        action: 'manual-retry',
        retryStrategy: 'immediate-restore',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'search',
    },
    PAYLOAD_TOO_LARGE: {
        severity: 'warning',
        title: 'データサイズが大きすぎます',
        description: '送信されたデータ（またはファイル）のサイズが大きすぎます。サイズを小さくして再度お試しください。',
        action: 'manual-retry',
        retryStrategy: 'immediate-restore',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'file',
    },
    RATE_LIMITED: {
        severity: 'warning',
        title: 'アクセスが集中しています',
        description: '現在アクセスが集中しています。しばらく時間をおいてから、再度お試しください。',
        action: 'auto-retry',
        retryStrategy: 'auto-retry',
        retryDelayMs: 3000,
        maxRetries: 3,
        icon: 'clock',
    },
    SERVER_ERROR: {
        severity: 'warning',
        title: 'サーバーで問題が発生しています',
        description: 'サーバー側で一時的な問題が発生しています。しばらく待ってから再度お試しいただくか、管理者に問い合わせてください。',
        action: 'auto-retry',
        retryStrategy: 'auto-retry',
        retryDelayMs: 3000,
        maxRetries: 3,
        icon: 'alert',
    },
    CAPACITY_OVERLOAD: {
        severity: 'warning',
        title: 'サーバーが混雑しています',
        description: '混雑が緩和されるまで自動的に再送信を試みています...',
        action: 'auto-retry',
        retryStrategy: 'auto-retry',
        retryDelayMs: 3000,
        maxRetries: 3,
        icon: 'clock',
    },
    CONTEXT_LIMIT: {
        severity: 'warning',
        title: '会話が長くなりました',
        description: '記憶を整理して続きを話しましょう。会話をクリアするか、要約を試してください。',
        action: 'suggest',
        retryStrategy: 'no-retry',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'chat',
    },
    SAFETY_POLICY: {
        severity: 'warning',
        title: 'そのリクエストにはお答えできないようです',
        description: '別の聞き方を試してみてください。',
        action: 'guidance',
        retryStrategy: 'no-retry',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'shield',
    },
    NETWORK_LOST: {
        severity: 'critical',
        title: 'ネットワーク接続を確認してください',
        description: '通信エラーが発生しました。インターネットの接続状況をご確認ください。',
        action: 'auto-retry',
        retryStrategy: 'auto-retry',
        retryDelayMs: 3000,
        maxRetries: 3,
        icon: 'wifi',
    },
    CONFIG_MISSING: {
        severity: 'critical',
        title: 'API設定が必要です',
        description: 'APIキーまたはエンドポイントURLが設定されていません。設定画面から入力してください。',
        action: 'config',
        retryStrategy: 'immediate-restore',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'settings',
    },
    UNKNOWN: {
        severity: 'critical',
        title: '予期せぬ問題が発生しました',
        description: '問題が解決しない場合は、管理者にお問い合わせください。',
        action: 'report',
        retryStrategy: 'immediate-restore',
        retryDelayMs: 0,
        maxRetries: 0,
        icon: 'alert',
    },
};

/**
 * HTTPステータスコードからエラータイプを判定する
 * @param statusCode - HTTPステータスコード
 * @returns エラータイプ（該当しない場合はnull）
 */
function classifyByStatusCode(statusCode: number): IntelligenceErrorType | null {
    if (statusCode === 400) return 'BAD_REQUEST';
    if (statusCode === 401 || statusCode === 403) return 'AUTH_DENIED';
    if (statusCode === 404) return 'NOT_FOUND';
    if (statusCode === 413) return 'PAYLOAD_TOO_LARGE';
    if (statusCode === 429) return 'RATE_LIMITED';
    if (statusCode >= 500 && statusCode <= 599) return 'SERVER_ERROR';
    return null;
}

/**
 * エラーメッセージのパターンマッチからエラータイプを判定する（フォールバック）
 * @param msg - 小文字変換済みのエラーメッセージ
 * @returns エラータイプ
 */
function classifyByMessage(msg: string): IntelligenceErrorType {
    // 1. Capacity Overload (503, Overloaded)
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('service unavailable') || msg.includes('capacity')) {
        return 'CAPACITY_OVERLOAD';
    }
    // 2. Rate Limited (429)
    if (msg.includes('429') || msg.includes('too many requests') || msg.includes('rate limit')) {
        return 'RATE_LIMITED';
    }
    // 3. Server Error (500, 502)
    if (msg.includes('500') || msg.includes('502') || msg.includes('internal server error') || msg.includes('bad gateway')) {
        return 'SERVER_ERROR';
    }
    // 4. Context Limit (token, context_length)
    if (msg.includes('context_length') || msg.includes('token') || msg.includes('too long') || msg.includes('maximum context')) {
        return 'CONTEXT_LIMIT';
    }
    // 5. Safety Policy (safety, violation)
    if (msg.includes('safety') || msg.includes('violation') || msg.includes('content_filter') || msg.includes('blocked')) {
        return 'SAFETY_POLICY';
    }
    // 6. Network Lost
    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed') || msg.includes('offline') || msg.includes('err_internet_disconnected')) {
        return 'NETWORK_LOST';
    }
    // 7. Auth / Config Missing
    if (msg.includes('api_key_missing') || msg.includes('api key or url not set')) {
        return 'CONFIG_MISSING';
    }
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('403') || msg.includes('forbidden')) {
        return 'AUTH_DENIED';
    }
    // 8. Bad Request
    if (msg.includes('400') || msg.includes('bad request')) {
        return 'BAD_REQUEST';
    }
    // 9. Payload Too Large
    if (msg.includes('413') || msg.includes('payload too large') || msg.includes('request entity too large')) {
        return 'PAYLOAD_TOO_LARGE';
    }
    // 10. Not Found
    if (msg.includes('404') || msg.includes('not found')) {
        return 'NOT_FOUND';
    }
    // 11. Unknown
    return 'UNKNOWN';
}

/**
 * エラーメッセージを解析し、IntelligenceError を返す
 * @param raw - 生のエラーメッセージ（文字列、Errorオブジェクト、またはunknown）
 * @param statusCode - オプション: HTTPステータスコード（あれば優先的に使用）
 */
export function analyzeIntelligenceError(
    raw: string | Error | unknown,
    statusCode?: number
): IntelligenceError {
    const rawMsg = ((raw as Error)?.message || raw || '').toString();
    const msg = rawMsg.toLowerCase();

    // ステータスコードが明示的に渡された場合はそちらを優先
    let errorType: IntelligenceErrorType;
    if (statusCode && statusCode > 0) {
        const typeFromCode = classifyByStatusCode(statusCode);
        errorType = typeFromCode || classifyByMessage(msg);
    } else {
        errorType = classifyByMessage(msg);
    }

    return {
        type: errorType,
        ...ERROR_CATALOG[errorType],
        statusCode: statusCode || undefined,
        rawErrorMessage: rawMsg,
    };
}
