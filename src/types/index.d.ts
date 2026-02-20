// src/types/index.d.ts
// グローバル型定義と共通型のエクスポート

/**
 * API関連の型
 */
export interface ApiConfig {
    apiUrl: string;
    apiKey: string;
    user: string;
}

/**
 * 会話関連の型
 */
export interface Conversation {
    id: string;
    name: string;
    created_at: number;
    updated_at: number;
}

/**
 * メッセージ関連の型
 */
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: number;
    conversation_id?: string;
}

/**
 * ファイルアップロード関連の型
 */
export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    upload_file_id?: string;
}

/**
 * ユーザー設定の型
 */
export interface UserSettings {
    displayName: string;
    aiStyle: string;
    ragEnabled: boolean;
    webEnabled: boolean;
}

/**
 * Vite環境変数の型拡張
 */
interface ImportMetaEnv {
    readonly VITE_DIFY_API_URL?: string;
    readonly VITE_DIFY_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
