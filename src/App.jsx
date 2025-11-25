// src/App.jsx
import { useState } from 'react';
import './App.css';
import './index.css';

// コンポーネントのインポート
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// カスタムフックのインポート
import { useLogger } from './hooks/useLogger';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';

function App() {
  const [mockMode, setMockMode] = useState('FE');

  // カスタムフックの初期化
  const { addLog, handleCopyLogs, copyButtonText } = useLogger();
  const {
    conversations,
    conversationId,
    setConversationId,
    handleConversationCreated
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