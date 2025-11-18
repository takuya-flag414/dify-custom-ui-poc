// src/components/ChatHistory.jsx
import React, { useEffect, useRef } from 'react';
import './styles/ChatArea.css'; // 既存のインポート
import MessageBlock from './MessageBlock';
import ChatInput from './ChatInput'; // ★中央配置のためにインポート
import { AssistantIcon } from './MessageBlock'; // ★アイコンをインポート

/**
 * ★ ISO文字列 (timestamp) を "HH:MM" 形式に変換するヘルパー
 * @param {string} isoString
 */
const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    // toLocaleTimeString を使い、 'ja-JP' 形式の時・分（2桁）で表示
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.warn('[ChatHistory] Invalid timestamp format:', isoString);
    return ''; // 不正な日付の場合
  }
};


/**
 * チャット履歴表示エリア (T-06)
 * @param {Array} messages - App.jsxから渡される
 * @param {function} onSuggestionClick - ChatAreaから渡される
 * @param {boolean} isLoading - ★中央配置のために ChatArea から渡される
 * @param {function} onSendMessage - ★中央配置のために ChatArea から渡される
 */
const ChatHistory = ({
  messages,
  onSuggestionClick,
  isLoading,
  onSendMessage,
}) => {
  const endOfMessagesRef = useRef(null);

  // メッセージが更新されるたびに一番下にスクロールする (T-06)
  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // messages が変わるたびに実行

  return (
    <div className="chat-history">
      {/* ... 初期表示状態のロジックは変更なし ... */}
      {messages.length === 0 && !isLoading ? (
        // 初期表示状態
        <div className="chat-history-empty">
          {/* ... */}
        </div>
      ) : (
        // 履歴表示状態
        messages.map((msg) => (
          // ★ 修正: chat-row-wrapper-user / -ai クラスは残す
          // ★      align-items が CSS で制御される
          <div
            key={msg.id}
            className={`chat-row-wrapper ${
              msg.role === 'user' ? 'chat-row-wrapper-user' : 'chat-row-wrapper-ai'
            }`}
          >
            {/* 既存の行 */}
            <div
              className={`chat-row ${
                msg.role === 'user' ? 'chat-row-user' : 'chat-row-ai'
              }`}
            >
              <MessageBlock
                message={msg}
                onSuggestionClick={onSuggestionClick}
              />
            </div>
            
            {/* ユーザーかつ時刻が存在する場合のみ表示 */}
            {msg.role === 'user' && msg.timestamp && (
              <span className="user-timestamp">
                {formatTimestamp(msg.timestamp)}
              </span>
            )}
          </div>
        ))
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatHistory;