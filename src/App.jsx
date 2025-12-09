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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', newState.toString());
      return newState;
    });
  };

  const { addLog, handleCopyLogs, copyButtonText } = useLogger();

  const {
    conversations,
    conversationId,
    setConversationId,
    pinnedIds,
    handleConversationCreated,
    handleDeleteConversation,
    handleRenameConversation,
    handlePinConversation,
    handleConversationUpdated, // [New]
  } = useConversations(mockMode, addLog);

  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    activeContextFile,
    setActiveContextFile,
    handleSendMessage,
    searchSettings,
    setSearchSettings
  } = useChat(
    mockMode,
    conversationId,
    addLog,
    handleConversationCreated,
    handleConversationUpdated // [New] Pass it here
  );

  // --- 【修正】モード切り替え時の安全なハンドラー ---
  const handleMockModeChange = (newMode) => {
    setMockMode(newMode);
    
    // モード変更時は、旧モードのIDが残っているとAPIエラーになるため
    // 会話IDとメッセージ表示を強制的にリセットする
    setConversationId(null);
    setMessages([]);
    
    addLog(`[App] Mode changed to ${newMode}. Conversation reset.`, 'info');
  };
  // ----------------------------------------------

  const appStyle = {
    '--sidebar-width': isSidebarCollapsed ? '68px' : '260px',
  };

  return (
    <div className="app" style={appStyle}>
      <Sidebar
        conversationId={conversationId}
        setConversationId={setConversationId}
        conversations={conversations}
        pinnedIds={pinnedIds}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onPinConversation={handlePinConversation}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      <ChatArea
        messages={messages}
        setMessages={setMessages}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        mockMode={mockMode}
        setMockMode={handleMockModeChange} // 【修正】直接setMockModeを渡さず、ラッパーを渡す
        conversationId={conversationId}
        addLog={addLog}
        onConversationCreated={handleConversationCreated}
        handleCopyLogs={handleCopyLogs}
        copyButtonText={copyButtonText}
        activeContextFile={activeContextFile}
        setActiveContextFile={setActiveContextFile}
        onSendMessage={handleSendMessage}
        searchSettings={searchSettings}
        setSearchSettings={setSearchSettings}
        isSidebarCollapsed={isSidebarCollapsed}
      />
    </div>
  );
}

export default App;