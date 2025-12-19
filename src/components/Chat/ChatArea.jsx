// src/components/Chat/ChatArea.jsx
import React, { useCallback } from 'react'; // ★追加: useCallback
import '../../App.css';
import './ChatArea.css';

import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import HistorySkeleton from './HistorySkeleton';

const ChatArea = (props) => {
  const {
    messages,
    isGenerating,
    isHistoryLoading,
    activeContextFiles,
    setActiveContextFiles,
    onSendMessage,
    searchSettings,
    setSearchSettings,
    onOpenConfig,
    onOpenArtifact,
    userName
  } = props;

  // 初期状態: メッセージ0件 かつ 履歴ロード中でない
  const isInitialState = messages.length === 0 && !isHistoryLoading;

  // ★追加: 関数をメモ化して、ChatHistoryの再レンダリングを抑制する
  const handleSuggestionClick = useCallback((q) => {
    onSendMessage(q, []);
  }, [onSendMessage]);

  return (
    <div className="chat-area">
      {isHistoryLoading ? (
        <>
          <HistorySkeleton userName={userName} />
          <div className="bottom-controls-wrapper">
            <ChatInput
              isLoading={true}
              isHistoryLoading={true}
              onSendMessage={() => { }}
              isCentered={false}
              activeContextFiles={activeContextFiles}
              setActiveContextFiles={setActiveContextFiles}
              searchSettings={searchSettings}
              setSearchSettings={setSearchSettings}
            />
          </div>
        </>
      ) : isInitialState ? (
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
                activeContextFiles={activeContextFiles}
                setActiveContextFiles={setActiveContextFiles}
                searchSettings={searchSettings}
                setSearchSettings={setSearchSettings}
                onOpenConfig={onOpenConfig}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <ChatHistory
            messages={messages}
            onSuggestionClick={handleSuggestionClick} // ★変更: メモ化した関数を渡す
            isLoading={isGenerating}
            onSendMessage={onSendMessage}
            onOpenConfig={onOpenConfig}
            onOpenArtifact={onOpenArtifact}
            userName={userName}
          />
          <div className="bottom-controls-wrapper">
            <ChatInput
              isLoading={isGenerating}
              onSendMessage={onSendMessage}
              isCentered={false}
              activeContextFiles={activeContextFiles}
              setActiveContextFiles={setActiveContextFiles}
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