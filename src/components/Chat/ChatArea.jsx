// src/components/Chat/ChatArea.jsx
import React, { useCallback } from 'react';
import '../../App.css';
import './ChatArea.css';

import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import HistorySkeleton from './HistorySkeleton';
import WelcomeScreen from './WelcomeScreen';
import ScrollToBottomButton from './ScrollToBottomButton';


const ChatArea = (props) => {
  const {
    messages,
    streamingMessage,
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
    onStartTutorial,
    stopGeneration,
    handleEdit,
    handleRegenerate,
    autoScroll = true // デフォルトtrue
  } = props;

  // ★追加: 自動スクロール有効状態管理
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);

  // 初期化時にpropsの値をセット
  React.useEffect(() => {
    setAutoScrollEnabled(autoScroll);
  }, [autoScroll]);

  // 初期状態: メッセージ0件 かつ 履歴ロード中でない
  const isInitialState = messages.length === 0 && !isHistoryLoading;

  const handleSuggestionClick = useCallback((q) => {
    onSendMessage(q, []);
  }, [onSendMessage]);

  const handleSmartActionSelect = useCallback((action) => {
    switch (action.type) {
      case 'suggested_question':
        if (action.payload?.text) {
          onSendMessage(action.payload.text, []);
        }
        break;

      case 'retry_mode':
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg && action.payload?.mode) {
          const modeSettings = {
            'rag_only': { ragEnabled: true, webMode: 'off' },
            'web_only': { ragEnabled: false, webMode: 'force' },
            'hybrid': { ragEnabled: true, webMode: 'auto' },
            'standard': { ragEnabled: false, webMode: 'auto' },
            'fast': { ragEnabled: false, webMode: 'off' }
          };
          const newSettings = modeSettings[action.payload.mode];
          if (newSettings) {
            setSearchSettings(prev => ({
              ...prev,
              ...newSettings
            }));
          }
          setTimeout(() => {
            onSendMessage(lastUserMsg.text, []);
          }, 100);
        }
        break;

      case 'web_search':
        const lastUserMsgForWeb = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsgForWeb) {
          setSearchSettings(prev => ({
            ...prev,
            webMode: 'force'
          }));
          setTimeout(() => {
            onSendMessage(lastUserMsgForWeb.text, []);
          }, 100);
        }
        break;

      case 'deep_dive':
        const lastUserMsgForDeep = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsgForDeep) {
          onSendMessage(`${lastUserMsgForDeep.text}について、より詳しく解説してください。`, []);
        }
        break;

      case 'navigate':
        if (action.payload?.url) {
          window.open(action.payload.url, '_blank', 'noopener,noreferrer');
        }
        break;

      default:
        console.warn('Unknown smart action type:', action.type);
    }
  }, [messages, onSendMessage, setSearchSettings]);

  // ★追加: ボタンクリック時のハンドラ
  const handleScrollToBottom = () => {
    setAutoScrollEnabled(true);
  };

  return (
    <div className={`chat-area${isInitialState ? ' chat-area-initial' : ''}`}>
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
            setSearchSettings={setSearchSettings}
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
            streamingMessage={streamingMessage}
            onSuggestionClick={handleSuggestionClick}
            onSmartActionSelect={handleSmartActionSelect}
            isLoading={isGenerating}
            onSendMessage={onSendMessage}
            onOpenConfig={onOpenConfig}
            onOpenArtifact={onOpenArtifact}
            userName={userName}
            onEdit={handleEdit}
            onRegenerate={handleRegenerate}
            autoScroll={autoScrollEnabled} // ★変更: stateを渡す
            onAutoScrollChange={setAutoScrollEnabled} // ★追加: state更新関数を渡す
          />
          <div className="bottom-controls-wrapper">
            {/* ★追加: ScrollToBottomButton */}
            <ScrollToBottomButton
              visible={!autoScrollEnabled}
              onClick={handleScrollToBottom}
            />
            <ChatInput
              isLoading={isGenerating}
              onSendMessage={onSendMessage}
              isCentered={false}
              activeContextFiles={activeContextFiles}
              setActiveContextFiles={setActiveContextFiles}
              searchSettings={searchSettings}
              setSearchSettings={setSearchSettings}
              isStreaming={isGenerating && !!streamingMessage}
              onStop={stopGeneration}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatArea;