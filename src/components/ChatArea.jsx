// src/components/ChatArea.jsx
import React from 'react';
import '../App.css';
import './styles/ChatArea.css';

import MockModeSelect from './MockModeSelect';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

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
    onSendMessage,
    domainFilters,
    setDomainFilters,
    forceSearch,    // ★ Accept
    setForceSearch  // ★ Accept
  } = props;

  const isInitialState = messages.length === 0;

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

      {isInitialState ? (
        <div className="initial-view-container">
          <div className="initial-content">
            <div className="initial-header">
              <h2 className="initial-title">お困りのことはありますか？</h2>
              <p className="initial-subtitle">社内情報やWebから情報を検索して回答します。</p>
            </div>

            <div className="initial-input-wrapper">
              <ChatInput
                isLoading={isLoading}
                onSendMessage={onSendMessage}
                isCentered={true}
                activeContextFile={activeContextFile}
                setActiveContextFile={setActiveContextFile}
                domainFilters={domainFilters}
                setDomainFilters={setDomainFilters}
                forceSearch={forceSearch}         // ★ Pass Down
                setForceSearch={setForceSearch}   // ★ Pass Down
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <ChatHistory
            messages={messages}
            onSuggestionClick={(q) => onSendMessage(q, null)}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
          />

          <div className="bottom-controls-wrapper">
            <ChatInput
              isLoading={isLoading}
              onSendMessage={onSendMessage}
              isCentered={false}
              activeContextFile={activeContextFile}
              setActiveContextFile={setActiveContextFile}
              domainFilters={domainFilters}
              setDomainFilters={setDomainFilters}
              forceSearch={forceSearch}         // ★ Pass Down
              setForceSearch={setForceSearch}   // ★ Pass Down
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatArea;