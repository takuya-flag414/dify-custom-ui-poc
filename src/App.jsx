// src/App.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import './index.css';

import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Layout/Header';
import ChatArea from './components/Chat/ChatArea';
import SettingsArea from './components/Settings/SettingsArea';
import ApiConfigModal from './components/Shared/ApiConfigModal';
import ArtifactPanel from './components/Artifacts/ArtifactPanel';

import { useLogger } from './hooks/useLogger';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { useApiConfig } from './hooks/useApiConfig';
import { useSettings } from './hooks/useSettings';

import { useTutorial } from './hooks/useTutorial';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

import { useOnboarding } from './hooks/useOnboarding';
import OnboardingOverlay from './components/Onboarding/OnboardingOverlay';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

function App() {
  const [mockMode, setMockMode] = useState('FE');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat');

  // 【修正】初期化時に関数を実行してIDとRoleを即時決定する
  const [currentUser, setCurrentUser] = useState(() => {
    // 1. User ID Initialization
    let storedUserId = null;
    try {
      storedUserId = localStorage.getItem('app_user_id');
    } catch (e) {
      console.error('Failed to read user id', e);
    }

    if (!storedUserId) {
      storedUserId = `user-${generateUUID().slice(0, 8)}`;
      try {
        localStorage.setItem('app_user_id', storedUserId);
      } catch (e) {
        console.error('Failed to save user id', e);
      }
      console.log('[App] New User ID generated:', storedUserId);
    } else {
      console.log('[App] User ID loaded:', storedUserId);
    }

    // 2. Role Initialization
    let storedRole = 'developer';
    try {
      storedRole = localStorage.getItem('app_debug_role') || 'developer';
    } catch (e) {
      console.error('Failed to read role', e);
    }
    console.log('[App] Debug Role loaded:', storedRole);

    return {
      id: storedUserId,
      role: storedRole,
      name: 'Loading...', // useSettingsで上書きされるため表示されません
    };
  });

  // 【削除】useEffect内でのUser ID生成ロジックは削除（上記のuseState初期化に移動済み）

  // Role変更ハンドラー
  const handleRoleChange = (newRole) => {
    localStorage.setItem('app_debug_role', newRole);
    setCurrentUser(prev => ({ ...prev, role: newRole }));
    addLog(`[App] Role changed to ${newRole}`, 'info');
  };

  const { settings, updateSettings, isLoaded: isSettingsLoaded } = useSettings(currentUser.id);

  const [activeArtifact, setActiveArtifact] = useState(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

  const {
    isActive: isTutorialActive,
    startTutorial,
    ...tutorialProps
  } = useTutorial();

  // オンボーディング（初回セットアップウィザード）
  const onboardingState = useOnboarding();

  const openArtifact = (artifact) => {
    setActiveArtifact(artifact);
    setIsArtifactOpen(true);
  };

  const closeArtifact = () => {
    setIsArtifactOpen(false);
  };

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
  } = useConversations(mockMode, currentUser.id, addLog, apiKey, apiUrl);

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
    currentUser.id,
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

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'settings') {
      setIsArtifactOpen(false);
    }
  };

  const appStyle = {
    '--sidebar-width': isSidebarCollapsed ? '68px' : '260px',
  };

  const pageTransitionVariants = {
    initial: {
      opacity: 0,
      y: 10,
      scale: 0.99,
      filter: "blur(4px)"
    },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1],
      }
    },
    exit: {
      opacity: 0,
      scale: 0.99,
      filter: "blur(2px)",
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="app" style={appStyle}>
      {/* オンボーディングウィザード（初回起動時のみ表示） */}
      <OnboardingOverlay
        {...onboardingState}
        updateSettings={updateSettings}
      />

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
        mockMode={mockMode}
        addLog={addLog}
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
        currentView={currentView}
        onViewChange={handleViewChange}
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
          onStartTutorial={startTutorial}
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
        />

        {/* Workspace (Chat + Artifact) */}
        <div className={`workspace ${isArtifactOpen ? 'artifact-open' : ''}`}>

          {/* Chat Area Wrapper */}
          <div className="chat-area-wrapper">
            <AnimatePresence mode="wait">
              {currentView === 'chat' ? (
                <motion.div
                  key="chat-view"
                  className="chat-content-motion-wrapper"
                  variants={pageTransitionVariants}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
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
                    userName={settings?.profile?.displayName || 'User'}
                    onStartTutorial={startTutorial}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="settings-view"
                  className="settings-content-motion-wrapper"
                  variants={pageTransitionVariants}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                  style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <SettingsArea
                    currentUser={currentUser}
                    settings={settings}
                    onUpdateSettings={updateSettings}
                    mockMode={mockMode}
                    setMockMode={handleMockModeChange}
                    onOpenApiConfig={() => setIsConfigModalOpen(true)}
                    onResetOnboarding={onboardingState.resetOnboarding}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Artifact Panel Wrapper */}
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