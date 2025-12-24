// src/utils/privacyDetector.js
/**
 * 機密情報検知ユーティリティ
 * The Intelligent Guardian - Phase 1
 * 
 * クライアントサイドで機密情報をリアルタイム検知する
 */

/**
 * Luhnアルゴリズムによるクレジットカード番号の検証
 * @param {string} num - 数字のみの文字列
 * @returns {boolean} - 有効なカード番号かどうか
 */
function luhnCheck(num) {
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
const DETECTION_PATTERNS = [
  {
    id: 'credit_card',
    label: 'クレジットカード番号',
    priority: 'critical',
    // 14-16桁の数字（ハイフンやスペース区切り対応）
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4}\b/g,
    validator: (match) => {
      const digits = match.replace(/[\s-]/g, '');
      return luhnCheck(digits);
    },
  },
  {
    id: 'api_key',
    label: 'APIキー',
    priority: 'critical',
    // 各種サービスのAPIキーパターン
    pattern: /\b(sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}|AIza[a-zA-Z0-9_-]{35}|sk_live_[a-zA-Z0-9]{24,}|sk_test_[a-zA-Z0-9]{24,}|xoxb-[a-zA-Z0-9-]+|xoxp-[a-zA-Z0-9-]+|[a-zA-Z0-9]{32}(?=.*[Aa][Pp][Ii].*[Kk][Ee][Yy]))\b/g,
  },
  {
    id: 'phone_number',
    label: '電話番号',
    priority: 'high',
    // 日本の携帯電話番号（090/080/070）
    pattern: /\b0[789]0[-\s]?\d{4}[-\s]?\d{4}\b/g,
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
    // 12桁の数字で、周辺に「個人番号」「マイナンバー」などのキーワードがある場合
    pattern: /(?:個人番号|マイナンバー|my\s*number)[^\d]{0,15}(\d{4}[\s-]?\d{4}[\s-]?\d{4})/gi,
  },
  {
    id: 'confidential_keyword',
    label: '社外秘キーワード',
    priority: 'high',
    // 機密性を示すキーワード
    // 日本語キーワードは \b が効かないため、単語境界なしでマッチ
    // 英語キーワードのみ単語境界を使用
    pattern: /(社外秘|極秘|部外秘|秘密|取扱注意|\bConfidential\b|\bDo\s*Not\s*Distribute\b)/gi,
  },
  {
    id: 'postal_code',
    label: '郵便番号',
    priority: 'medium',
    // 日本の郵便番号パターン（前後に数字がない場合のみ）
    pattern: /(?<!\d)〒?\s?\d{3}[-ー]\d{4}(?!\d)/g,
  },
];

/**
 * 検出値をマスク表示用に変換
 * @param {string} value - 検出された値
 * @param {string} type - 検出タイプ
 * @returns {string} - マスクされた値
 */
function maskValue(value, type) {
  if (!value) return '';
  
  switch (type) {
    case 'credit_card':
      // 最初の4桁と最後の4桁を表示
      const digits = value.replace(/[\s-]/g, '');
      if (digits.length >= 8) {
        return `${digits.slice(0, 4)}-****-****-${digits.slice(-4)}`;
      }
      return value.replace(/\d(?=\d{4})/g, '*');
      
    case 'phone_number':
      // 最初の3桁と最後の4桁を表示
      return value.replace(/(\d{3})[-\s]?\d{4}[-\s]?(\d{4})/, '$1-****-$2');
      
    case 'email':
      // @の前を部分マスク
      const [local, domain] = value.split('@');
      if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
      }
      return `${local.slice(0, 2)}***@${domain}`;
      
    case 'my_number':
      // 先頭4桁のみ表示
      const numMatch = value.match(/\d{12}/);
      if (numMatch) {
        return `${numMatch[0].slice(0, 4)}-****-****`;
      }
      return value.replace(/\d/g, '*');
      
    case 'confidential_keyword':
      // キーワードはそのまま表示
      return value;
      
    case 'postal_code':
      // そのまま表示（郵便番号は公開情報のため）
      return value;
      
    case 'api_key':
      // 先頭のプレフィックスと末尾4文字のみ表示
      if (value.length > 10) {
        const prefix = value.match(/^[a-zA-Z_-]+/)?.[0] || '';
        return `${prefix}...${value.slice(-4)}`;
      }
      return `${value.slice(0, 4)}...`;
      
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
 * @param {string} text - スキャン対象のテキスト
 * @returns {{ hasWarning: boolean, detections: Array<{id: string, label: string, priority: string, count: number, matches: string[]}> }}
 */
export function scanText(text) {
  if (!text || typeof text !== 'string') {
    return { hasWarning: false, detections: [] };
  }

  const detections = [];

  for (const patternDef of DETECTION_PATTERNS) {
    // パターンをリセット（lastIndexをクリア）
    const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);
    const matches = text.match(regex) || [];
    
    // バリデーターがある場合はフィルタリング
    let validMatches = matches;
    if (patternDef.validator) {
      validMatches = matches.filter(match => patternDef.validator(match));
    }

    if (validMatches.length > 0) {
      // 検出値をマスク処理（すべて表示、重複も含む）
      const maskedMatches = validMatches.map(m => maskValue(m, patternDef.id));
      
      detections.push({
        id: patternDef.id,
        label: patternDef.label,
        priority: patternDef.priority,
        count: validMatches.length,
        matches: maskedMatches, // マスク済みの検出値を追加
      });
    }
  }

  return {
    hasWarning: detections.length > 0,
    detections,
  };
}

/**
 * 検知結果の優先度に基づいてソート
 * @param {Array} detections - 検知結果配列
 * @returns {Array} - ソート済み配列
 */
export function sortDetectionsByPriority(detections) {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...detections].sort((a, b) => 
    (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
  );
}

export default { scanText, sortDetectionsByPriority };
