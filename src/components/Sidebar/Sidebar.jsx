// src/components/Sidebar/Sidebar.jsx
import React, { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';
import './Sidebar.css';

/**
 * サイドバー
 * @param {string} conversationId - 現在選択中の会話ID
 * @param {function} setConversationId - 会話選択用セッター
 * @param {Array} conversations - 会話リスト
 * @param {function} onDeleteConversation - [追加] 削除用関数 (App.jsxから渡される)
 */
const Sidebar = ({
  conversationId,
  setConversationId,
  conversations,
  onDeleteConversation, // New prop
}) => {
  // モーダル制御用のState
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  const handleNewChat = () => {
    setConversationId(null);
  };

  const handleSelectConversation = (id) => {
    setConversationId(id);
  };

  // 削除アイコンクリック時（モーダルを開く）
  const handleClickDelete = (e, conv) => {
    e.stopPropagation(); // 親要素のonClick（チャット選択）が発火するのを防ぐ
    setDeleteTarget(conv);
    setIsDeleteModalOpen(true);
  };

  // 削除実行
  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteConversation(deleteTarget.id);
    }
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // キャンセル
  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="sidebar">
      {/* --- ヘッダーと新規チャット --- */}
      <div className="sidebar-header">
        <div style={{ color: '#2563EB', width: '32px', height: '32px' }}>
          <LogoIcon />
        </div>
        <h1 className="sidebar-title">社内AI (PoC)</h1>
      </div>

      <button className="new-chat-button" onClick={handleNewChat}>
        <NewChatIcon />
        新しいチャット
      </button>

      {/* --- 会話履歴リスト --- */}
      <div className="conversation-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item group ${ // 'group'クラスを追加し、子要素のホバー制御を可能に
              conv.id === conversationId ? 'active' : ''
              }`}
            onClick={() => handleSelectConversation(conv.id)}
          >
            {/* テキスト部分（長文省略対応） */}
            <span className="conversation-name">{conv.name}</span>

            {/* 削除ボタン（ホバー時のみ表示） */}
            <button
              className="delete-icon-button"
              onClick={(e) => handleClickDelete(e, conv)}
              title="このチャットを削除"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      {/* --- 削除確認モーダル --- */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        conversationName={deleteTarget?.name || ''}
      />
    </div>
  );
};

// === Icons ===

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);

const NewChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 14.5L12 12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4C8 3.46957 8.21071 3 8.58579 2.62513C8.96086 2.25026 9.46957 2.04061 10 2.04061H14C14.5304 2.04061 15.0391 2.25026 15.4142 2.62513C15.7893 3 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default Sidebar;