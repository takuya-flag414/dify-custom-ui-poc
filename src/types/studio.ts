/**
 * Studios - Type Definitions
 * 
 * Phase A: Frontend Mockup & Experience Design
 * Dify連携は Phase B で実装予定
 */

/** Apple Intelligence カラーパレット */
export type IntelligenceColor =
    | 'cyan'
    | 'magenta'
    | 'yellow'
    | 'blue'
    | 'orange'
    | 'green'
    | 'purple';

/** モックファイル（Knowledge Base用） */
export interface MockFile {
    id: string;
    name: string;
    type: 'pdf' | 'txt' | 'md';
}

/**
 * Studio インターフェース
 * 
 * 各Studioは、特定の業務に特化した作業空間を定義します。
 */
export interface Studio {
    /** 一意識別子 (UUID) */
    id: string;

    /** 表示名 (例: "Translation Studio") */
    name: string;

    /** 短い説明 */
    description: string;

    /** アイコン (絵文字またはSVGパス) */
    icon: string;

    /** テーマカラー - Apple Intelligence Glow の基調色 */
    themeColor: IntelligenceColor;

    /** Difyへの指示 (System Instruction) */
    systemPrompt: string;

    /** 仮想的な添付ファイルリスト */
    knowledgeFiles: MockFile[];

    /** ChatInputのプレースホルダー (例: "翻訳するテキストを入力...") */
    inputPlaceholder: string;

    /** 入室時の初回メッセージ */
    welcomeMessage: string;
}

/**
 * StudioContext の型定義
 */
export interface StudioContextType {
    /** 利用可能な全Studio */
    studios: Studio[];

    /** 現在アクティブなStudio ID (null = Gallery表示中) */
    activeStudioId: string | null;

    /** 現在アクティブなStudioオブジェクト */
    activeStudio: Studio | null;

    /** Studioに入室する */
    enterStudio: (id: string) => void;

    /** Galleryに戻る */
    exitStudio: () => void;

    /** 新しいStudioを作成する */
    createStudio: (data: Partial<Studio>) => void;

    /** Studioを削除する */
    deleteStudio: (id: string) => void;

    /** 既存のStudioを更新する */
    updateStudio: (id: string, data: Partial<Studio>) => void;
}
