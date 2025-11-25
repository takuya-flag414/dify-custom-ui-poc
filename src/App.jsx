// src/App.jsx
import { useState } from 'react';
import './App.css';
import './index.css';

import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

import { useLogger } from './hooks/useLogger';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';

function App() {
  const [mockMode, setMockMode] = useState('FE');

  const { addLog, handleCopyLogs, copyButtonText } = useLogger();

  const {
    conversations,
    conversationId,
    setConversationId,
    handleConversationCreated,
    handleDeleteConversation
  } = useConversations(mockMode, addLog);

  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    activeContextFile,
    setActiveContextFile,
    handleSendMessage,
    domainFilters,
    setDomainFilters,
    forceSearch,    // ★ New
    setForceSearch  // ★ New
  } = useChat(mockMode, conversationId, addLog, handleConversationCreated);

  return (
    <div className="app">
      <Sidebar
        conversationId={conversationId}
        setConversationId={setConversationId}
        conversations={conversations}
        onDeleteConversation={handleDeleteConversation}
      />
      <ChatArea
        messages={messages}
        setMessages={setMessages}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        mockMode={mockMode}
        setMockMode={setMockMode}
        conversationId={conversationId}
        addLog={addLog}
        onConversationCreated={handleConversationCreated}
        handleCopyLogs={handleCopyLogs}
        copyButtonText={copyButtonText}
        activeContextFile={activeContextFile}
        setActiveContextFile={setActiveContextFile}
        onSendMessage={handleSendMessage}
        domainFilters={domainFilters}
        setDomainFilters={setDomainFilters}
        forceSearch={forceSearch}       // ★ Pass Down
        setForceSearch={setForceSearch} // ★ Pass Down
      />
    </div>
  );
}

export default App;