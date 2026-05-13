/**
 * 利用可能なカラーパレット名の定義
 */
export type PaletteName = 'blue' | 'green' | 'navy' | 'red' | 'gray';

/**
 * すべてのパレットが持つべき共通のカラーロール（役割）定義
 */
export interface ColorRoles {
  /** ベースとなる主調色（例：グラフのメイン、強調テキスト） */
  primary: string;
  /** 主調色の暗いトーン（例：ヘッダー背景、グラデーションの影） */
  primaryDark: string;
  /** 主調色の明るいトーン（例：薄い背景、チップの背景） */
  primaryLight: string;
  /** アクセント色（例：特に目立たせたいポイント、警告） */
  accent: string;
  /** グラデーション等で使用するサブカラー（オプション） */
  secondary?: string;
  /** ダークモードやセクションスライドで使用する背景色（オプション） */
  darkBg?: string;
}
