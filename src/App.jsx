// src/App.jsx
import { useState } from 'react';
import './App.css';
import './index.css';

import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';

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
    // ★ 更新: 新しい検索設定Stateを受け取る
    searchSettings,
    setSearchSettings
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
        // ★ 更新: ChatAreaに新しい設定オブジェクトを渡す
        searchSettings={searchSettings}
        setSearchSettings={setSearchSettings}
      />
    </div>
  );
}

export default App;