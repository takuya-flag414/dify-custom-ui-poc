// src/components/ProcessStatusIndicator.jsx
import React from 'react';
import './styles/ProcessStatusIndicator.css';

/**
 * AIの思考・処理プロセスを表示するインジケーター
 * @param {string} status - 表示するステータステキスト (例: "Web検索中...")
 */
const ProcessStatusIndicator = ({ status }) => {
  if (!status) return null;

  // ステータスに応じたアイコンの出し分け (簡易ロジック)
  const getIcon = (text) => {
    if (text.includes('検索')) return '🔍';
    if (text.includes('ドキュメント')) return '📄';
    if (text.includes('思考') || text.includes('開始')) return '🤔';
    if (text.includes('情報源')) return '📚';
    if (text.includes('回答')) return '✍️';
    return '⟳'; // デフォルト
  };

  return (
    <div className="process-status-container">
      <span className="process-status-icon">{getIcon(status)}</span>
      <span className="process-status-text">{status}</span>
    </div>
  );
};

export default ProcessStatusIndicator;