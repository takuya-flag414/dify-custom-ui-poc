// src/utils/privacyDetector.ts
/**
 * 機密情報検知ユーティリティ
 * The Intelligent Guardian - Phase 1
 * 
 * クライアントサイドで機密情報をリアルタイム検知する
 */

/**
 * 検知優先度の型定義
 */
export type DetectionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 検知パターン定義の型
 */
interface DetectionPattern {
    id: string;
    label: string;
    priority: DetectionPriority;
    pattern: RegExp;
    validator?: (match: string) => boolean;
}

/**
 * 検知結果の型定義
 */
export interface Detection {
    id: string;
    label: string;
    priority: DetectionPriority;
    count: number;
    matches: string[];
}

/**
 * スキャン結果の型定義
 */
export interface ScanResult {
    hasWarning: boolean;
    detections: Detection[];
}

/**
 * ハイライト情報の型定義
 */
export interface Highlight {
    start: number;
    end: number;
    type: string;
    priority: DetectionPriority;
}

/**
 * 位置情報付きスキャン結果の型定義
 */
export interface ScanResultWithPositions {
    hasWarning: boolean;
    highlights: Highlight[];
}

/**
 * Luhnアルゴリズムによるクレジットカード番号の検証
 * @param num - 数字のみの文字列
 * @returns 有効なカード番号かどうか
 */
function luhnCheck(num: string): boolean {
    if (!num || num.length < 13 || num.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

/**
 * 検知パターン定義
 */
const DETECTION_PATTERNS: DetectionPattern[] = [
    {
        id: 'credit_card',
        label: 'クレジットカード番号',
        priority: 'critical',
        // 14-16桁の数字（ハイフンやスペース区切り対応）
        pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4}\b/g,
        validator: (match: string): boolean => {
            const digits = match.replace(/[\s-]/g, '');
            return luhnCheck(digits);
        },
    },
    {
        id: 'api_key',
        label: 'APIキー',
        priority: 'critical',
        pattern: /\b(sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16,}|ghp_[a-zA-Z0-9]{30,}|gho_[a-zA-Z0-9]{30,}|github_pat_[a-zA-Z0-9_]+|AIza[a-zA-Z0-9_-]{30,}|sk_live_[a-zA-Z0-9]{20,}|sk_test_[a-zA-Z0-9]{20,}|xoxb-[a-zA-Z0-9-]+|xoxp-[a-zA-Z0-9-]+)\b/g,
    },
    {
        id: 'phone_number',
        label: '電話番号',
        priority: 'high',
        pattern: /\b(?:0[789]0[-\s]?\d{4}[-\s]?\d{4}|0\d[-\s]?\d{4}[-\s]?\d{4}|0\d{2}[-\s]?\d{3}[-\s]?\d{4}|0\d{3}[-\s]?\d{2}[-\s]?\d{4}|0\d{4}[-\s]?\d[-\s]?\d{4})\b/g,
    },
    {
        id: 'email',
        label: 'メールアドレス',
        priority: 'high',
        pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    },
    {
        id: 'my_number',
        label: 'マイナンバー',
        priority: 'high',
        pattern: /(?:個人番号|マイナンバー|my\s*number)[^\d]{0,15}(\d{4}[\s-]?\d{4}[\s-]?\d{4})/gi,
    },
    {
        id: 'confidential_keyword',
        label: '社外秘キーワード',
        priority: 'high',
        pattern: /(社外秘|極秘|部外秘|秘密|取扱注意|\bConfidential\b|\bDo\s*Not\s*Distribute\b)/gi,
    },
    {
        id: 'postal_code',
        label: '郵便番号',
        priority: 'medium',
        pattern: /(?<!\d[-ー])〒?\s?\d{3}[-ー]\d{4}(?![-ー]\d)/g,
    },
];

/**
 * 検出値をマスク表示用に変換
 * @param value - 検出された値
 * @param type - 検出タイプ
 * @returns マスクされた値
 */
function maskValue(value: string, type: string): string {
    if (!value) return '';

    switch (type) {
        case 'credit_card': {
            // 最初の4桁と最後の4桁を表示
            const digits = value.replace(/[\s-]/g, '');
            if (digits.length >= 8) {
                return `${digits.slice(0, 4)}-****-****-${digits.slice(-4)}`;
            }
            return value.replace(/\d(?=\d{4})/g, '*');
        }

        case 'phone_number': {
            // 電話番号のマスク処理（携帯・固定両対応）
            const phoneDigits = value.replace(/[-\s]/g, '');
            if (phoneDigits.length === 11) {
                // 携帯電話（11桁）: 090-****-1234
                return value.replace(/(\d{3})[-\s]?\d{4}[-\s]?(\d{4})/, '$1-****-$2');
            } else if (phoneDigits.length === 10) {
                // 固定電話（10桁）: 先頭2〜5桁 + **** + 末尾4桁
                const lastFour = phoneDigits.slice(-4);
                const hyphenMatch = value.match(/^(0\d{1,4})[-\s]/);
                if (hyphenMatch) {
                    return `${hyphenMatch[1]}-****-${lastFour}`;
                }
                return `${phoneDigits.slice(0, 3)}-****-${lastFour}`;
            }
            return value;
        }

        case 'email': {
            // @の前を部分マスク
            const [local, domain] = value.split('@');
            if (local.length <= 2) {
                return `${local[0]}***@${domain}`;
            }
            return `${local.slice(0, 2)}***@${domain}`;
        }

        case 'my_number': {
            // 先頭4桁のみ表示
            const numMatch = value.match(/\d{12}/);
            if (numMatch) {
                return `${numMatch[0].slice(0, 4)}-****-****`;
            }
            return value.replace(/\d/g, '*');
        }

        case 'confidential_keyword':
            // キーワードはそのまま表示
            return value;

        case 'postal_code':
            // そのまま表示（郵便番号は公開情報のため）
            return value;

        case 'api_key': {
            // 先頭のプレフィックスと末尾4文字のみ表示
            if (value.length > 10) {
                const prefix = value.match(/^[a-zA-Z_-]+/)?.[0] || '';
                return `${prefix}...${value.slice(-4)}`;
            }
            return `${value.slice(0, 4)}...`;
        }

        default:
            // デフォルト: 先頭3文字のみ表示
            if (value.length > 6) {
                return `${value.slice(0, 3)}***`;
            }
            return value;
    }
}

/**
 * テキストをスキャンし、機密情報の検知結果を返す
 * @param text - スキャン対象のテキスト
 * @returns { hasWarning: boolean, detections: Detection[] }
 */
export function scanText(text: string | null | undefined): ScanResult {
    if (!text || typeof text !== 'string') {
        return { hasWarning: false, detections: [] };
    }

    const detections: Detection[] = [];
    // 電話番号・クレジットカード番号のマッチを記録（郵便番号の誤検知除去に使用）
    let phoneNumberMatches: string[] = [];
    let creditCardMatches: string[] = [];

    for (const patternDef of DETECTION_PATTERNS) {
        // パターンをリセット（lastIndexをクリア）
        const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);
        const matches: string[] = text.match(regex) || [];

        // バリデーターがある場合はフィルタリング
        let validMatches: string[] = matches;
        if (patternDef.validator) {
            validMatches = matches.filter(match => patternDef.validator!(match));
        }

        // クレジットカード番号のマッチを記録
        if (patternDef.id === 'credit_card') {
            creditCardMatches = validMatches;
        }

        // 電話番号のマッチを記録
        if (patternDef.id === 'phone_number') {
            phoneNumberMatches = validMatches;
        }

        // 郵便番号の場合、電話番号・クレジットカード番号の一部として含まれるマッチを除外
        if (patternDef.id === 'postal_code') {
            const excludePatterns = [...phoneNumberMatches, ...creditCardMatches];
            if (excludePatterns.length > 0) {
                validMatches = validMatches.filter(postalMatch => {
                    const postalDigits = postalMatch.replace(/[〒\s]/g, '');
                    return !excludePatterns.some(parentMatch => {
                        return parentMatch.includes(postalDigits) ||
                            parentMatch.replace(/[-\s]/g, '').includes(postalDigits.replace(/[-ー]/g, ''));
                    });
                });
            }
        }

        if (validMatches.length > 0) {
            // 検出値をマスク処理（すべて表示、重複も含む）
            const maskedMatches = validMatches.map(m => maskValue(m, patternDef.id));

            detections.push({
                id: patternDef.id,
                label: patternDef.label,
                priority: patternDef.priority,
                count: validMatches.length,
                matches: maskedMatches,
            });
        }
    }

    return {
        hasWarning: detections.length > 0,
        detections,
    };
}

/**
 * テキストをスキャンし、マッチ位置情報を含む検知結果を返す
 * ハイライト表示用
 * @param text - スキャン対象のテキスト
 * @returns { hasWarning: boolean, highlights: Highlight[] }
 */
export function scanTextWithPositions(text: string | null | undefined): ScanResultWithPositions {
    if (!text || typeof text !== 'string') {
        return { hasWarning: false, highlights: [] };
    }

    const highlights: Highlight[] = [];
    // 重複除去用のSet（開始-終了位置を文字列化）
    const seenPositions = new Set<string>();

    for (const patternDef of DETECTION_PATTERNS) {
        // execで位置情報を取得するためにRegExpを再作成
        const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);
        let match;

        while ((match = regex.exec(text)) !== null) {
            const matchedText = match[0];
            const start = match.index;
            const end = start + matchedText.length;

            // バリデーターがある場合はチェック
            if (patternDef.validator && !patternDef.validator(matchedText)) {
                continue;
            }

            // 重複チェック
            const posKey = `${start}-${end}`;
            if (seenPositions.has(posKey)) {
                continue;
            }
            seenPositions.add(posKey);

            highlights.push({
                start,
                end,
                type: patternDef.id,
                priority: patternDef.priority,
            });
        }
    }

    // 開始位置でソート
    highlights.sort((a, b) => a.start - b.start);

    return {
        hasWarning: highlights.length > 0,
        highlights,
    };
}

/**
 * 検知結果の優先度に基づいてソート
 * @param detections - 検知結果配列
 * @returns ソート済み配列
 */
export function sortDetectionsByPriority(detections: Detection[]): Detection[] {
    const priorityOrder: Record<DetectionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...detections].sort((a, b) =>
        (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
    );
}

export default { scanText, scanTextWithPositions, sortDetectionsByPriority };
