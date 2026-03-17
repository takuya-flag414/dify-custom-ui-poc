// src/App.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import './index.css';

import Sidebar from './components/Sidebar/Sidebar';
import AppLayout from './components/Layout/AppLayout';
import Header from './components/Layout/Header';
import ToolsGallery from './components/Tools/ToolsGallery';
import SettingsArea from './components/Settings/SettingsArea';
import ChatView from './routes/ChatView';
import SettingsOverlay from './routes/SettingsOverlay';
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
import { useErrorIntelligence } from './hooks/useErrorIntelligence';

import ErrorGlassCard from './components/IntelligenceHUD/ErrorGlassCard';
import SanitizeToast from './components/Chat/SanitizeToast';

import { useTutorial } from './hooks/useTutorial';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

import { useOnboarding } from './hooks/useOnboarding';
import OnboardingScreen from './components/Onboarding/OnboardingScreen';
import { FEATURE_FLAGS } from './config/featureFlags';

// Phase A: 認証機能
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/Auth/LoginScreen';

import { DEFAULT_MOCK_MODE } from './config/env';

// ★追加: メッセージ再送信時のテキスト抽出ユーティリティ
import { extractPlainText } from './utils/messageSerializer';

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

  // ★ URLルーティング: backgroundLocation パターン
  // 設定画面をオーバーレイ表示する際、背景のチャット画面を維持するために
  // 「元の位置」を location.state.backgroundLocation として保持する
  const location = useLocation();
  const navigate = useNavigate();
  const backgroundLocation = location.state?.backgroundLocation;
  // RoutesはbackgroundLocationがあればそれを使用（設定画面の裏でチャットを維持）
  const displayLocation = backgroundLocation || location;
  const currentView = displayLocation.pathname.startsWith('/settings') ? 'settings' : 'chat';
  const isSettingsOpen = location.pathname.startsWith('/settings');

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
    handleTitleExtracted,
    handleTitleFallback,
  } = useConversations(mockMode, authUser?.userId, addLog, apiKey, apiUrl);

  // ★修正: conversationIdの宣言後に配置 (ReferenceError防止)
  useEffect(() => {
    closeArtifact();
  }, [conversationId]);

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
    handleRegenerate,
    // ★追加: IntelligenceErrorHandler連携
    lastError,
    setLastError,
    // ★Phase 2: サニタイズ通知
    sanitizeNotification,
    setSanitizeNotification,
  } = useChat(
    mockMode,
    authUser?.userId,
    conversationId,
    addLog,
    handleConversationCreated,
    handleConversationUpdated,
    handleTitleExtracted,
    handleTitleFallback,
    () => setConversationId(null), // ★追加: onNotFound ハンドラー
    apiKey,
    apiUrl,
    settings?.prompt // ★追加: AI回答スタイルとシステムプロンプトを渡す
      ? { ...settings.prompt, displayName: settings?.profile?.displayName || '' }
      : undefined
  );

  // ★追加: IntelligenceErrorHandler
  const errorIntelligence = useErrorIntelligence();

  // ★追加: useChat の lastError を useErrorIntelligence にブリッジ
  useEffect(() => {
    if (lastError) {
      errorIntelligence.reportError(lastError.raw, () => {
        // リトライコールバック: 最後のユーザーメッセージを再送信
        // ★修正: extractPlainText で構造化JSONからプレーンテキストを抽出し、二重ラップを防止
        const lastUserMsg = messages.slice().reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
          const plainText = extractPlainText(lastUserMsg.text);
          handleSendMessage(plainText, []);
        }
      });
      setLastError(null); // クリア
    }
  }, [lastError]);

  // ★追加: Artifactレスポンス自動展開
  // メッセージ完了時、最新AIメッセージにartifactが存在したら自動でArtifactPanelを開く
  // ★修正: 会話履歴ロード時の誤発火を防ぐため、生成中(isGenerating)が終了した直後のみ開くようにする
  const prevIsGenerating = useRef(isGenerating);
  useEffect(() => {
    // 生成中から完了（true -> false）へと遷移したタイミングでのみ評価する
    if (prevIsGenerating.current && !isGenerating) {
      const lastAiMsg = messages.slice().reverse().find(m => m.role === 'ai');
      if (lastAiMsg?.artifact) {
        openArtifact({
          title: lastAiMsg.artifact.artifact_title,
          type: lastAiMsg.artifact.artifact_type,
          content: lastAiMsg.artifact.artifact_content,
          citations: lastAiMsg.artifact.citations || lastAiMsg.citations || [],
        });
      }
    }
    prevIsGenerating.current = isGenerating;
  }, [messages, isGenerating]);

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

    // 3. チャット画面に戻る（URLルーティング対応）
    navigate('/chat');
    setIsArtifactOpen(false);

    addLog('[App] Onboarding reset. Conversation view cleared.', 'info');
  };

  // ★ URLルーティング: ビュー切替をナビゲーションに変換
  const handleViewChange = (view) => {
    if (view === 'settings') {
      // ★ backgroundLocation: 現在のチャット位置を保存して設定画面へ
      navigate('/settings/profile', { state: { backgroundLocation: location } });
      return;
    }

    // Studiosに切り替える時はギャラリー強制表示フラグをセット
    if (view === 'studios') {
      setForceShowStudioGallery(true);
    }

    if (view === 'chat') {
      navigate('/chat');
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
      {/* オンボーディングウィザード（未完了 or リセット後に表示） */}
      <AnimatePresence>
        {!onboardingState.isCompleted && (
          <OnboardingScreen
            {...onboardingState}
            updateSettings={updateSettings}
          />
        )}
      </AnimatePresence>

      {/* アプリ本体（オンボーディング完了後、またはスキップ後に表示） */}
      {(onboardingState.isCompleted || onboardingState.isAppReady) && (
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

                  {/* Main Content Area — URLルーティング */}
                  <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                      <Routes location={displayLocation} key={currentView}>
                        <Route path="/" element={<Navigate to="/chat" replace />} />
                        <Route path="/chat" element={
                          <ChatView
                            messages={messages}
                            streamingMessage={streamingMessage}
                            setMessages={setMessages}
                            isGenerating={isGenerating}
                            isHistoryLoading={isHistoryLoading}
                            conversationId={conversationId}
                            setConversationId={setConversationId}
                            addLog={addLog}
                            handleConversationCreated={handleConversationCreated}
                            activeContextFiles={activeContextFiles}
                            setActiveContextFiles={setActiveContextFiles}
                            handleSendMessage={handleSendMessage}
                            searchSettings={searchSettings}
                            setSearchSettings={setSearchSettings}
                            onOpenConfig={() => setIsConfigModalOpen(true)}
                            openArtifact={openArtifact}
                            isArtifactOpen={isArtifactOpen}
                            closeArtifact={closeArtifact}
                            activeArtifact={activeArtifact}
                            effectiveDisplayName={effectiveDisplayName}
                            startTutorial={startTutorial}
                            stopGeneration={stopGeneration}
                            handleEdit={handleEdit}
                            handleRegenerate={handleRegenerate}
                            mockMode={mockMode}
                            backendBApiKey={backendBApiKey}
                            backendBApiUrl={backendBApiUrl}
                          />
                        } />
                        <Route path="/chat/:conversationId" element={
                          <ChatView
                            messages={messages}
                            streamingMessage={streamingMessage}
                            setMessages={setMessages}
                            isGenerating={isGenerating}
                            isHistoryLoading={isHistoryLoading}
                            conversationId={conversationId}
                            setConversationId={setConversationId}
                            addLog={addLog}
                            handleConversationCreated={handleConversationCreated}
                            activeContextFiles={activeContextFiles}
                            setActiveContextFiles={setActiveContextFiles}
                            handleSendMessage={handleSendMessage}
                            searchSettings={searchSettings}
                            setSearchSettings={setSearchSettings}
                            onOpenConfig={() => setIsConfigModalOpen(true)}
                            openArtifact={openArtifact}
                            isArtifactOpen={isArtifactOpen}
                            closeArtifact={closeArtifact}
                            activeArtifact={activeArtifact}
                            effectiveDisplayName={effectiveDisplayName}
                            startTutorial={startTutorial}
                            stopGeneration={stopGeneration}
                            handleEdit={handleEdit}
                            handleRegenerate={handleRegenerate}
                            mockMode={mockMode}
                            backendBApiKey={backendBApiKey}
                            backendBApiUrl={backendBApiUrl}
                          />
                        } />
                        <Route path="*" element={<Navigate to="/chat" replace />} />
                      </Routes>
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
            />
          </motion.div>

          {/* Settings Modal Overlay - URLルーティングベース */}
          <AnimatePresence>
            {isSettingsOpen && (
              <SettingsOverlay
                currentUser={currentUser}
                settings={settings}
                onUpdateSettings={updateSettings}
                mockMode={mockMode}
                handleMockModeChange={handleMockModeChange}
                onOpenApiConfig={() => setIsConfigModalOpen(true)}
                handleResetOnboarding={handleResetOnboarding}
                logout={logout}
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

          {/* ★Phase 2: サニタイズ完了トースト */}
          <SanitizeToast
            count={sanitizeNotification.count}
            visible={sanitizeNotification.visible}
            onDismissed={() => setSanitizeNotification({ visible: false, count: 0 })}
          />

          {/* ★追加: IntelligenceErrorHandler HUD Overlay */}
          <ErrorGlassCard
            error={errorIntelligence.activeError}
            retryCountdown={errorIntelligence.retryCountdown}
            isRetrying={errorIntelligence.isRetrying}
            retryCount={errorIntelligence.retryCount}
            shakeKey={errorIntelligence.shakeKey}
            onDismiss={errorIntelligence.dismiss}
            onManualRetry={errorIntelligence.triggerManualRetry}
            onOpenConfig={() => setIsConfigModalOpen(true)}
          />
        </>
      )
      }
    </div >
  );
}

export default App;