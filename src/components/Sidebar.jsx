// src/components/Sidebar.jsx
import React, { useState } from 'react';
import './styles/Sidebar.css'; // Sidebar用のCSS

/**
 * サイドバー (T-04 履歴リストの雛形)
 * @param {string} conversationId
 * @param {function} setConversationId
 * @param {Array} messagesLog - App.jsx の会話ログ
 * @param {Array} systemLogs - App.jsx のシステムログ
 */
const Sidebar = ({
  conversationId,
  setConversationId,
  messagesLog,
  systemLogs,
}) => {
  // T-04時点のダミーデータ
  const [conversations, setConversations] = useState([
    { id: 'conv_1', name: 'Dify API連携について' },
    { id: 'conv_2', name: 'PoCロードマップの進捗' },
    { id: 'conv_3', name: 'UIデザインの検討' },
  ]);

  const [copyButtonText, setCopyButtonText] = useState('ログをクリップボードにコピー');

  const handleNewChat = () => {
    // 新規チャット (新基本設計書 5.2.1)
    setConversationId(null);
  };

  const handleSelectConversation = (id) => {
    // 履歴表示 (新基本設計書 5.2.2)
    setConversationId(id);
  };

  // --- 🔽 デバッグログ機能 🔽 ---
  const handleCopyLogs = () => {
    console.log('[Sidebar] Copying logs to clipboard...', 'info');
    let logContent = '--- PoC Debug Logs ---\n\n';

    // 1. システムログ
    logContent += '--- System Logs ---\n';
    logContent += systemLogs.join('\n');
    logContent += '\n\n';

    // 2. 会話ログ (messages)
    logContent += '--- Conversation Logs (JSON) ---\n';
    try {
      logContent += JSON.stringify(messagesLog, null, 2); // 見やすく整形
    } catch (error) {
      console.error('[Sidebar] Failed to stringify messagesLog:', error);
      logContent += 'Failed to stringify conversation logs.';
    }
    logContent += '\n\n--- End of Logs ---';

    // 3. クリップボードにコピー
    navigator.clipboard
      .writeText(logContent)
      .then(() => {
        console.log('[Sidebar] Logs copied successfully!', 'info');
        setCopyButtonText('コピーしました！');
        setTimeout(() => setCopyButtonText('ログをクリップボードにコピー'), 2000);
      })
      .catch((err) => {
        console.error('[Sidebar] Failed to copy logs:', err);
        setCopyButtonText('コピーに失敗しました');
        setTimeout(() => setCopyButtonText('ログをクリップボードにコピー'), 2000);
      });
  };
  // --- 🔼 デバッグログ機能 🔼 ---

  return (
    <div className="sidebar">
      {/* --- ヘッダーと新規チャット --- */}
      <div className="sidebar-header">
        <h1 className="sidebar-title">社内AIチャット PoC</h1>
        <button className="new-chat-button" onClick={handleNewChat}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          新しいチャット
        </button>
      </div>

      {/* --- 会話履歴リスト (T-04) --- */}
      <div className="conversation-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${
              conv.id === conversationId ? 'active' : ''
            }`}
            onClick={() => handleSelectConversation(conv.id)}
          >
            {conv.name}
          </div>
        ))}
      </div>

      {/* --- 🔽 デバッグツール 🔽 --- */}
      <div className="sidebar-debug-tools">
        <h4 className="debug-title">[PoC デバッグ]</h4>
        <button className="debug-copy-button" onClick={handleCopyLogs}>
          {copyButtonText}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;