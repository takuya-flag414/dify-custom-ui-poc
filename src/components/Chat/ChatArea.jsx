// src/components/Chat/ChatArea.jsx
import React, { useState, useCallback } from 'react';
import '../../App.css';
import './ChatArea.css';
import { extractPlainText } from '../../utils/messageSerializer';

import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import HistorySkeleton from './HistorySkeleton';
import WelcomeScreen from './WelcomeScreen';
import ScrollToBottomButton from './ScrollToBottomButton';
import TableModal from '../Shared/TableModal';
import ArtifactPanel from '../Artifacts/ArtifactPanel';


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
  } = props;

  // ★追加: 自動スクロール有効状態管理
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);

  // ★追加: Contextual Quote (文脈引用) の状態管理
  const [quoteContext, setQuoteContext] = useState(null);

  // ★追加: Table Modalの状態管理をChatAreaに持ち上げ
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableContent, setTableContent] = useState(null);

  // ★追加: Artifactの状態管理をChatAreaに持ち上げ（WelcomeScreenからの遷移で消滅しないようにするため）
  const [activeArtifact, setActiveArtifact] = useState(null);

  // ★変更: 履歴ロード完了時に、直前のユーザーメッセージからArtifact状態を復元する
  const prevIsHistoryLoading = React.useRef(isHistoryLoading);
  React.useEffect(() => {
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
            // JSONパースエラー時は無視（通常のプレーンテキスト等の場合）
          }
        }
      }
      setActiveArtifact(restoredArtifact);
    } else if (isHistoryLoading && !prevIsHistoryLoading.current) {
      // ロード開始時
      setActiveArtifact(null);
    }
    prevIsHistoryLoading.current = isHistoryLoading;
  }, [isHistoryLoading, messages]);

  const handleOpenTableModal = useCallback((content) => {
    setTableContent(content);
    setIsTableModalOpen(true);
  }, []);

  // 初期化時にpropsの値をセット
  React.useEffect(() => {
    setAutoScrollEnabled(autoScroll);
  }, [autoScroll]);

  // 初期状態: メッセージ0件 かつ 履歴ロード中でない
  const isInitialState = messages.length === 0 && !isHistoryLoading;

  const handleSuggestionClick = useCallback((q) => {
    onSendMessage(q, []);
  }, [onSendMessage]);

  const handleSmartActionSelect = useCallback((action) => {
    // LLMによってアンダースコアが省かれるケースがあるため正規化する
    const normalizedType = action.type ? action.type.replace(/_/g, '').toLowerCase() : '';

    switch (normalizedType) {
      case 'suggestedquestion':
        if (action.payload?.text) {
          onSendMessage(action.payload.text, []);
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
            onSendMessage(textToSend, []);
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
            onSendMessage(textToSend, []);
          }, 100);
        }
        break;

      case 'deepdive':
        if (action.payload?.text) {
          // LLMが生成したpayload.textを直接送信（自然な質問文）
          onSendMessage(action.payload.text, []);
        }
        break;

      case 'navigate':
        if (action.payload?.url) {
          window.open(action.payload.url, '_blank', 'noopener,noreferrer');
        }
        break;

      case 'selection':
        if (action.payload?.text) {
          onSendMessage(action.payload.text, []);
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
        onSendMessage(artifactText, [], { artifact: { requested: true, type: artifactType, label: displayLabel } });
        break;
      }

      default:
        console.warn('Unknown smart action type:', action.type);
    }
  }, [messages, onSendMessage, setSearchSettings, setActiveArtifact]);

  // ★追加: ボタンクリック時のハンドラ
  const handleScrollToBottom = () => {
    setAutoScrollEnabled(true);
  };

  return (
    <div className={`chat-area${isInitialState ? ' chat-area-initial' : ''} ${isArtifactOpen ? 'artifact-open' : ''}`}>
      {isHistoryLoading ? (
        <>
          <HistorySkeleton userName={userName} />
          <div className="bottom-controls-wrapper">
            <ChatInput
              isLoading={true}
              isHistoryLoading={true}
              onSendMessage={() => { }}
              isCentered={false}
              activeContextFiles={activeContextFiles}
              setActiveContextFiles={setActiveContextFiles}
              searchSettings={searchSettings}
              setSearchSettings={setSearchSettings}
              mockMode={mockMode}
              backendBApiKey={backendBApiKey}
              backendBApiUrl={backendBApiUrl}
            />
          </div>
        </>
      ) : isInitialState ? (
        <WelcomeScreen
          userName={userName}
          onSendMessage={onSendMessage}
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
          activeArtifact={activeArtifact} // ★追加
          setActiveArtifact={setActiveArtifact} // ★追加
        />
      ) : (
        <>
          <ChatHistory
            messages={messages}
            streamingMessage={streamingMessage}
            onSuggestionClick={handleSuggestionClick}
            onSmartActionSelect={handleSmartActionSelect}
            isLoading={isGenerating}
            onSendMessage={onSendMessage}
            onOpenConfig={onOpenConfig}
            onOpenArtifact={onOpenArtifact}
            userName={userName}
            onEdit={handleEdit}
            onRegenerate={handleRegenerate}
            autoScroll={autoScrollEnabled} // ★変更: stateを渡す
            onAutoScrollChange={setAutoScrollEnabled} // ★追加: state更新関数を渡す
            onOpenTableModal={handleOpenTableModal} // ★追加: Table Modalを開くハンドラ
            onQuote={(text) => setQuoteContext(text)} // ★追加: 引用用ハンドラ
          />
          <div className="bottom-controls-wrapper">
            {/* ★追加: ScrollToBottomButton */}
            <ScrollToBottomButton
              visible={!autoScrollEnabled}
              onClick={handleScrollToBottom}
            />
            <ChatInput
              isLoading={isGenerating}
              onSendMessage={onSendMessage}
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
              quote={quoteContext} // ★追加: 引用テキスト
              onRemoveQuote={() => setQuoteContext(null)} // ★追加: 引用クリアハンドラ
              activeArtifact={activeArtifact} // ★追加
              setActiveArtifact={setActiveArtifact} // ★追加
            />
          </div>
        </>
      )}

      {/* ★追加: Table Fullscreen ModalをChatAreaのルートレベルでレンダリング */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tableContent={tableContent}
      />

      {/* ★追加: streamingMessage を渡す */}
      <ArtifactPanel
        isOpen={isArtifactOpen}
        onClose={closeArtifact}
        artifact={openedArtifact}
        streamingMessage={streamingMessage}
      />
    </div>
  );
};

export default ChatArea;