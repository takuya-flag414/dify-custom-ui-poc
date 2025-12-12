// src/components/Chat/ChatArea.jsx
import React from 'react';
import '../../App.css';
import './ChatArea.css';

import MockModeSelect from './MockModeSelect';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput'; // パス修正の可能性あり（構成によります）
import HistorySkeleton from './HistorySkeleton';

const ChatArea = (props) => {
  const {
    messages,
    isGenerating,
    isHistoryLoading,
    mockMode,
    setMockMode,
    conversationId,
    handleCopyLogs,
    copyButtonText,
    activeContextFiles, // ★変更: 複数形
    setActiveContextFiles, // ★変更: 複数形
    onSendMessage,
    searchSettings,
    setSearchSettings
  } = props;

  // 初期状態: メッセージ0件 かつ 履歴ロード中でない
  const isInitialState = messages.length === 0 && !isHistoryLoading;

  return (
    <div className="chat-area">
      <div className="top-bar-container">
        <div className="mock-mode-controls">
          <MockModeSelect mockMode={mockMode} setMockMode={setMockMode} />
        </div>
        <div className="debug-controls">
          <button className="debug-copy-button-topbar" onClick={() => handleCopyLogs(messages)}>
            {copyButtonText}
          </button>
        </div>
      </div>

      {isHistoryLoading ? (
        /* 履歴読み込み中: スケルトン表示 */
        <>
          <HistorySkeleton />
          <div className="bottom-controls-wrapper">
            <ChatInput
              isLoading={true} 
              isHistoryLoading={true}
              onSendMessage={() => {}}
              isCentered={false}
              activeContextFiles={activeContextFiles} // ★変更
              setActiveContextFiles={setActiveContextFiles} // ★変更
              searchSettings={searchSettings}
              setSearchSettings={setSearchSettings}
            />
          </div>
        </>
      ) : isInitialState ? (
        /* 初期画面 */
        <div className="initial-view-container">
          <div className="initial-content">
            <div className="initial-header">
              <h2 className="initial-title">お困りのことはありますか？</h2>
              <p className="initial-subtitle">社内情報やWebから情報を検索して回答します。</p>
            </div>
            <div className="initial-input-wrapper">
              <ChatInput
                isLoading={isGenerating}
                onSendMessage={onSendMessage}
                isCentered={true}
                activeContextFiles={activeContextFiles} // ★変更
                setActiveContextFiles={setActiveContextFiles} // ★変更
                searchSettings={searchSettings}
                setSearchSettings={setSearchSettings}
              />
            </div>
          </div>
        </div>
      ) : (
        /* 通常会話画面 */
        <>
          <ChatHistory
            messages={messages}
            onSuggestionClick={(q) => onSendMessage(q, [])} // ★変更: ファイル引数は空配列に
            isLoading={isGenerating}
            onSendMessage={onSendMessage}
          />
          <div className="bottom-controls-wrapper">
            <ChatInput
              isLoading={isGenerating}
              onSendMessage={onSendMessage}
              isCentered={false}
              activeContextFiles={activeContextFiles} // ★変更
              setActiveContextFiles={setActiveContextFiles} // ★変更
              searchSettings={searchSettings}
              setSearchSettings={setSearchSettings}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatArea;