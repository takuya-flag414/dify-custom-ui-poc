// src/App.jsx
import { useState } from 'react';
import './App.css';
import './index.css';

// コンポーネント
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// フック
import { useLogger } from './hooks/useLogger';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';

function App() {
  const [mockMode, setMockMode] = useState('FE');

  const { addLog, handleCopyLogs, copyButtonText } = useLogger();

  // 1. handleDeleteConversation を分割代入で取得
  const {
    conversations,
    conversationId,
    setConversationId,
    handleConversationCreated,
    handleDeleteConversation // [追加]
  } = useConversations(mockMode, addLog);

  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    activeContextFile,
    setActiveContextFile,
    handleSendMessage,
  } = useChat(mockMode, conversationId, addLog, handleConversationCreated);

  return (
    <div className="app">
      <Sidebar
        conversationId={conversationId}
        setConversationId={setConversationId}
        conversations={conversations}
        onDeleteConversation={handleDeleteConversation} // [追加] Sidebarへ渡す
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
      />
    </div>
  );
}

export default App;