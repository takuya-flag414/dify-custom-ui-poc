import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../App.css';
import './ChatArea.css';
import { extractPlainText } from '../../utils/messageSerializer';

import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import HistorySkeleton from './HistorySkeleton';
import WelcomeScreen from './WelcomeScreen';
import AiSlideStudio from './AiSlideStudio'; // ★追加
import ScrollToBottomButton from './ScrollToBottomButton';
import TableModal from '../Shared/TableModal';
import ArtifactPanel from '../Artifacts/ArtifactPanel';
import JsonSlidePanel from '../Artifacts/JsonSlidePanel';
import JsonDocumentPanel from '../Artifacts/JsonDocumentPanel';


const ChatArea = (props) => {
  const {
    messages,
    streamingMessage,
    isGenerating,
    isHistoryLoading,
    activeContextFiles,
    setActiveContextFiles,
    onSendMessage,
    searchSettings,
    setSearchSettings,
    onOpenConfig,
    onOpenArtifact,
    isArtifactOpen,
    closeArtifact,
    activeArtifact: openedArtifact,
    userName,
    onStartTutorial,
    stopGeneration,
    handleEdit,
    handleRegenerate,
    autoScroll = true, // デフォルトtrue
    // Phase B: Backend B連携用
    mockMode = 'OFF',
    backendBApiKey = '',
    backendBApiUrl = '',
    sendKey = 'enter',
    // ★追加: エラー/停止時のテキスト復元
    restoreText = null,
    onRestoreTextConsumed,
    isShieldActive = false,  // ★追加: シールドモード状態
    // ★追加: エラーインテリジェンスのステート
    activeError = null,
    retryCountdown = 0,
    isRetrying = false,
    retryCount = 0,
  } = props;

  // ★追加: 表示モード管理
  const [viewMode, setViewMode] = useState('welcome');

  // ★追加: 自動スクロール有効状態管理
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // ★追加: Contextual Quote (文脈引用) の状態管理
  const [quoteContext, setQuoteContext] = useState(null);

  // ★追加: Table Modalの状態管理をChatAreaに持ち上げ
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableContent, setTableContent] = useState(null);

  // ★追加: Artifactの状態管理をChatAreaに持ち上げ（WelcomeScreenからの遷移で消滅しないようにするため）
  const [activeArtifact, setActiveArtifact] = useState(null);

  // ★追加: Wizardからのプロンプト注入用
  const [wizardText, setWizardText] = useState(null);

  // ★修正: 履歴ロード完了時に viewMode を決定するロジックを下の useEffect に統合したため、ここは削除

  // ★変更: 履歴ロード完了時に、直前のユーザーメッセージからArtifact状態を復元する
  const prevIsHistoryLoading = useRef(isHistoryLoading);
  useEffect(() => {
    if (prevIsHistoryLoading.current && !isHistoryLoading) {
      // ロード完了時
      let restoredArtifact = null;
      if (messages.length > 0) {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg && lastUserMsg.text) {
          try {
            // メッセージテキストの構造化JSONをパース
            const parsed = JSON.parse(lastUserMsg.text);
            if (parsed.artifact && parsed.artifact.requested && parsed.artifact.type) {
              const type = parsed.artifact.type;
              const ARTIFACT_LABELS = {
                summary_report: 'サマリーレポート',
                checklist: 'チェックリスト',
                comparison_table: '比較表',
                faq: 'FAQ',
                meeting_minutes: '議事録'
              };
              restoredArtifact = { type, label: ARTIFACT_LABELS[type] || type };
            }
          } catch (e) {
            // JSONパースエラー時は無視
          }
        }
      }
      setActiveArtifact(restoredArtifact);
      
      // ★追加: 履歴ロード完了時に viewMode を確定させる (useEffectのタイミングによるチラつき防止)
      if (viewMode !== 'ai_slide_studio') {
        // ★修正: メッセージが0件でも conversationId がある場合は chat ビューにする
        const nextView = (messages.length === 0 && !props.conversationId) ? 'welcome' : 'chat';
        if (viewMode !== nextView) {
          setViewMode(nextView);
        }
      }
    } else if (isHistoryLoading && !prevIsHistoryLoading.current) {
      // ロード開始時
      setActiveArtifact(null);
    }
    prevIsHistoryLoading.current = isHistoryLoading;
  }, [isHistoryLoading, messages.length, viewMode, props.conversationId]);

  const handleOpenTableModal = useCallback((content) => {
    setTableContent(content);
    setIsTableModalOpen(true);
  }, []);

  // 初期化時にpropsの値をセット
  useEffect(() => {
    setAutoScrollEnabled(autoScroll);
  }, [autoScroll]);

  // ★追加: メッセージ送信時に自動スクロールを強制的にONに戻す共通ハンドラ
  const handleSendMessageInternal = useCallback((text, attachments = [], options = {}) => {
    setAutoScrollEnabled(true);
    setViewMode('chat'); // ★追加: メッセージ送信時は必ずチャットビューにする
    onSendMessage(text, attachments, options);
  }, [onSendMessage]);

  const handleSuggestionClick = useCallback((q) => {
    handleSendMessageInternal(q, []);
  }, [handleSendMessageInternal]);

  const handleSmartActionSelect = useCallback((action) => {
    // LLMによってアンダースコアが省かれるケースがあるため正規化する
    const normalizedType = action.type ? action.type.replace(/_/g, '').toLowerCase() : '';

    switch (normalizedType) {
      case 'suggestedquestion':
        if (action.payload?.text) {
          handleSendMessageInternal(action.payload.text, []);
        }
        break;

      case 'retrymode':
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg && action.payload?.mode) {
          const modeSettings = {
            'rag_only': { ragEnabled: true, webEnabled: false },
            'web_only': { ragEnabled: false, webEnabled: true },
            'hybrid': { ragEnabled: true, webEnabled: true },
            'standard': { ragEnabled: false, webEnabled: false },
            'fast': { ragEnabled: false, webEnabled: false },
            // アンダースコアなしのペイロードも考慮
            'ragonly': { ragEnabled: true, webEnabled: false },
            'webonly': { ragEnabled: false, webEnabled: true }
          };
          const newSettings = modeSettings[action.payload.mode] || modeSettings[action.payload.mode.replace(/_/g, '')];
          if (newSettings) {
            setSearchSettings(prev => ({
              ...prev,
              ...newSettings
            }));
          }
          setTimeout(() => {
            // payload.textがあればLLM生成文を優先、なければ直前入力をフォールバック
            const textToSend = action.payload.text || extractPlainText(lastUserMsg.text);
            handleSendMessageInternal(textToSend, []);
          }, 100);
        }
        break;

      case 'websearch':
        const lastUserMsgForWeb = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsgForWeb) {
          setSearchSettings(prev => ({
            ...prev,
            webEnabled: true
          }));
          setTimeout(() => {
            // payload.textがあればLLM生成文を優先、なければ直前入力をフォールバック
            const textToSend = action.payload?.text || extractPlainText(lastUserMsgForWeb.text);
            handleSendMessageInternal(textToSend, []);
          }, 100);
        }
        break;

      case 'deepdive':
        if (action.payload?.text) {
          // LLMが生成したpayload.textを直接送信（自然な質問文）
          handleSendMessageInternal(action.payload.text, []);
        }
        break;

      case 'navigate':
        if (action.payload?.url) {
          window.open(action.payload.url, '_blank', 'noopener,noreferrer');
        }
        break;

      case 'selection':
        if (action.payload?.text) {
          handleSendMessageInternal(action.payload.text, []);
        }
        break;

      case 'generatedocument': {
        // ★Artifact生成リクエスト: generate_document smart action
        let artifactType = action.payload?.artifact_type;
        let artifactText = action.payload?.text || action.label;

        // ★フォールバック: LLMが payload.text に "artifact_type:xxx" を埋め込んだ場合の抽出
        if (!artifactType && artifactText) {
          const match = artifactText.match(/[.。]?\s*artifact_type\s*:\s*(\w+)\s*$/i);
          if (match) {
            artifactType = match[1]; // e.g. 'summary_report'
            // テキストからartifact_type部分を除去して送信
            artifactText = artifactText.replace(match[0], '').trim();
          }
        }

        artifactType = artifactType || 'summary_report'; // デフォルト

        // ★追加: 画面（Reference Rail）上部にも、ユーザーが手動で選択したのと同じように表示させる
        const ARTIFACT_LABELS = {
          summary_report: 'サマリーレポート',
          checklist: 'チェックリスト',
          comparison_table: '比較表',
          faq: 'FAQ',
          meeting_minutes: '議事録'
        };
        const displayLabel = ARTIFACT_LABELS[artifactType] || artifactType;
        const requestedArtifactInfo = { type: artifactType, label: displayLabel };
        setActiveArtifact(requestedArtifactInfo);

        // ★追加: リアルタイムレンダリングのため、要求時にすぐパネルを開く
        if (onOpenArtifact) {
          onOpenArtifact(requestedArtifactInfo);
        }

        // ★変更: artifactオプションの構造を統一し、AIの発話に付与
        handleSendMessageInternal(artifactText, [], { artifact: { requested: true, type: artifactType, label: displayLabel } });
        break;
      }

      default:
        console.warn('Unknown smart action type:', action.type);
    }
  }, [messages, handleSendMessageInternal, setSearchSettings, setActiveArtifact, onOpenArtifact]);

  // ★追加: ボタンクリック時のハンドラ
  const handleScrollToBottom = () => {
    setAutoScrollEnabled(true);
  };

  // ★追加: Wizard完了時の処理
  const handleWizardComplete = useCallback((prompt, addMenu, context) => {
    setWizardText(prompt);
    
    if (addMenu) {
      // idとlabelの簡易マッピング（必要に応じて拡張）
      const labels = {
        'json_slide': 'プレゼンスライド'
      };
      setActiveArtifact({ type: addMenu, label: labels[addMenu] || addMenu });
    }
    
    if (context) {
      setSearchSettings(prev => ({ ...prev, ...context }));
    }
  }, [setActiveArtifact, setSearchSettings]);

  // ★追加: 外部から注入したテキストが消費された時のハンドラ
  const handleRestoreTextConsumed = useCallback(() => {
    if (wizardText) {
      setWizardText(null);
    }
    if (onRestoreTextConsumed) {
      onRestoreTextConsumed();
    }
  }, [wizardText, onRestoreTextConsumed]);

  // DESIGN_RULE.md に基づく Spring パラメータ
  const transitionProps = {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(10px)' },
    transition: { type: 'spring', stiffness: 250, damping: 25, mass: 1 }
  };

  return (
    <div className={`chat-area${viewMode === 'welcome' ? ' chat-area-initial' : ''} ${isArtifactOpen ? 'artifact-open' : ''}`}>
      <AnimatePresence mode="wait">
        {viewMode === 'ai_slide_studio' ? (
          <motion.div key="studio" {...transitionProps} className="chat-view-container">
            <AiSlideStudio 
              onBack={() => setViewMode('welcome')} 
              mockMode={mockMode}
              backendBApiKey={backendBApiKey}
              backendBApiUrl={backendBApiUrl}
              onGenerate={(promptText, files, options) => {
                setViewMode('chat');
                
                // ★追加: スタジオでの設定をアプリ全体の検索設定に同期させる
                if (options?.searchSettings) {
                  setSearchSettings(options.searchSettings);
                }

                // ★追加: 生成開始と同時にスライドパネルを準備
                setActiveArtifact({ type: 'json_slide', label: 'プレゼンスライド' });
                // ★追加: artifactオプションおよびChatInputからのoptionsをマージして送信
                handleSendMessageInternal(promptText, files || [], { 
                  ...(options || {}),
                  artifact: { requested: true, type: 'json_slide', label: 'プレゼンスライド' } 
                });
              }}
            />
          </motion.div>
        ) : (viewMode === 'welcome' && !isHistoryLoading) ? (
          <motion.div key="welcome" {...transitionProps} className="chat-view-container">
            <WelcomeScreen
              userName={userName}
              onSendMessage={handleSendMessageInternal}
              onStartTutorial={onStartTutorial}
              isGenerating={isGenerating}
              activeContextFiles={activeContextFiles}
              setActiveContextFiles={setActiveContextFiles}
              searchSettings={searchSettings}
              setSearchSettings={setSearchSettings}
              onOpenConfig={onOpenConfig}
              mockMode={mockMode}
              backendBApiKey={backendBApiKey}
              backendBApiUrl={backendBApiUrl}
              activeArtifact={activeArtifact}
              setActiveArtifact={setActiveArtifact}
              sendKey={sendKey}
              restoreText={restoreText || wizardText}
              onRestoreTextConsumed={handleRestoreTextConsumed}
              onWizardComplete={handleWizardComplete}
              onEnterSlideStudio={() => setViewMode('ai_slide_studio')}
            />
          </motion.div>
        ) : (
          /* Loading or Chat view - Integrated into one container to prevent double animation */
          <motion.div key="chat-main" {...transitionProps} className="chat-view-container">
            {isHistoryLoading ? (
              <HistorySkeleton userName={userName} />
            ) : (
              <ChatHistory
                messages={messages}
                streamingMessage={streamingMessage}
                onSuggestionClick={handleSuggestionClick}
                onSmartActionSelect={handleSmartActionSelect}
                isLoading={isGenerating}
                onSendMessage={handleSendMessageInternal}
                onOpenConfig={onOpenConfig}
                onOpenArtifact={onOpenArtifact}
                userName={userName}
                onEdit={handleEdit}
                onRegenerate={handleRegenerate}
                autoScroll={autoScrollEnabled}
                onAutoScrollChange={setAutoScrollEnabled}
                onOpenTableModal={handleOpenTableModal}
                onQuote={(text) => setQuoteContext(text)}
                // ★追加: リトライステータスの伝播
                activeError={activeError}
                retryCountdown={retryCountdown}
                isRetrying={isRetrying}
                retryCount={retryCount}
              />
            )}
            <div className="bottom-controls-wrapper">
              <ScrollToBottomButton
                visible={!autoScrollEnabled}
                onClick={handleScrollToBottom}
              />
              <ChatInput
                isLoading={isHistoryLoading || isGenerating}
                isHistoryLoading={isHistoryLoading}
                onSendMessage={handleSendMessageInternal}
                isCentered={false}
                activeContextFiles={activeContextFiles}
                setActiveContextFiles={setActiveContextFiles}
                searchSettings={searchSettings}
                setSearchSettings={setSearchSettings}
                isStreaming={isGenerating && !!streamingMessage}
                onStop={stopGeneration}
                mockMode={mockMode}
                backendBApiKey={backendBApiKey}
                backendBApiUrl={backendBApiUrl}
                quote={quoteContext}
                onRemoveQuote={() => setQuoteContext(null)}
                activeArtifact={activeArtifact}
                setActiveArtifact={setActiveArtifact}
                sendKey={sendKey}
                restoreText={restoreText || wizardText}
                onRestoreTextConsumed={handleRestoreTextConsumed}
                isShieldActive={isShieldActive}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tableContent={tableContent}
      />

      {(() => {
        const currentArtifactType = openedArtifact?.type || streamingMessage?.artifact?.artifact_type;
        const isJsonSlide = currentArtifactType === 'json_slide' || currentArtifactType === 'json_slide_advanced';
        const isJsonDocument = currentArtifactType === 'json_document';

        // ★追加: Artifactを識別するためのキー。切り替え時に再マウントを強制する
        const artifactKey = openedArtifact 
          ? `${openedArtifact.messageId || 'fixed'}-${openedArtifact.type}-${openedArtifact.title}`
          : (streamingMessage ? `streaming-${streamingMessage.id || streamingMessage.messageId}` : 'idle');

        return (
          <>
            <JsonSlidePanel
              key={`json-slide-${artifactKey}`}
              isOpen={isArtifactOpen && isJsonSlide}
              onClose={closeArtifact}
              artifact={openedArtifact}
              streamingMessage={streamingMessage}
            />
            <JsonDocumentPanel
              key={`json-doc-${artifactKey}`}
              isOpen={isArtifactOpen && isJsonDocument}
              onClose={closeArtifact}
              artifact={openedArtifact}
              streamingMessage={streamingMessage}
            />
            <ArtifactPanel
              key={`generic-art-${artifactKey}`}
              isOpen={isArtifactOpen && !isJsonSlide && !isJsonDocument}
              onClose={closeArtifact}
              artifact={openedArtifact}
              streamingMessage={streamingMessage}
              onQuoteSelect={(text) => setQuoteContext(text)}
            />
          </>
        );
      })()}
    </div>
  );
};

export default ChatArea;