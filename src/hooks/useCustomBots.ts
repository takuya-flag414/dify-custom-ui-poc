import { CustomBot } from '../types/customBot';
import { MockMode } from '../config/env';
import * as mockApi from '../mocks/customBotsApi';

/**
 * カスタムボットのCRUD操作を提供するカスタムフック。
 * mockMode が 'FE' または 'BE' の場合はローカルモックAPIを使用し、
 * 'OFF' の場合は実際のバックエンドAPIへリクエストを送信します。
 *
 * ※バックエンド移行時は mockMode='OFF' に設定し、apiUrl と apiKey を正しく渡してください。
 */
export const useCustomBots = (mockMode: MockMode, apiUrl: string, apiKey: string, currentUser: any) => {
  // バックエンドAPI用の共通ヘッダー
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  });

  // バックエンドAPIが未完成（モック段階）のため、当面は常にモックを使用する
  const shouldUseMock = true; // mockMode === 'FE' || mockMode === 'BE';

  /**
   * カスタムボット一覧を取得する
   */
  const fetchBots = async (scope: 'my_bots' | 'department' | 'public'): Promise<CustomBot[]> => {
    if (shouldUseMock) {
      return await mockApi.fetchCustomBots(
        scope,
        currentUser?.id,
        currentUser?.departmentId
      );
    } else {
      const res = await fetch(`${apiUrl}/api/custom-bots?scope=${scope}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch bots');
      return await res.json();
    }
  };

  /**
   * カスタムボットを新規作成する
   */
  const createBot = async (botData: any): Promise<CustomBot> => {
    // currentUser の情報を自動注入（バックエンド側でも同様の処理を行う）
    const dataWithUser = {
      ...botData,
      department_id: botData.department_id || currentUser?.departmentId,
      creator_uid: currentUser?.id,
    };

    if (shouldUseMock) {
      return await mockApi.createCustomBot(dataWithUser);
    } else {
      const res = await fetch(`${apiUrl}/api/custom-bots`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dataWithUser)
      });
      if (!res.ok) throw new Error('Failed to create bot');
      return await res.json();
    }
  };

  /**
   * カスタムボットを更新する
   */
  const updateBot = async (botId: string, botData: any): Promise<CustomBot> => {
    if (shouldUseMock) {
      return await mockApi.updateCustomBot(botId, botData);
    } else {
      const res = await fetch(`${apiUrl}/api/custom-bots/${botId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(botData)
      });
      if (!res.ok) throw new Error('Failed to update bot');
      return await res.json();
    }
  };

  /**
   * カスタムボットを削除する
   */
  const deleteBot = async (botId: string): Promise<void> => {
    if (shouldUseMock) {
      return await mockApi.deleteCustomBot(botId);
    } else {
      const res = await fetch(`${apiUrl}/api/custom-bots/${botId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete bot');
    }
  };

  /**
   * コンテキストファイルをStorageにアップロードしてURLを取得する
   * ※本番環境では Cloud Functions 経由のアップロードに置き換える
   */
  const uploadContextFile = async (file: File): Promise<string> => {
    if (shouldUseMock) {
      return await mockApi.uploadToStorageAndGetUrl(file);
    } else {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        // FormDataを使う場合はContent-Typeを自動設定させるためヘッダーから除外
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload file');
      const data = await res.json();
      return data.url;
    }
  };

  return { fetchBots, createBot, updateBot, deleteBot, uploadContextFile };
};
