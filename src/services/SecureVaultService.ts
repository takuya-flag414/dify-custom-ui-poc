// src/services/SecureVaultService.ts
/**
 * SecureVaultService - End-to-End Privacy Tunneling (Phase 2)
 * 
 * ブラウザメモリ上で機密情報を保管するシングルトンサービス。
 * セッション単位（リロードで消滅）で動作し、機密情報はこのVault以外に存在させない。
 */

import { scanTextWithPositions, type DetectionPriority, type Highlight } from '../utils/privacyDetector';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface VaultEntry {
    token: string;            // "{{PHONE_NUMBER_A1}}"
    originalValue: string;    // "090-1234-5678"
    category: DetectionPriority;
    label: string;            // "電話番号"
    detectionId: string;      // "phone_number"
    createdAt: number;
}

export interface SanitizeResult {
    sanitizedText: string;
    appliedTokens: VaultEntry[];
    originalText: string;
}

// 検知IDからトークンカテゴリ名へのマッピング
const CATEGORY_MAP: Record<string, string> = {
    credit_card: 'CREDIT_CARD',
    api_key: 'API_KEY',
    phone_number: 'PHONE_NUMBER',
    email: 'EMAIL',
    my_number: 'MY_NUMBER',
    confidential_keyword: 'CONFIDENTIAL',
    postal_code: 'POSTAL_CODE',
};

// 検知IDからラベルへのマッピング
const LABEL_MAP: Record<string, string> = {
    credit_card: 'クレジットカード番号',
    api_key: 'APIキー',
    phone_number: '電話番号',
    email: 'メールアドレス',
    my_number: 'マイナンバー',
    confidential_keyword: '社外秘キーワード',
    postal_code: '郵便番号',
};

// トークンパターンの正規表現（復元・検出用）
export const TOKEN_PATTERN = /\{\{([A-Z_]+_[A-Z0-9]+)\}\}/g;

// 伏字表示テキスト（未復元トークン用）
export const REDACTED_TEXT = '機密情報を含むため伏せてあります';
export const REDACTED_TOOLTIP = 'このセッションでは復元できません。元の情報はサーバーに送信されていません。';

// ──────────────────────────────────────────────
// SecureVaultService
// ──────────────────────────────────────────────

class SecureVaultServiceImpl {
    // セッションメモリ内でのみ保持（Reload で消滅）
    private vault: Map<string, VaultEntry> = new Map();

    // 値 → トークン の逆引き（同一値の再利用検出用）
    private reverseMap: Map<string, string> = new Map();

    // カテゴリごとのインクリメンタルカウンター
    private counters: Map<string, number> = new Map();

    /**
     * インクリメンタルIDを生成（A1, B2, C3, ...）
     */
    private generateIndex(category: string): string {
        const count = (this.counters.get(category) || 0) + 1;
        this.counters.set(category, count);
        // A1, B2, ... Z26, AA27, ...
        const letter = String.fromCharCode(65 + ((count - 1) % 26));
        return `${letter}${count}`;
    }

    /**
     * コードブロック範囲を検出
     */
    private getCodeBlockRanges(text: string): Array<{ start: number; end: number }> {
        const ranges: Array<{ start: number; end: number }> = [];
        const regex = /```[\s\S]*?```/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            ranges.push({ start: match.index, end: match.index + match[0].length });
        }
        return ranges;
    }

    /**
     * 指定位置がコードブロック内かどうかチェック
     */
    private isInsideCodeBlock(
        pos: number,
        codeBlocks: Array<{ start: number; end: number }>
    ): boolean {
        return codeBlocks.some(block => pos >= block.start && pos < block.end);
    }

    /**
     * テキスト内の機密情報をトークンに置換し、Vault に保存する
     * @param options.excludeTypes - サニタイズから除外する検知タイプ ID の配列（例: ["email", "phone_number"]）
     */
    public sanitize(text: string, options?: { excludeTypes?: string[] }): SanitizeResult {
        const result = scanTextWithPositions(text);

        if (!result.hasWarning || result.highlights.length === 0) {
            return { sanitizedText: text, appliedTokens: [], originalText: text };
        }

        const codeBlocks = this.getCodeBlockRanges(text);
        const excludeTypes = options?.excludeTypes || [];

        // コードブロック内のハイライト + ユーザー除外タイプを除外
        const filteredHighlights = result.highlights.filter(
            h => !this.isInsideCodeBlock(h.start, codeBlocks) &&
                !excludeTypes.includes(h.type)
        );

        if (filteredHighlights.length === 0) {
            return { sanitizedText: text, appliedTokens: [], originalText: text };
        }

        const appliedTokens: VaultEntry[] = [];

        // 後ろから置換してインデックスずれを防ぐ
        let sanitizedText = text;
        const reversedHighlights = [...filteredHighlights].sort((a, b) => b.start - a.start);

        for (const highlight of reversedHighlights) {
            const originalValue = text.slice(highlight.start, highlight.end);
            const categoryKey = CATEGORY_MAP[highlight.type] || highlight.type.toUpperCase();
            const detectionId = highlight.type;

            // 同一値が既にトークン化済みなら再利用
            let token: string;
            if (this.reverseMap.has(originalValue)) {
                token = this.reverseMap.get(originalValue)!;
            } else {
                const index = this.generateIndex(categoryKey);
                token = `{{${categoryKey}_${index}}}`;

                const entry: VaultEntry = {
                    token,
                    originalValue,
                    category: highlight.priority,
                    label: LABEL_MAP[detectionId] || detectionId,
                    detectionId,
                    createdAt: Date.now(),
                };

                this.vault.set(token, entry);
                this.reverseMap.set(originalValue, token);
                appliedTokens.push(entry);
            }

            // テキスト内で置換
            sanitizedText =
                sanitizedText.slice(0, highlight.start) +
                token +
                sanitizedText.slice(highlight.end);
        }

        return { sanitizedText, appliedTokens, originalText: text };
    }

    /**
     * テキスト内のトークンを元の値に復元する。
     * Vault に存在しないトークンはそのまま残す（MessageBlock 側で伏字表示）。
     */
    public restore(text: string): string {
        return text.replace(TOKEN_PATTERN, (match) => {
            const entry = this.vault.get(match);
            return entry ? entry.originalValue : match;
        });
    }

    /**
     * トークンが Vault に存在するか確認
     */
    public hasToken(token: string): boolean {
        return this.vault.has(token);
    }

    /**
     * 特定トークンのエントリを取得
     */
    public getEntry(token: string): VaultEntry | undefined {
        return this.vault.get(token);
    }

    /**
     * Vault にエントリがあるか
     */
    public hasEntries(): boolean {
        return this.vault.size > 0;
    }

    /**
     * 現在のエントリ数を返す
     */
    public getEntryCount(): number {
        return this.vault.size;
    }

    /**
     * LLM向けのシステムプロンプト注入テキストを生成
     */
    public getSystemPromptInjection(): string {
        if (this.vault.size === 0) return '';

        return (
            'ユーザー入力内の `{{...}}` はプライバシー保護のために置換された機密情報です。' +
            'このトークンは特定の値を指す識別子として扱い、計算や加工はせずに、' +
            '文脈上必要な場合はそのまま出力に含めてください。'
        );
    }

    /**
     * Vault をクリア
     */
    public clear(): void {
        this.vault.clear();
        this.reverseMap.clear();
        this.counters.clear();
    }
}

// シングルトンインスタンス
export const SecureVaultService = new SecureVaultServiceImpl();
export default SecureVaultService;
