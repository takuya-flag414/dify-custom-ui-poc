export type BotVisibility = 'private' | 'department' | 'public';

export interface CustomBot {
  bot_id: string;
  name: string;
  description: string;
  system_prompt: string;
  creator_uid: string;
  department_id: string;
  visibility: BotVisibility;
  rag_config?: {
    enabled: boolean;
    target_store_id?: string;
    target_store_name?: string;
  };
  context_file_url?: string;
  context_file_urls?: string[];
  created_at: string;
  updated_at?: string;
}
