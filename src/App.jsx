// src/App.jsx
import { useState } from 'react';
import './App.css';
import './index.css';

import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Layout/Header';
import ChatArea from './components/Chat/ChatArea';
import ApiConfigModal from './components/Shared/ApiConfigModal';
import ArtifactPanel from './components/Artifacts/ArtifactPanel';

import { useLogger } from './hooks/useLogger';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { useApiConfig } from './hooks/useApiConfig';

// ★追加 1: チュートリアル関連のインポート
import { useTutorial } from './hooks/useTutorial';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

function App() {
  const [mockMode, setMockMode] = useState('FE');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // --- Artifact State ---
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

  // ★追加 2: チュートリアルStateの初期化
  const {
    isActive: isTutorialActive,
    startTutorial,
    ...tutorialProps // step, currentStepIndex, onNext... などをまとめて受け取る
  } = useTutorial();

  const openArtifact = (artifact) => {
    setActiveArtifact(artifact);
    setIsArtifactOpen(true);
  };

  const closeArtifact = () => {
    setIsArtifactOpen(false);
  };

  // API Config Hook
  const { apiKey, apiUrl, saveConfig } = useApiConfig();

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
    handleConversationUpdated,
  } = useConversations(mockMode, addLog, apiKey, apiUrl);

  const {
    messages,
    setMessages,
    isGenerating,
    isHistoryLoading,
    activeContextFiles,
    setActiveContextFiles,
    handleSendMessage,
    searchSettings,
    setSearchSettings
  } = useChat(
    mockMode,
    conversationId,
    addLog,
    handleConversationCreated,
    handleConversationUpdated,
    apiKey,
    apiUrl
  );

  const handleMockModeChange = (newMode) => {
    setMockMode(newMode);
    setConversationId(null);
    setMessages([]);
    setIsArtifactOpen(false);
    setActiveArtifact(null);
    addLog(`[App] Mode changed to ${newMode}. Conversation reset.`, 'info');
  };

  const appStyle = {
    '--sidebar-width': isSidebarCollapsed ? '68px' : '260px',
  };

  return (
    <div className="app" style={appStyle}>
      {/* ★追加 3: チュートリアルオーバーレイの配置 */}
      <TutorialOverlay
        isActive={isTutorialActive}
        {...tutorialProps}
      />

      <ApiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currentApiKey={apiKey}
        currentApiUrl={apiUrl}
        onSave={saveConfig}
      />

      {/* 1. Sidebar */}
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

      {/* 2. Main Content (Right Side) */}
      <div className="main-container">

        {/* Header (Top Bar) */}
        <Header
          mockMode={mockMode}
          setMockMode={handleMockModeChange}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          handleCopyLogs={handleCopyLogs}
          copyButtonText={copyButtonText}
          messages={messages}
          // ★追加 4: 開始関数を渡す
          onStartTutorial={startTutorial}
        />

        {/* Workspace (Chat + Artifact) */}
        <div className={`workspace ${isArtifactOpen ? 'artifact-open' : ''}`}>

          {/* Chat Area Wrapper */}
          <div className="chat-area-wrapper">
            <ChatArea
              messages={messages}
              setMessages={setMessages}
              isGenerating={isGenerating}
              isHistoryLoading={isHistoryLoading}
              conversationId={conversationId}
              addLog={addLog}
              onConversationCreated={handleConversationCreated}
              activeContextFiles={activeContextFiles}
              setActiveContextFiles={setActiveContextFiles}
              onSendMessage={handleSendMessage}
              searchSettings={searchSettings}
              setSearchSettings={setSearchSettings}
              onOpenConfig={() => setIsConfigModalOpen(true)}
              onOpenArtifact={openArtifact}
            />
          </div>

          {/* Artifact Panel Wrapper (Floating Island) */}
          <div className="artifact-panel-wrapper">
            <ArtifactPanel
              isOpen={isArtifactOpen}
              onClose={closeArtifact}
              artifact={activeArtifact}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;