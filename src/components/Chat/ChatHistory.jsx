/* src/components/Chat/ChatHistory.jsx */
import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import './ChatHistory.css';
import MessageBlock from '../Message/MessageBlock';
// ★追加
import SystemErrorBlock from '../Message/SystemErrorBlock';

// パフォーマンス制限: 50件を超えると最新メッセージのみアニメーション
const ANIMATION_LIMIT = 50;

// ★変更: streamingMessage propsを追加（パフォーマンス最適化）
// ★追加: onEdit, onRegenerate props (Phase 1.5)
const ChatHistory = ({
  messages,
  streamingMessage,
  onSuggestionClick,
  onSmartActionSelect,
  isLoading,
  onSendMessage,
  onOpenConfig,
  onOpenArtifact,
  userName,
  onEdit,
  onRegenerate
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ★変更: streamingMessageも依存配列に追加
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, isLoading]);

  // ★追加: リトライ機能
  // エラーの一つ前の「ユーザーメッセージ」を探して再送する
  const handleRetry = (errorMsgIndex) => {
    // 逆順に探索
    for (let i = errorMsgIndex - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'user') {
        // 見つかったテキストで再送 (ファイルは簡易的に空とする)
        onSendMessage(msg.text, []);
        return;
      }
    }
  };

  // ★変更: messagesが空でもstreamingMessageがあれば表示
  if ((!messages || messages.length === 0) && !streamingMessage) {
    return null;
  }

  // パフォーマンス制限判定
  const enableFullAnimation = messages.length <= ANIMATION_LIMIT;
  const isNewMessage = (index) => index === messages.length - 1;

  return (
    <div className="chat-history">
      <AnimatePresence mode="popLayout">
        {/* ★変更: 確定メッセージのみをmessages配列からレンダリング */}
        {messages.map((msg, index) => {
          // ★追加: システムエラーの場合の表示
          if (msg.role === 'system' && msg.type === 'error') {
            return (
              <SystemErrorBlock
                key={msg.id}
                message={msg}
                onOpenConfig={onOpenConfig}
                onRetry={() => handleRetry(index)}
              />
            );
          }

          // 50件以下 OR 最新メッセージのみアニメーション有効
          const enableAnimation = enableFullAnimation || isNewMessage(index);

          // ★追加: 最後のAIメッセージかどうかを判定（再送信ボタン表示用）
          const isLastAi = (
            msg.role === 'ai' &&
            !streamingMessage &&
            index === messages.length - 1
          );

          return (
            <MessageBlock
              key={msg.id}
              message={msg}
              onSuggestionClick={onSuggestionClick}
              onSmartActionSelect={onSmartActionSelect}
              onOpenArtifact={onOpenArtifact}
              enableAnimation={enableAnimation}
              userName={userName}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              isLastAiMessage={isLastAi}
            />
          );
        })}

        {/* ★追加: ストリーミング中のメッセージを別途表示（パフォーマンス最適化）*/}
        {streamingMessage && (
          <MessageBlock
            key={streamingMessage.id}
            message={streamingMessage}
            onSuggestionClick={onSuggestionClick}
            onSmartActionSelect={onSmartActionSelect}
            onOpenArtifact={onOpenArtifact}
            enableAnimation={true}
            userName={userName}
          />
        )}
      </AnimatePresence>

      {/* Loading Indicator - ★変更: streamingMessageがある場合は非表示 */}
      {isLoading && !streamingMessage && messages[messages.length - 1]?.role === 'user' && (
        <div className="message-block message-animate-enter">
          <div className="message-container">
            <div className="avatar-ai">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
              </svg>
            </div>
            <div className="message-content message-content-ai">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
