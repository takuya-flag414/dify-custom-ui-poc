// src/tests/index.js
// テストケース一覧

import { moduleIntegrityTest } from './basic/moduleIntegrity';
import { chatFlowTest } from './basic/chatFlow';
import { historyLoadTest } from './basic/historyLoad';
import { messageActionsTest } from './basic/messageActions';
import { connectionTest } from './api/connectionTest';
import { streamingTest } from './api/streamingTest';

// 基本テスト（FE Mock対応）
export const basicTests = [
  moduleIntegrityTest,
  chatFlowTest,
  historyLoadTest,
  messageActionsTest,
];

// APIテスト（Real/BEモードのみ）
export const apiTests = [
  connectionTest,
  streamingTest,
];

// モードに応じた有効テスト取得
export const getAvailableTests = (mockMode) => {
  const tests = [...basicTests];
  
  // BE Mock または Real API モードの場合、APIテストも追加
  if (mockMode !== 'FE') {
    tests.push(...apiTests);
  }
  
  return tests;
};

// テストカテゴリ
export const TEST_CATEGORIES = {
  basic: {
    id: 'basic',
    name: '基本テスト',
    icon: '🟢',
    description: 'FE Mockモードでも実行可能',
  },
  api: {
    id: 'api',
    name: 'APIテスト',
    icon: '🔵',
    description: 'Real/BEモードのみ',
  },
};
