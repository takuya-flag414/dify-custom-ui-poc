// src/components/Sidebar.jsx
import React, { useState } from 'react';
import './styles/Sidebar.css'; // Sidebar用のCSS

/**
 * サイドバー (T-04 履歴リストの雛形)
 * @param {string} conversationId
 * @param {function} setConversationId
 * ★ デバッグ用props (messagesLog, systemLogs) を削除
 */
const Sidebar = ({
  conversationId,
  setConversationId,
}) => {
  // T-04時点のダミーデータ
  const [conversations, setConversations] = useState([
    { id: 'conv_1', name: 'Dify API連携について' },
    { id: 'conv_2', name: 'PoCロードマップの進捗' },
    { id: 'conv_3', name: 'UIデザインの検討' },
  ]);

  // ★ copyButtonText state を削除
  // const [copyButtonText, setCopyButtonText] = useState('ログをクリップボードにコピー');

  const handleNewChat = () => {
    // 新規チャット (新基本設計書 5.2.1)
    setConversationId(null);
  };

  const handleSelectConversation = (id) => {
    // 履歴表示 (新基本設計書 5.2.2)
    setConversationId(id);
  };

  // --- 🔽 デバッグログ機能 (handleCopyLogs) を削除 🔽 ---
  // ...
  // --- 🔼 デバッグログ機能 🔼 ---

  return (
    <div className="sidebar">
      {/* --- ヘッダーと新規チャット --- */}
      <div className="sidebar-header">
        {/* ★プロトタイプ準拠: ロゴアイコンを追加 */}
        <div style={{ color: '#2563EB', width: '32px', height: '32px' }}>
          <LogoIcon />
        </div>
        <h1 className="sidebar-title">社内AI (PoC)</h1>
      </div>

      {/* ★ボタンの <button> タグ自体は既存のものを流用 */}
      <button className="new-chat-button" onClick={handleNewChat}>
        {/* ★プロトタイプ準拠: アイコンを差し替え */}
        <NewChatIcon />
        新しいチャット
      </button>

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

      {/* --- 🔽 デバッグツール (JSX) を削除 🔽 --- */}
      {/* <div className="sidebar-debug-tools">
        <h4 className="debug-title">[PoC デバッグ]</h4>
        <button className="debug-copy-button" onClick={handleCopyLogs}>
          {copyButtonText}
        </button>
      </div> 
      */}
      {/* --- 🔼 デバッグツール 🔼 --- */}
    </div>
  );
};

// === 🔽 プロトタイプからアイコン定義を移植 🔽 ===

const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
    </svg>
);

const NewChatIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 17V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.5 14.5L12 12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// === 🔼 プロトタイプからアイコン定義を移植 🔼 ===

export default Sidebar;