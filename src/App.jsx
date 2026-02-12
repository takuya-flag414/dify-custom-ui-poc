// src/App.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import './index.css';

import Sidebar from './components/Sidebar/Sidebar';
import AppLayout from './components/Layout/AppLayout';
import Header from './components/Layout/Header';
import ChatArea from './components/Chat/ChatArea';
import ToolsGallery from './components/Tools/ToolsGallery';
import SettingsArea from './components/Settings/SettingsArea';
import ApiConfigModal from './components/Shared/ApiConfigModal';
import InspectorPanel from './components/Inspector/InspectorPanel';
import ArtifactPanel from './components/Artifacts/ArtifactPanel';
import TestPanel from './components/DevTools/TestPanel';
import SystemBootScreen from './components/Loading/SystemBootScreen';
import { StudiosContainer } from './components/Studios';

import { useLogger } from './hooks/useLogger';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { useApiConfig } from './hooks/useApiConfig';
import { useSettings } from './hooks/useSettings';
import { useTheme } from './hooks/useTheme';
import { useInspector } from './hooks/useInspector';

import { useTutorial } from './hooks/useTutorial';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

import { useOnboarding } from './hooks/useOnboarding';
import OnboardingScreen from './components/Onboarding/OnboardingScreen';
import { FEATURE_FLAGS } from './config/featureFlags';

// Phase A: 認証機能
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/Auth/LoginScreen';

import { DEFAULT_MOCK_MODE } from './config/env';

// Phase B: Backend B設定（ストア管理用）
import { useBackendBConfig } from './hooks/useBackendBConfig';

// generateUUID は AuthService に移管されたため削除
// 後方互換のため残存（将来削除予定）
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
  // ★ Phase A: 認証状態を取得
  // currentUser は useAuth の user を直接参照
  const { user: authUser, isAuthenticated, isLoading: isAuthLoading, logout, isNewUser, switchRole } = useAuth();

  const [mockMode, setMockMode] = useState(DEFAULT_MOCK_MODE);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat');

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ★追加: テストパネル状態
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);

  // ★追加: Studiosギャラリー強制表示フラグ
  const [forceShowStudioGallery, setForceShowStudioGallery] = useState(false);

  // ★ Phase A: currentUser を useAuth から取得したユーザー情報で構成
  // 認証済みの場合は authUser を使用、未認証の場合はフォールバック
  const currentUser = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.userId,
        role: authUser.role || 'user', // レガシー互換
        roles: authUser.roles,         // RBAC
        name: authUser.displayName || 'User',
        email: authUser.email,
        createdAt: authUser.createdAt,
      };
    }
    // 未認証時のフォールバック（画面遷移前の一瞬など）
    return {
      id: null,
      role: 'user',
      name: 'Loading...',
    };
  }, [authUser]);

  // Role変更ハンドラー（DevMode用）
  const handleRoleChange = async (newRole) => {
    await switchRole(newRole);
    addLog(`[App] Role switched to ${newRole}`, 'info');
  };

  // ★ Phase A: authUser.preferencesをuseSettingsに渡し、アカウント設定を反映
  const { settings, updateSettings, isLoaded: isSettingsLoaded } = useSettings(authUser?.userId, authUser?.preferences);

  // テーマをDOMに適用
  // ★ Loading中は前回のテーマ設定（app_last_theme）を優先使用し、ちらつきを防止
  const effectiveTheme = useMemo(() => {
    if (isSettingsLoaded) return settings?.general?.theme || 'system';
    return localStorage.getItem('app_last_theme') || 'system';
  }, [isSettingsLoaded, settings?.general?.theme]);

  useTheme(effectiveTheme);

  // Inspector Panel 状態管理
  const inspector = useInspector();

  // Artifact Panel 状態管理（Inspectorから独立）
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState(null);

  const {
    isActive: isTutorialActive,
    startTutorial,
    ...tutorialProps
  } = useTutorial();

  // オンボーディング（初回セットアップウィザード）
  // ★ Phase A: ユーザーIDごとにオンボーディング完了を管理
  const onboardingState = useOnboarding(authUser?.userId);

  // ArtifactPanelを開く（Inspectorから独立）
  const openArtifact = (artifact) => {
    setActiveArtifact(artifact);
    setIsArtifactOpen(true);
  };

  const closeArtifact = () => {
    setIsArtifactOpen(false);
    setActiveArtifact(null);
  };

  // ★一時無効化: Citation クリック連携（Inspectorが開発中のため）
  /*
  useEffect(() => {
    const handleOpenCitation = (e) => {
      const { citationIndex } = e.detail || {};
      if (citationIndex != null) {
        inspector.highlightCitation(citationIndex);
      }
    };

    window.addEventListener('openInspectorCitation', handleOpenCitation);
    return () => window.removeEventListener('openInspectorCitation', handleOpenCitation);
  }, [inspector]);
  */

  const { apiKey, apiUrl, saveConfig } = useApiConfig();

  // Phase B: Backend B設定
  const {
    apiKey: backendBApiKey,
    apiUrl: backendBApiUrl,
    saveConfig: saveBackendBConfig,
  } = useBackendBConfig();

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
    handleConversationCreated,
    handleDeleteConversation,
    handleRenameConversation,
    handleConversationUpdated,
  } = useConversations(mockMode, authUser?.userId, addLog, apiKey, apiUrl);

  const {
    messages,
    setMessages,
    // ★追加: ストリーミング中メッセージ（パフォーマンス最適化）
    streamingMessage,
    isGenerating,
    isHistoryLoading,
    activeContextFiles,
    setActiveContextFiles,
    handleSendMessage,
    searchSettings,
    setSearchSettings,
    // ★追加: Phase 1.5 - 停止・編集・再送信機能
    stopGeneration,
    handleEdit,
    handleRegenerate
  } = useChat(
    mockMode,
    authUser?.userId,
    conversationId,
    addLog,
    handleConversationCreated,
    handleConversationUpdated,
    apiKey,
    apiUrl,
    settings?.prompt // ★追加: AI回答スタイルとシステムプロンプトを渡す
      ? { ...settings.prompt, displayName: settings?.profile?.displayName || '' }
      : undefined
  );

  const handleMockModeChange = (newMode) => {
    setMockMode(newMode);
    setConversationId(null);
    setMessages([]);
    setIsArtifactOpen(false);
    setActiveArtifact(null);
    addLog(`[App] Mode changed to ${newMode}. Conversation reset.`, 'info');
  };

  // オンボーディングリセット用ハンドラー
  // 履歴は維持しつつ、画面を初期状態（WelcomeScreen）に戻す
  const handleResetOnboarding = () => {
    // 1. オンボーディング状態をリセット
    onboardingState.resetOnboarding();

    // 2. 現在の会話選択を解除（これによりWelcomeScreenが表示される）
    setConversationId(null);
    setMessages([]);

    // 3. チャット画面に戻る
    setCurrentView('chat');
    setIsSettingsOpen(false); // Close modal if open
    setIsArtifactOpen(false);

    addLog('[App] Onboarding reset. Conversation view cleared.', 'info');
  };

  const handleViewChange = (view) => {
    if (view === 'settings' && FEATURE_FLAGS.USE_SETTINGS_MODAL) {
      setIsSettingsOpen(true);
      return;
    }

    // Studiosに切り替える時はギャラリー強制表示フラグをセット
    if (view === 'studios') {
      setForceShowStudioGallery(true);
    }

    setCurrentView(view);
    if (view === 'settings') {
      setIsArtifactOpen(false);
    }
  };

  const appStyle = {
    '--sidebar-width': isSidebarCollapsed ? '68px' : '260px',
  };

  // ★ Phase A: 表示名の決定ロジック
  // settings.profile.displayName がデフォルト値"User"の場合は authUser の displayName を優先
  const effectiveDisplayName = useMemo(() => {
    const savedName = settings?.profile?.displayName;
    const authName = currentUser?.name;
    const isCustomSavedName = savedName && savedName !== 'User';
    return isCustomSavedName ? savedName : (authName || savedName || 'User');
  }, [settings?.profile?.displayName, currentUser?.name]);

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

  // アプリ登場アニメーション設定
  const appEntranceVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  };

  // Sidebar用アニメーション（左からスライドイン）
  const sidebarVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
    }
  };

  // メインコンテンツ用アニメーション（フェード+上からスライド）
  const mainContentVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
    }
  };

  // 初期状態の判定（グラデーション背景表示用）
  const isInitialState = messages.length === 0 && !isHistoryLoading && currentView === 'chat';

  // ★ Phase A: 認証ローディング中
  if (isAuthLoading) {
    return <SystemBootScreen />;
  }

  // ★ Phase A: 未認証の場合はログイン画面を表示
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <LoginScreen key="login" />
      </AnimatePresence>
    );
  }

  return (
    <div className={`app${isInitialState ? ' app-initial' : ''}`} style={appStyle}>
      {/* オンボーディングウィザード（新規アカウント作成時のみ表示） */}
      <AnimatePresence>
        {isNewUser && !onboardingState.isCompleted && (
          <OnboardingScreen
            {...onboardingState}
            updateSettings={updateSettings}
          />
        )}
      </AnimatePresence>

      {/* アプリ本体（isNewUserでなければ即座に表示、isNewUserならisAppReady後に表示） */}
      {(!isNewUser || onboardingState.isAppReady) && (
        <>
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
            currentBackendBApiKey={backendBApiKey}
            currentBackendBApiUrl={backendBApiUrl}
            onSaveBackendB={saveBackendBConfig}
            mockMode={mockMode}
          />

          {/* 3-Pane Grid Layout (DESIGN_RULE.md v3.0) */}
          <motion.div
            variants={appEntranceVariants}
            initial="hidden"
            animate="visible"
            style={{ width: '100%', height: '100%' }}
          >
            <AppLayout
              sidebarCollapsed={isSidebarCollapsed}
              inspectorOpen={inspector.isOpen}
              artifactOpen={isArtifactOpen}
              sidebar={
                <motion.div variants={sidebarVariants} style={{ height: '100%' }}>
                  <Sidebar
                    conversationId={conversationId}
                    setConversationId={setConversationId}
                    conversations={conversations}
                    onDeleteConversation={handleDeleteConversation}
                    onRenameConversation={handleRenameConversation}
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={toggleSidebar}
                    currentView={currentView}
                    onViewChange={handleViewChange}
                  />
                </motion.div>
              }
              main={
                <motion.div variants={mainContentVariants} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                    isInspectorOpen={inspector.isOpen}
                    onToggleInspector={() => inspector.isOpen ? inspector.closeInspector() : inspector.openInspector()}
                    onOpenTestPanel={() => setIsTestPanelOpen(true)}
                  />

                  {/* Main Content Area */}
                  <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                      {currentView === 'studios' ? (
                        <motion.div
                          key="studios-view"
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
                          <StudiosContainer
                            onStudioEnter={() => {
                              // スタジオ入室時に会話をリセット（新規チャット/Welcome表示）
                              setConversationId(null);
                              setMessages([]);
                            }}
                            forceShowGallery={forceShowStudioGallery}
                            onGalleryShown={() => setForceShowStudioGallery(false)}
                          >
                            <ChatArea
                              messages={messages}
                              streamingMessage={streamingMessage}
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
                              userName={effectiveDisplayName}
                              onStartTutorial={startTutorial}
                              stopGeneration={stopGeneration}
                              handleEdit={handleEdit}
                              handleRegenerate={handleRegenerate}
                              mockMode={mockMode}
                              backendBApiKey={backendBApiKey}
                              backendBApiUrl={backendBApiUrl}
                            />
                          </StudiosContainer>
                        </motion.div>
                      ) : currentView === 'tools' ? (
                        <motion.div
                          key="tools-view"
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
                          <ToolsGallery
                            onSendMessage={handleSendMessage}
                            setSearchSettings={setSearchSettings}
                            onNavigateToChat={() => setCurrentView('chat')}
                          />
                        </motion.div>
                      ) : (currentView === 'chat' || (FEATURE_FLAGS.USE_SETTINGS_MODAL && currentView !== 'settings')) ? (
                        <motion.div
                          key="chat-view"
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
                            streamingMessage={streamingMessage}
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
                            userName={effectiveDisplayName}
                            onStartTutorial={startTutorial}
                            stopGeneration={stopGeneration}
                            handleEdit={handleEdit}
                            handleRegenerate={handleRegenerate}
                            mockMode={mockMode}
                            backendBApiKey={backendBApiKey}
                            backendBApiUrl={backendBApiUrl}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="settings-view"
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
                            onResetOnboarding={handleResetOnboarding}
                            onLogout={() => {
                              logout();
                              setIsSettingsOpen(false);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              }
              inspector={(() => {
                // 最新のAIメッセージから情報を取得
                const lastAiMessage = messages.slice().reverse().find(m => m.role === 'ai');
                // ★修正: ストリーミング中はstreamingMessageを優先して表示
                const targetMessage = (isGenerating && streamingMessage) ? streamingMessage : lastAiMessage;

                const thinkingSteps = targetMessage?.thoughtProcess || [];
                const citations = targetMessage?.citations || [];
                const messageId = targetMessage?.messageId || targetMessage?.id;

                return (
                  <InspectorPanel
                    isOpen={inspector.isOpen}
                    onClose={inspector.closeInspector}
                    thinkingSteps={thinkingSteps}
                    isStreaming={isGenerating}
                    citations={citations}
                    messageId={messageId}
                    artifacts={inspector.selectedArtifact ? [inspector.selectedArtifact] : []}
                    activeArtifact={inspector.selectedArtifact}
                    onArtifactSelect={openArtifact}
                    initialTab={inspector.activeTab}
                    highlightedCitationIndex={inspector.highlightedCitation?.index}
                  />
                );
              })()}
              artifactPanel={
                <ArtifactPanel
                  isOpen={isArtifactOpen}
                  onClose={closeArtifact}
                  artifact={activeArtifact}
                />
              }
            />
          </motion.div>

          {/* Settings Modal Overlay - GLOBAL LEVEL */}
          <AnimatePresence>
            {FEATURE_FLAGS.USE_SETTINGS_MODAL && isSettingsOpen && (
              <SettingsArea
                currentUser={currentUser}
                settings={settings}
                onUpdateSettings={updateSettings}
                mockMode={mockMode}
                setMockMode={handleMockModeChange}
                onOpenApiConfig={() => setIsConfigModalOpen(true)}
                onResetOnboarding={handleResetOnboarding}
                onLogout={() => {
                  logout();
                  setIsSettingsOpen(false);
                }}
                isModal={true}
                onClose={() => setIsSettingsOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* ★追加: テストパネル */}
          <TestPanel
            isOpen={isTestPanelOpen}
            onClose={() => setIsTestPanelOpen(false)}
            mockMode={mockMode}
            addLog={addLog}
            handleSendMessage={handleSendMessage}
            messages={messages}
            apiKey={apiKey}
            apiUrl={apiUrl}
            userId={authUser?.userId}
          />
        </>
      )
      }
    </div >
  );
}

export default App;