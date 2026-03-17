// src/routes/ChatView.jsx
// /chat と /chat/:conversationId の両方を処理するラッパーコンポーネント
// URLパラメータ ↔ useConversations の conversationId を双方向同期する

import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatArea from '../components/Chat/ChatArea';

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

const ChatView = ({
    messages,
    streamingMessage,
    setMessages,
    isGenerating,
    isHistoryLoading,
    conversationId,
    setConversationId,
    addLog,
    handleConversationCreated,
    activeContextFiles,
    setActiveContextFiles,
    handleSendMessage,
    searchSettings,
    setSearchSettings,
    onOpenConfig,
    openArtifact,
    isArtifactOpen,
    closeArtifact,
    activeArtifact,
    effectiveDisplayName,
    startTutorial,
    stopGeneration,
    handleEdit,
    handleRegenerate,
    mockMode,
    backendBApiKey,
    backendBApiUrl,
}) => {
    const { conversationId: urlConversationId } = useParams();
    const navigate = useNavigate();

    // URL → State 同期: URLパラメータが変わったら conversationId を更新
    const prevUrlIdRef = useRef(urlConversationId);
    useEffect(() => {
        if (urlConversationId !== prevUrlIdRef.current) {
            prevUrlIdRef.current = urlConversationId;
        }

        if (urlConversationId) {
            // /chat/:conversationId → その会話を選択
            if (conversationId !== urlConversationId) {
                setConversationId(urlConversationId);
            }
        } else {
            // /chat → 新規チャット（conversationId をクリア）
            if (conversationId !== null) {
                setConversationId(null);
            }
        }
    }, [urlConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

    // State → URL 同期: 新規チャットで会話IDが生成された時にURLを更新
    const prevConvIdRef = useRef(conversationId);
    useEffect(() => {
        // conversationId が null → 新しいID に変わった場合（新規会話作成）
        if (
            conversationId &&
            prevConvIdRef.current === null &&
            conversationId !== urlConversationId
        ) {
            // ★ サイレントURL更新: React Routerを経由せず、ブラウザのHistory APIを直接使用
            // Routes再マウント・AnimatePresence再発火を完全に回避し、
            // 新規チャット開始時のスムーズさを維持する
            // ※「新しいチャット」ボタン押下時はSidebar側でsetConversationId(null)を
            //   明示的に呼ぶことでWelcomeScreen遷移を保証する
            window.history.replaceState(null, '', `/chat/${conversationId}`);
        }
        prevConvIdRef.current = conversationId;
    }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <motion.div
            key={`chat-view-${urlConversationId || 'new'}`}
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
                onOpenConfig={onOpenConfig}
                onOpenArtifact={openArtifact}
                isArtifactOpen={isArtifactOpen}
                closeArtifact={closeArtifact}
                activeArtifact={activeArtifact}
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
    );
};

export default ChatView;
