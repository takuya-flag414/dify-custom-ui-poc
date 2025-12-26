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
    // ★追加: ストリーミング中メッセージを別途受け取る（パフォーマンス最適化）
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
    onStartTutorial
  } = props;

  // 初期状態: メッセージ0件 かつ 履歴ロード中でない
  const isInitialState = messages.length === 0 && !isHistoryLoading;

  // ★追加: 関数をメモ化して、ChatHistoryの再レンダリングを抑制する
  const handleSuggestionClick = useCallback((q) => {
    onSendMessage(q, []);
  }, [onSendMessage]);

  // ★追加: Smart Actions ハンドラー
  const handleSmartActionSelect = useCallback((action) => {
    switch (action.type) {
      case 'suggested_question':
        // そのままテキストを送信
        if (action.payload?.text) {
          onSendMessage(action.payload.text, []);
        }
        break;

      case 'retry_mode':
        // モードを変更して直前のクエリで再送信
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg && action.payload?.mode) {
          // モード名に応じた設定マッピング
          const modeSettings = {
            'rag_only': { ragEnabled: true, webMode: 'off' },      // 社内データのみ
            'web_only': { ragEnabled: false, webMode: 'force' },   // Web検索のみ
            'hybrid': { ragEnabled: true, webMode: 'auto' },       // フルパワー
            'standard': { ragEnabled: false, webMode: 'auto' },    // オート
            'fast': { ragEnabled: false, webMode: 'off' }          // スピード
          };
          const newSettings = modeSettings[action.payload.mode];
          if (newSettings) {
            setSearchSettings(prev => ({
              ...prev,
              ...newSettings
            }));
          }
          // 少し待ってから再送信（設定反映のため）
          setTimeout(() => {
            onSendMessage(lastUserMsg.text, []);
          }, 100);
        }
        break;

      case 'web_search':
        // Webモードを有効化して再検索
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
        // より詳しく解説を求める
        const lastUserMsgForDeep = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsgForDeep) {
          onSendMessage(`${lastUserMsgForDeep.text}について、より詳しく解説してください。`, []);
        }
        break;

      case 'navigate':
        // 外部URLを別タブで開く
        if (action.payload?.url) {
          window.open(action.payload.url, '_blank', 'noopener,noreferrer');
        }
        break;

      default:
        console.warn('Unknown smart action type:', action.type);
    }
  }, [messages, onSendMessage, setSearchSettings]);

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
            streamingMessage={streamingMessage}
            onSuggestionClick={handleSuggestionClick}
            onSmartActionSelect={handleSmartActionSelect}
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