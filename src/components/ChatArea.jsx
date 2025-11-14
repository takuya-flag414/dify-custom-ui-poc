// src/components/ChatArea.jsx
import React from 'react';
import '../App.css'; // .chat-area のスタイルをインポート
import './styles/ChatArea.css';

import MockModeSelect from './MockModeSelect';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

/**
 * メインのチャットエリア (5.1) 
 * @param {Array} messages
 * @param {function} setMessages
 * @param {boolean} isLoading
 * @param {function} setIsLoading
 * @param {string} mockMode
 * @param {function} setMockMode
 * @param {string} conversationId
 */
const ChatArea = (props) => {
  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    mockMode,
    setMockMode,
    conversationId,
  } = props;

  /**
   * メッセージ送信時の処理 (T-05, T-06 の起点)
   * PoC基本設計書 (5.4の3.) [cite: 387, 388] に基づき、
   * ここでローディングを開始し、メッセージを追加する。
   */
  const handleSendMessage = (text) => {
    console.log('Send:', text, 'Mode:', mockMode, 'ConvID:', conversationId);

    // TODO: T-05 (API呼び出し) / F-UI-006 (FEモック) のロジックを実装
    
    // (T-03時点のダミー動作)
    // 1. ユーザーの質問を履歴に追加
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      text: text,
      role: 'user',
    };
    
    // 2. AIの応答（ダミー）を準備
    const aiMessage = {
      id: `msg_${Date.now()}_ai`,
      text: `「${text}」に対するFEモックの応答です。\nストリーミングは未実装です。`,
      role: 'ai',
      citations: [], // T-09用
      suggestions: [], // T-11用
    };

    // 3. 履歴を更新し、ローディング状態をシミュレート
    setMessages([...messages, userMessage]);
    setIsLoading(true);

    // (ダミーのAI応答時間)
    setTimeout(() => {
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false); // 応答完了
    }, 1500);
  };

  return (
    <div className="chat-area">
      {/* デバッグ用UI (F-UI-006, F-UI-007) [cite: 335] */}
      <MockModeSelect mockMode={mockMode} setMockMode={setMockMode} />

      {/* チャット履歴 (T-06)  */}
      <ChatHistory messages={messages} />

      {/* 入力フォーム (T-03)  */}
      <ChatInput isLoading={isLoading} onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatArea;