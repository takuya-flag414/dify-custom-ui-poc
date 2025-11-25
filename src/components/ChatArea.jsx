// src/components/ChatArea.jsx
import React from 'react';
import '../App.css';
import './styles/ChatArea.css';

import MockModeSelect from './MockModeSelect';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import FileContextIndicator from './FileContextIndicator';

const ChatArea = (props) => {
  const {
    messages,
    isLoading,
    mockMode,
    setMockMode,
    conversationId,
    handleCopyLogs,
    copyButtonText,
    activeContextFile,
    setActiveContextFile,
    onSendMessage, // ★追加: App.jsx (useChat) から渡される送信ハンドラ
  } = props;

  // ★追加: 初期状態かどうかの判定
  const isInitialState = messages.length === 0;

  return (
    <div className="chat-area">
      <div className="top-bar-container">
        <div className="mock-mode-controls">
          <MockModeSelect mockMode={mockMode} setMockMode={setMockMode} />
        </div>
        <div className="debug-controls">
          <button className="debug-copy-button-topbar" onClick={handleCopyLogs}>
            {copyButtonText}
          </button>
        </div>
      </div>

      {/* ★修正: 初期表示と会話中でレイアウトを分岐 */}
      {isInitialState ? (
        /* 初期表示: 中央揃えレイアウト */
        <div className="initial-view-container">
          <div className="initial-content">
            <div className="initial-header">
              <h2 className="initial-title">お困りのことはありますか？</h2>
              <p className="initial-subtitle">社内情報やWebから情報を検索して回答します。</p>
            </div>

            {/* 初期表示用の入力欄配置 */}
            <div className="initial-input-wrapper">
              <FileContextIndicator
                file={activeContextFile}
                onClear={() => setActiveContextFile(null)}
              />
              <ChatInput
                isLoading={isLoading}
                onSendMessage={onSendMessage}
                isCentered={true}
              />
            </div>
          </div>
        </div>
      ) : (
        /* 会話中: 履歴リスト + 下部固定入力欄 */
        <>
          <ChatHistory
            messages={messages}
            onSuggestionClick={(q) => onSendMessage(q, null)}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
          />

          <div className="bottom-controls-wrapper">
            <FileContextIndicator
              file={activeContextFile}
              onClear={() => setActiveContextFile(null)}
            />
            <ChatInput
              isLoading={isLoading}
              onSendMessage={onSendMessage}
              isCentered={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatArea;