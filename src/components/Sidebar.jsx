// src/components/Sidebar.jsx
import React, { useState } from 'react';
import './styles/Sidebar.css'; // Sidebar用のCSS

/**
 * サイドバー (T-04 履歴リストの雛形)
 * @param {string} conversationId - App.jsx の現在の会話ID
 * @param {function} setConversationId - App.jsx の会話ID更新関数
 */
const Sidebar = ({ conversationId, setConversationId }) => {
  // T-04時点のダミーデータ
  // TODO: T-04で Dify API (GET /conversations) から取得する
  const [conversations, setConversations] = useState([
    { id: 'conv_1', name: 'Dify API連携について' },
    { id: 'conv_2', name: 'PoCロードマップの進捗' },
    { id: 'conv_3', name: 'UIデザインの検討' },
  ]);

  const handleNewChat = () => {
    // 新規チャット (新基本設計書 5.2.1)
    console.log('New Chat');
    setConversationId(null);
    // TODO: T-04で messages state をクリアする処理を App.jsx に実装
  };

  const handleSelectConversation = (id) => {
    // 履歴表示 (新基本設計書 5.2.2)
    console.log('Select Conv:', id);
    setConversationId(id);
    // TODO: T-04で App.jsx が API (GET /messages) を叩くトリガー
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">社内AIチャット PoC</h1>
        <button className="new-chat-button" onClick={handleNewChat}>
          {/* SVGアイコン（プラス） */}
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

      {/* 会話履歴リスト (T-04) */}
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

      {/* (オプション) フッター（ユーザー名など）は T-03 のスコープ外 */}
    </div>
  );
};

export default Sidebar;