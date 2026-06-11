import { CustomBot } from '../types/customBot';

// localStorage のキー（モックDBとして使用）
const STORAGE_KEY = 'mock_custom_bots_db';

// モックの初期データ
const initialMockData: CustomBot[] = [
  {
    bot_id: 'bot_mock_001',
    name: '社内規程お問合せボット',
    description: '全社の就業規則や経費精算ルールについて回答します。',
    system_prompt: 'あなたは社内規程に詳しいアシスタントです。提供されたコンテキストに基づいて正確に回答してください。',
    creator_uid: 'mock_admin',
    department_id: 'dept_hr',
    visibility: 'public',
    rag_config: {
      enabled: true,
      target_store_id: 'corpora/mock_store_001',
      target_store_name: 'corp_rules_2026',
    },
    created_at: new Date().toISOString(),
  },
  {
    bot_id: 'bot_mock_002',
    name: '契約書リーガルチェックボット',
    description: '自社の標準フォーマットに基づき契約書のリスクをチェックします。',
    system_prompt: 'あなたは厳格な法務担当です。添付された契約書と自社の基準を比較し、リスクと修正案を提示してください。',
    creator_uid: 'mock_legal_user',
    department_id: 'dept_legal',
    visibility: 'department',
    context_file_url: 'gs://mock-bucket/custom_bots/bot_mock_002/standard_contract.pdf',
    created_at: new Date().toISOString(),
  },
];

// --- モックDB操作ヘルパー ---

const getMockDb = (): CustomBot[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // パースエラー時は初期データで上書き
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData));
      return initialMockData;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData));
  return initialMockData;
};

const saveMockDb = (data: CustomBot[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Mock API Functions ---

/**
 * カスタムボット一覧を取得する（モック）
 * @param scope 'my_bots' | 'department' | 'public'
 * @param currentUid 現在のユーザーUID
 * @param currentDepartmentId 現在のユーザーの部署ID（引数から受け取りハードコードを排除）
 */
export const fetchCustomBots = async (
  scope: 'my_bots' | 'department' | 'public',
  currentUid: string = 'mock_current_user',
  currentDepartmentId?: string | number
): Promise<CustomBot[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // ネットワーク遅延をシミュレート
  const db = getMockDb();

  return db.filter((bot) => {
    if (scope === 'my_bots') {
      return bot.creator_uid === currentUid;
    } else if (scope === 'department') {
      // currentDepartmentId が未設定の場合は全部署ボットを返す（開発中の利便性確保）
      if (!currentDepartmentId) return bot.visibility === 'department';
      return bot.visibility === 'department' && String(bot.department_id) === String(currentDepartmentId);
    } else if (scope === 'public') {
      return bot.visibility === 'public';
    }
    return false;
  });
};

/**
 * カスタムボットを新規作成する（モック）
 */
export const createCustomBot = async (
  data: Omit<CustomBot, 'bot_id' | 'created_at'>
): Promise<CustomBot> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const db = getMockDb();
  const newBot: CustomBot = {
    ...data,
    bot_id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  db.push(newBot);
  saveMockDb(db);
  return newBot;
};

/**
 * カスタムボットを更新する（モック）
 */
export const updateCustomBot = async (
  bot_id: string,
  data: Partial<CustomBot>
): Promise<CustomBot> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const db = getMockDb();
  const index = db.findIndex((b) => b.bot_id === bot_id);
  if (index === -1) throw new Error(`Bot not found: ${bot_id}`);

  const updatedBot: CustomBot = {
    ...db[index],
    ...data,
    updated_at: new Date().toISOString(),
  };
  db[index] = updatedBot;
  saveMockDb(db);
  return updatedBot;
};

/**
 * カスタムボットを削除する（モック）
 */
export const deleteCustomBot = async (bot_id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const db = getMockDb();
  const newDb = db.filter((b) => b.bot_id !== bot_id);
  saveMockDb(newDb);
};

/**
 * コンテキストファイルを Firebase Storage にアップロードしてURLを取得する（モック）
 * 本番環境では Cloud Functions 経由のアップロードに置き換える
 * @returns gs:// 形式のモックURL（ファイル名を含む）
 */
export const uploadToStorageAndGetUrl = async (file: File): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  // ファイル名をURLに含め、編集モーダルで元のファイル名を表示できるようにする
  return `gs://mock-bucket/custom_bots/${Date.now()}_${file.name}`;
};
