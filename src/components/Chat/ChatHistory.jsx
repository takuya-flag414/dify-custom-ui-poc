/* src/components/Chat/ChatHistory.jsx */
import React, { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import './ChatHistory.css';
import MessageBlock from '../Message/MessageBlock';
// ★追加
import SystemErrorBlock from '../Message/SystemErrorBlock';
// ★追加: メッセージ再送信時のテキスト抽出ユーティリティ
import { extractPlainText } from '../../utils/messageSerializer';

// パフォーマンス制限: 50件を超えると最新メッセージのみアニメーション
const ANIMATION_LIMIT = 50;

// ユーザー操作検知後のフラグ持続時間 (ms)
const USER_SCROLL_FLAG_DURATION = 150;

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
  onRegenerate,
  autoScroll = false, // ★追加
  onAutoScrollChange, // ★追加
  ...rest
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // ★追加: ユーザー操作によるスクロールかどうかを判定するフラグ
  const userInitiatedScrollRef = useRef(false);
  const userScrollTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ★追加: ユーザー操作を検知するハンドラ
  const handleUserScrollAction = useCallback(() => {
    userInitiatedScrollRef.current = true;

    // 前回のタイムアウトをクリア
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }

    // 一定時間後にフラグをリセット
    userScrollTimeoutRef.current = setTimeout(() => {
      userInitiatedScrollRef.current = false;
    }, USER_SCROLL_FLAG_DURATION);
  }, []);

  // ★追加: ユーザー操作イベントリスナーを登録
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // wheel, touchmove, keydown でユーザー操作を検知
    container.addEventListener('wheel', handleUserScrollAction, { passive: true });
    container.addEventListener('touchmove', handleUserScrollAction, { passive: true });
    container.addEventListener('keydown', handleUserScrollAction);

    return () => {
      container.removeEventListener('wheel', handleUserScrollAction);
      container.removeEventListener('touchmove', handleUserScrollAction);
      container.removeEventListener('keydown', handleUserScrollAction);

      // クリーンアップ時にタイムアウトもクリア
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, [handleUserScrollAction]);

  // ★変更: streamingMessageも依存配列に追加
  // ★変更: autoScrollがtrueの時のみスクロール
  // ★変更: onAutoScrollChange追加 (状態リフトアップ)
  // 自動スクロール処理
  useEffect(() => {
    // autoScrollが有効で、かつ新しいコンテンツがある場合（loading or messages change）
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, streamingMessage, isLoading, autoScroll]);

  // ★改良: スクロールイベントハンドラ - ユーザー操作時のみ自動スクロールを解除
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // 誤差許容範囲 (px)
    const errorMargin = 20;

    // 現在位置が底に近いかどうか
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= errorMargin;

    if (isAtBottom) {
      // 底に到達したら自動スクロール再開（ユーザー操作かどうかに関わらず）
      if (!autoScroll && onAutoScrollChange) {
        onAutoScrollChange(true);
      }
    } else {
      // ★改良: ユーザー操作によるスクロールの場合のみ自動スクロールを解除
      // プログラムによるスクロール（scrollIntoView）では解除しない
      if (userInitiatedScrollRef.current && autoScroll && onAutoScrollChange) {
        onAutoScrollChange(false);
      }
    }
  };


  // ★追加: リトライ機能
  // エラーの一つ前の「ユーザーメッセージ」を探して再送する
  const handleRetry = (errorMsgIndex) => {
    // 逆順に探索
    for (let i = errorMsgIndex - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'user') {
        // ★修正: extractPlainText で構造化JSONからプレーンテキストを抽出し、二重ラップを防止
        const plainText = extractPlainText(msg.text);
        onSendMessage(plainText, []);
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
    <div
      ref={containerRef}
      className="chat-history"
      onScroll={handleScroll}
      tabIndex={0} // キーボードイベント検知のためtabIndexを追加
    >

      <AnimatePresence mode="popLayout">
        {/* ★変更: 確定メッセージのみをmessages配列からレンダリング */}
        {(() => {
          let lastUserMessage = null;
          return messages.map((msg, index) => {
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

            // ★追加: 前回のユーザーメッセージを取得（ContextChipsの差分表示用）
            const previousUserMsg = lastUserMessage;
            if (msg.role === 'user') {
              lastUserMessage = msg;
            }

            return (
              <MessageBlock
                key={msg.id}
                message={msg}
                previousMessage={previousUserMsg} // Pass previous user message
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
          });
        })()}

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
