// DOCXエクスポートに関連する共通型定義

export interface DocxExportOptions {
  fileName?: string;
  themeName?: string;
  palette?: string;
}

export interface DocxBlock {
  type: string;
  [key: string]: any;
}

export interface DocxPage {
  blocks: DocxBlock[];
}

// テーマごとのフォントや色設定の定義（将来用）
export interface DocxThemeConfig {
  fontFamily: {
    heading: string; // 見出し用フォント
    body: string;    // 本文用フォント
    code: string;    // コード用フォント
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    bgMain: string;
    bgDark: string;
    border: string;
  };
}
