// src/components/Chat/ChatArea.jsx
import React, { useCallback } from 'react'; // ★追加: useCallback
import '../../App.css';
import './ChatArea.css';

import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import HistorySkeleton from './HistorySkeleton';
import WelcomeScreen from './WelcomeScreen';

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
    userName,
    onStartTutorial
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
        <>
          <WelcomeScreen
            userName={userName}
            onSendMessage={onSendMessage}
            onStartTutorial={onStartTutorial}
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
              onOpenConfig={onOpenConfig}
            />
          </div>
        </>
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