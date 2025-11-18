// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import './styles/ChatArea.css';

/**
 * 質問入力フォーム (T-03)
 * @param {boolean} isLoading - App.jsxから渡される
 * @param {function} onSendMessage - ChatArea.jsxから渡される
 * @param {boolean} isCentered - ★中央配置かどうかのフラグ
 */
const ChatInput = ({ isLoading, onSendMessage, isCentered = false }) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);

  // テキストエリアの高さを内容に応じて自動調整
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 一旦リセット
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  };

  // 入力値が変わるたびに高さを調整
  useEffect(() => {
    autoResizeTextarea();
  }, [inputText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (text && !isLoading) {
      onSendMessage(text);
      setInputText(''); // 送信後にクリア
    }
  };

  const handleKeyDown = (e) => {
    // Shift + Enter で改行、Enterのみで送信
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // デフォルトの改行をキャンセル
      handleSubmit(e);
    }
  };

  // ★コンテナのクラスを、中央配置 (isCentered) か下部固定かで切り替える
  const containerClassName = isCentered
    ? 'chat-input-container-centered'
    : 'chat-input-container';

  return (
    <div className={containerClassName}>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="質問を入力してください (Shift+Enterで改行)"
          rows={1} // 初期行数
          disabled={isLoading} // ストリーミング中は非活性
        />
        <button
          type="submit"
          className="chat-input-button"
          disabled={isLoading || !inputText.trim()} // ★未入力でも非活性に
        >
          {/* ★プロトタイプ準拠: アイコンを差し替え */}
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

// === 🔽 プロトタイプからアイコン定義を移植 🔽 ===

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// === 🔼 プロトタイプからアイコン定義を移植 🔼 ===

export default ChatInput;