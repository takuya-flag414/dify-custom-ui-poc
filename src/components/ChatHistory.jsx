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
      {/* ★★★ プロトタイプ準拠: 中央配置のロジック ★★★ */}
      {messages.length === 0 && !isLoading ? (
        // 初期表示状態 (新基本設計書 5.2.1)
        <div className="chat-history-empty">
          
          {/* ★プロトタイプ風ヘッダー */}
          <div className="initial-message-header">
            <div style={{ width: '40px', height: '40px' }}> {/* アイコンサイズ調整 */}
              <AssistantIcon />
            </div>
            <h2 className="initial-message-title">
              お困りのことはありますか？
            </h2>
          </div>
          
          {/* ★中央配置の入力フォーム */}
          <ChatInput
            isLoading={isLoading}
            onSendMessage={onSendMessage}
            isCentered={true} // ★中央配置フラグ
          />

        </div>
      ) : (
        // 履歴表示状態 (新基本設計書 5.2.2)
        // ★★★ 修正: 時刻表示のためにJSX構造を変更 ★★★
        messages.map((msg) => (
          // ★ ステップ2-1: ラッパーを追加
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
                onSuggestionClick={onSuggestionClick} // ★ T-11対応: propsを渡す
              />
            </div>
            
            {/* ★ ステップ2-2: ユーザーかつ時刻が存在する場合のみ表示 */}
            {msg.role === 'user' && msg.timestamp && (
              <span className="user-timestamp">
                {formatTimestamp(msg.timestamp)}
              </span>
            )}
          </div>
        ))
      )}
      {/* スクロール用の空要素 */}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatHistory;