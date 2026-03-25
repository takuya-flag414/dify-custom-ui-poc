// src/components/Message/MessageBlock.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MessageBlock.css';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
import SmartActionGroup from './SmartActionGroup';
import ThinkingProcess from './ThinkingProcess';
import SkeletonLoader from './SkeletonLoader';
import AiKnowledgeBadge from './AiKnowledgeBadge';
import TokenUsageIndicator from './TokenUsageIndicator';
import FileIcon from '../Shared/FileIcon';
import ContextChips from './ContextChips';
import CopyButton from '../Shared/CopyButton';
import TypewriterEffect from '../Shared/TypewriterEffect';
import StructuredUserMessage from './StructuredUserMessage';
import { parseStructuredMessage, extractPlainText } from '../../utils/messageSerializer';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import ArtifactCard from '../Artifacts/ArtifactCard';

// ★追加: 引用アイコン
const ReplyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l8-8v4.5A11.5 11.5 0 0 1 22 18.5c-2.5-3-6-4.5-11-4.5V19l-8-8z" />
    </svg>
);

// Spring Physics (DESIGN_RULE準拠)
const SPRING_CONFIG = {
    type: "spring",
    stiffness: 170,
    damping: 26,
    mass: 1
};

// メッセージ出現アニメーション
const MESSAGE_VARIANTS = {
    initial: { opacity: 0, y: 20, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.96 }
};

export const AssistantIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
    </svg>
);

// ★追加: 編集アイコン (鉛筆) - CopyButtonと同じサイズ16x16
const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

// ★追加: 再送信アイコン (回転矢印) - CopyButtonと同じサイズ16x16
const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const MessageBlock = ({
    message,
    previousMessage, // Receive previousMessage
    onSuggestionClick,
    onSmartActionSelect,
    onOpenArtifact,
    userName,
    enableAnimation = true,
    // ★追加: 編集・再送信用Props
    onEdit,
    onRegenerate,
    isLastAiMessage = false,  // 再送信ボタンを表示するかどうかの制御
    onOpenTableModal, // ★追加: Table Modalを開くハンドラ
    onQuote // ★追加: 引用ハンドラ
}) => {
    const {
        role,
        text,
        rawContent,
        citations,
        suggestions,
        smartActions,
        isStreaming,
        thoughtProcess,
        thinking,  // ★追加: Chain-of-Thought
        files,
        traceMode,
        messageId,
        id,
        mode, // 'fast' | 'normal'
        // ★追加: ワークフローエラー情報
        hasWorkflowError,
        workflowError,
        usedHttpLlmSearch,
        artifact // ★追加: Artifact情報
    } = message;

    // ★移動: isAi/isUserの定義を先頭に（タイプライター制御で参照するため）
    const isAi = role === 'ai';
    const isUser = role === 'user';

    const [showRaw, setShowRaw] = useState(false);
    // ★追加: 編集モード用State
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(() => {
        if (!isAi) {
            const parsed = parseStructuredMessage(text);
            return parsed.content.text;
        }
        return text;
    });

    // contentプロップが変更された場合にeditValueを更新（通常は起きないが念のため）
    useEffect(() => {
        if (!isEditing) {
            if (!isAi) {
                const parsed = parseStructuredMessage(text);
                setEditValue(parsed.content.text);
            } else {
                setEditValue(text);
            }
        }
    }, [text, isAi, isEditing]);
    const editTextareaRef = useRef(null);

    // ★追加: タイプライター演出の制御
    // - usedHttpLlmSearchがtrue かつ isStreamingがfalse（新規完了メッセージ）の場合のみタイプライター開始
    // - hasStartedTypewriterRefで初回マウント時のみタイプライター開始を許可
    const hasStartedTypewriterRef = useRef(false);
    const shouldPlayTypewriter = usedHttpLlmSearch && isAi && !isStreaming && !hasStartedTypewriterRef.current;

    // 初回マウント時にタイプライター開始フラグを設定
    useEffect(() => {
        if (usedHttpLlmSearch && isAi && !isStreaming) {
            hasStartedTypewriterRef.current = true;
        }
    }, [usedHttpLlmSearch, isAi, isStreaming]);

    // ★タイプライター演出完了ステート
    // - usedHttpLlmSearchがfalseの場合は最初から完了状態
    // - usedHttpLlmSearchがtrueでも既にマウント済みの場合は完了状態（履歴メッセージ）
    const [isTypewriterComplete, setIsTypewriterComplete] = useState(() => {
        // 初期化時にusedHttpLlmSearchでなければ完了状態
        if (!usedHttpLlmSearch) return true;
        // usedHttpLlmSearchで、かつストリーミング中（まだ処理中）なら完了状態
        if (isStreaming) return true;
        // 新規完了メッセージの場合はタイプライターを開始（未完了状態）
        return false;
    });

    useEffect(() => {
        if (!isStreaming) {
            setShowRaw(false);
        }
    }, [isStreaming]);

    // ★追加: 編集モード開始時にTextareaにフォーカス
    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
            editTextareaRef.current.focus();
            // カーソルを末尾に移動
            editTextareaRef.current.setSelectionRange(editValue.length, editValue.length);
        }
    }, [isEditing, editValue.length]);

    // ★追加: テキスト選択とポップオーバーの状態管理
    const [selectionState, setSelectionState] = useState({
        text: '',
        visible: false,
        x: 0,
        y: 0
    });
    const messageContentRef = useRef(null);
    const isSelectingRef = useRef(false);

    // ★追加: 選択範囲の検知と位置計算
    const handleSelectionChange = useCallback(() => {
        // AIメッセージのみ、かつストリーミングが完了している場合のみ許可
        if (!isAi || isStreaming) return;

        // ドラッグ中（選択操作中）はポップオーバーを更新しない
        if (isSelectingRef.current) return;

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && messageContentRef.current && messageContentRef.current.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = messageContentRef.current.getBoundingClientRect();

            // 画面外の場合は表示しない
            if (rect.width === 0 || rect.height === 0) return;

            setSelectionState({
                text: selectedText,
                visible: true,
                x: rect.left - containerRect.left + rect.width / 2, // Container基準のX座標
                y: rect.top - containerRect.top - 8 // Container基準のY座標 (テキストの少し上。FramerMotion側で translate(-50%, -100%) されているので、これで上に乗る形になります)
            });
        } else {
            setSelectionState(prev => prev.visible ? { ...prev, visible: false } : prev);
        }
    }, [isAi, isStreaming]);

    useEffect(() => {
        const handleMouseDown = () => {
            isSelectingRef.current = true;
            // 新たに選択を開始する場合は、現在のポップオーバーを隠す
            setSelectionState(prev => prev.visible ? { ...prev, visible: false } : prev);
        };

        const handleMouseUp = () => {
            isSelectingRef.current = false;
            // 選択確定後に少しだけ遅延を入れてから（JSのコールスタックの最後で）選択状態を評価する
            setTimeout(handleSelectionChange, 10);
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        // スクロールやリサイズで選択範囲がずれるため非表示にする
        window.addEventListener('scroll', handleSelectionChange, true);
        window.addEventListener('resize', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('scroll', handleSelectionChange, true);
            window.removeEventListener('resize', handleSelectionChange);
        };
    }, [handleSelectionChange]);

    const handleReplyClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuote && selectionState.text) {
            onQuote(selectionState.text);
            // 選択解除
            window.getSelection().removeAllRanges();
            setSelectionState(prev => ({ ...prev, visible: false }));
        }
    }, [onQuote, selectionState.text]);
    const uniqueMessageId = messageId || id || `msg_${Date.now()}`;
    const isTextEmpty = !text || text.length === 0;
    const showCitations = (traceMode === 'search' || traceMode === 'document') || (citations && citations.length > 0);
    const showKnowledgeBadge = isAi && !isStreaming && traceMode === 'knowledge';

    // ★修正: ユーザーメッセージの場合はJSONプロトコルからプレーンテキストを抽出してコピー
    const textToCopy = isUser ? extractPlainText(text || '') : (text || '');

    // ★追加: パース済みの構造化メッセージから引用文を抽出
    let extractedQuote = null;
    if (isUser && text) {
        try {
            const parsed = parseStructuredMessage(text);
            if (parsed && parsed.v && parsed.v !== "0.0" && parsed.quote) {
                extractedQuote = parsed.quote;
            }
        } catch (e) { }
    }

    // ★追加: 編集開始
    const handleStartEdit = useCallback(() => {
        if (!isAi) {
            setEditValue(extractPlainText(text || ''));
        } else {
            setEditValue(text || '');
        }
        setIsEditing(true);
    }, [text, isAi]);

    // ★追加: 編集確定
    const handleConfirmEdit = useCallback(() => {
        if (onEdit && editValue.trim()) {
            onEdit(id, editValue.trim());
        }
        setIsEditing(false);
        setEditValue('');
    }, [onEdit, id, editValue]);

    // ★追加: 編集キャンセル
    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setEditValue('');
    }, []);

    // ★追加: 編集テキストエリアのキーハンドラ
    const handleEditKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleConfirmEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    }, [handleConfirmEdit, handleCancelEdit]);

    // ★追加: 編集テキストエリアの外部クリック
    const handleEditBlur = useCallback((e) => {
        // relatedTargetがnullまたは編集領域外の場合のみキャンセル
        if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
            handleCancelEdit();
        }
    }, [handleCancelEdit]);

    // ★変更: ストリーミング中もDOMを維持（レイアウトシフト防止）
    const renderCopyButton = () => {
        if (isTextEmpty && !isStreaming) return null;
        return (
            <CopyButton
                text={textToCopy}
                isAi={isAi}
                className={`${isAi ? 'copy-btn-ai' : 'copy-btn-user'} ${isStreaming ? 'hidden-btn' : ''}`}
                disabled={isStreaming}
            />
        );
    };

    // ★追加: ユーザーメッセージの編集ボタン
    const renderEditButton = () => {
        if (isAi || isStreaming || isEditing) return null;
        return (
            <button
                className="message-edit-btn"
                onClick={handleStartEdit}
                title="メッセージを編集"
            >
                <EditIcon />
            </button>
        );
    };

    // ★追加: AI回答の再送信ボタン（アイコンのみ）
    // ストリーミング中もDOMを維持（レイアウトシフト防止）
    const renderRegenerateButton = () => {
        if (!isAi) return null;
        const isHidden = isStreaming || !isLastAiMessage || !onRegenerate;
        return (
            <button
                className={`message-regenerate-btn ${isHidden ? 'hidden-btn' : ''}`}
                onClick={isHidden ? undefined : onRegenerate}
                title="回答を再生成"
                disabled={isHidden}
            >
                <RefreshIcon />
            </button>
        );
    };

    return (
        <motion.div
            className="message-block"
            variants={enableAnimation ? MESSAGE_VARIANTS : undefined}
            initial={enableAnimation ? "initial" : false}
            animate="animate"
            exit={enableAnimation ? "exit" : undefined}
            transition={SPRING_CONFIG}
        >
            <div className={`message-container ${!isAi ? 'message-container-user' : ''} group`}>

                {/* AI: Mini Intelligence Orb, User: アバター */}
                {isAi ? (
                    <div className="ai-orb-indicator">
                        <div className={`mini-intelligence-orb ${isStreaming ? 'active' : 'idle'}`} />
                    </div>
                ) : (
                    <div className="avatar-user">
                        {userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                )}

                <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`} ref={messageContentRef}>

                    {/* ★新規: コンテキストチップをユーザー吹き出しの上に表示 */}
                    {isUser && !isEditing && (
                        <ContextChips message={message} previousMessage={previousMessage} />
                    )}

                    {/* ★追加: 引用の表示（吹き出しから分離して配置） */}
                    {isUser && !isEditing && extractedQuote && (
                        <div className="user-quote-reference">
                            <ReplyIcon />
                            <span>"{extractedQuote}"</span>
                        </div>
                    )}

                    <div className="message-bubble-row">
                        {/* ★変更: ユーザーメッセージ用のアクションボタン群 */}
                        {isUser && !isEditing && (
                            <div className="user-action-group">
                                {renderCopyButton()}
                                {renderEditButton()}
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                // ★追加: 編集モードのUI
                                <motion.div
                                    key="edit-mode"
                                    className="message-bubble user-bubble edit-mode"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={SPRING_CONFIG}
                                    onBlur={handleEditBlur}
                                >
                                    <textarea
                                        ref={editTextareaRef}
                                        className="edit-textarea"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={handleEditKeyDown}
                                        rows={Math.min(Math.max(editValue.split('\n').length, 1), 10)}
                                    />
                                    <div className="edit-actions">
                                        <button className="edit-cancel-btn" onClick={handleCancelEdit}>
                                            キャンセル
                                        </button>
                                        <button
                                            className="edit-confirm-btn"
                                            onClick={handleConfirmEdit}
                                            disabled={!editValue.trim()}
                                        >
                                            送信
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                // 通常表示モード
                                <motion.div
                                    key="normal-mode"
                                    className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}
                                    initial={false}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    {isAi && isStreaming && (
                                        <button
                                            className={`raw-toggle-btn ${showRaw ? 'active' : ''}`}
                                            onClick={() => setShowRaw(!showRaw)}
                                            title="生成中の生データを表示"
                                        >
                                            ⚡️ Raw
                                        </button>
                                    )}

                                    {/* ★削除: 添付ファイルUIはContextChipsに移行 */}

                                    {/* ストリーミング中はthoughtProcessが空でもローディングUIを表示するためThinkingProcessをレンダリング */}
                                    {isAi && (thoughtProcess?.length > 0 || thinking || isStreaming) && (
                                        <ThinkingProcess
                                            steps={thoughtProcess}
                                            isStreaming={isStreaming}
                                            thinkingContent={thinking}
                                            hasAnswer={!isTextEmpty}
                                        />
                                    )}

                                    {/* ★追加: ワークフローエラーバナー */}
                                    {isAi && hasWorkflowError && workflowError && (
                                        <div className="workflow-error-banner">
                                            <div className="workflow-error-icon">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                </svg>
                                            </div>
                                            <div className="workflow-error-content">
                                                <span className="workflow-error-title">
                                                    ワークフローエラー: {workflowError.nodeTitle}
                                                </span>
                                                <span className="workflow-error-message">
                                                    {workflowError.message}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* ★変更: Artifactカードを本文の上に表示。ただしストリーミング完了時かつ、タイトル/タイプが確定した場合のみ表示する */}
                                    {isAi && artifact && artifact.artifact_title && artifact.artifact_title !== 'Untitled' && (artifact.artifact_type || artifact.type) && (!isStreaming || isTypewriterComplete) && (
                                        <div style={{ marginBottom: isTextEmpty ? '0' : '16px' }}>
                                            <ArtifactCard
                                                title={artifact.artifact_title || artifact.label}
                                                type={artifact.artifact_type || artifact.type}
                                                content={artifact.artifact_content}
                                                citations={artifact.citations || citations || []}
                                                onClick={onOpenArtifact ? () => onOpenArtifact({
                                                    type: artifact.artifact_type || artifact.type,
                                                    label: artifact.artifact_title || artifact.label,
                                                    title: artifact.artifact_title || artifact.label,
                                                    content: artifact.artifact_content,
                                                    citations: artifact.citations || citations || []
                                                }) : undefined}
                                            />
                                        </div>
                                    )}

                                    {isAi && isStreaming && isTextEmpty && !showRaw && mode !== 'fast' && (
                                        <SkeletonLoader />
                                    )}

                                    {showRaw ? (
                                        <pre className="raw-content-view">
                                            {rawContent ? (
                                                rawContent
                                            ) : (
                                                <div className="raw-empty-state">
                                                    <span className="raw-cursor"></span>
                                                    <span className="raw-loading-text">AIからの応答を待機しています...</span>
                                                </div>
                                            )}
                                        </pre>
                                    ) : (
                                        !isTextEmpty && (() => {
                                            // 1. Typewriter Effect (AI Only, Special Mode)
                                            if (usedHttpLlmSearch && isAi && !isStreaming && !isTypewriterComplete) {
                                                return (
                                                    <TypewriterEffect
                                                        content={text || ''}
                                                        speed={5}
                                                        renderAsMarkdown={true}
                                                        citations={citations}
                                                        messageId={uniqueMessageId}
                                                        onComplete={() => setIsTypewriterComplete(true)}
                                                    />
                                                );
                                            }

                                            // 2. Structured User Message (User Only)
                                            if (!isAi) {
                                                const parsed = parseStructuredMessage(text || '');
                                                // v !== "0.0" means it's a valid structured message (not legacy)
                                                if (parsed.v && parsed.v !== "0.0") {
                                                    return (
                                                        <StructuredUserMessage
                                                            parsedMessage={parsed}
                                                            onOpenArtifact={onOpenArtifact}
                                                        />
                                                    );
                                                }
                                            }

                                            // 3. Standard Markdown (AI Normal / User Plain)
                                            // AIメッセージはフェードインアニメーション付きで表示
                                            // CSS animation forwards はDOMマウント時に一度だけ再生されるため、
                                            // ストリーミング中のテキスト更新でちらつくことはない
                                            const markdownElement = (
                                                <MarkdownRenderer
                                                    content={text || ''}
                                                    isStreaming={isAi && isStreaming}
                                                    renderMode={mode === 'fast' ? 'realtime' : 'normal'}
                                                    citations={citations}
                                                    messageId={uniqueMessageId}
                                                    onOpenArtifact={onOpenArtifact}
                                                    onOpenTableModal={onOpenTableModal} // ★追加: Propsの受け渡し
                                                />
                                            );
                                            if (isAi) {
                                                return <div className="ai-answer-fade-in">{markdownElement}</div>;
                                            }
                                            return markdownElement;
                                        })()
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ★追加: Selection Popover (Liquid Glass Style) */}
                        <AnimatePresence>
                            {selectionState.visible && (
                                <div
                                    className="selection-popover-wrapper"
                                    style={{
                                        position: 'absolute',
                                        left: `${selectionState.x}px`,
                                        top: `${selectionState.y}px`,
                                        transform: 'translate(-50%, -100%)',
                                        zIndex: 1000,
                                        pointerEvents: 'none' // ラッパーはクリックを妨害しない
                                    }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                                        className="selection-popover"
                                        style={{
                                            // DESIGN_RULE: Liquid Glass
                                            backdropFilter: 'blur(20px) saturate(180%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                            pointerEvents: 'auto' // 要素自体はクリック可能
                                        }}
                                        onMouseDown={(e) => {
                                            // ポップオーバー内クリックで選択が解除されないようにする
                                            e.preventDefault();
                                        }}
                                    >
                                        <button
                                            onClick={handleReplyClick}
                                            className="selection-reply-btn flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                                            style={{ fontFamily: '"SF Pro Text", -apple-system, sans-serif' }}
                                        >
                                            <ReplyIcon />
                                            <span>ここを質問</span>
                                        </button>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* ★変更: AIメッセージ用のアクションボタン群（コピー + 再生成） */}
                        {isAi && (
                            <div className="ai-action-group">
                                {renderCopyButton()}
                                {renderRegenerateButton()}
                            </div>
                        )}
                    </div>

                    {/* ★変更: タイプライター演出完了後にのみmessage-footerを表示 */}
                    {isAi && !isStreaming && isTypewriterComplete && (
                        <div className="message-footer">
                            {showCitations && <CitationList citations={citations} messageId={uniqueMessageId} />}
                            {showKnowledgeBadge && <AiKnowledgeBadge />}
                            {/* ★追加: トークン消費表示 */}
                            {message.usage && <TokenUsageIndicator usage={message.usage} />}
                            {/* ★変更: ENABLE_SMART_ACTIONSフラグで排他制御 */}
                            {FEATURE_FLAGS.ENABLE_SMART_ACTIONS ? (
                                /* SmartActionsが有効 → AIからの提案のみ表示、「関連する質問」は非表示 */
                                isLastAiMessage && smartActions && smartActions.length > 0 && (
                                    <SmartActionGroup actions={smartActions} onActionSelect={onSmartActionSelect} />
                                )
                            ) : (
                                /* SmartActionsが無効 → 「関連する質問」のみ表示 */
                                <SuggestionButtons suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ★修正: JSON.stringifyを排除し、高速な参照比較へ変更
const arePropsEqual = (prev, next) => {
    // 1. メッセージオブジェクト自体の参照が同じなら、中身は変わっていないとみなす（最速）
    if (prev.message === next.message) {
        // ただし、親から渡される関数Propsが変わっていないかチェック
        // (useCallbackされていれば、ここも等価になるはず)
        return prev.onSuggestionClick === next.onSuggestionClick
            && prev.onSmartActionSelect === next.onSmartActionSelect
            && prev.onOpenArtifact === next.onOpenArtifact
            && prev.enableAnimation === next.enableAnimation
            && prev.onEdit === next.onEdit
            && prev.onRegenerate === next.onRegenerate
            && prev.isLastAiMessage === next.isLastAiMessage
            && prev.onOpenTableModal === next.onOpenTableModal
            && prev.onQuote === next.onQuote;
    }

    // 2. 参照が違う場合（ストリーミング中の更新など）、必要なフィールドだけ浅く比較
    const p = prev.message;
    const n = next.message;

    // 主要なプリミティブ値の比較
    const isPrimitiveEqual =
        p.id === n.id
        && p.text === n.text
        && p.isStreaming === n.isStreaming
        && p.rawContent === n.rawContent
        && p.traceMode === n.traceMode
        && p.mode === n.mode; // Fast/Normalモード

    if (!isPrimitiveEqual) return false;

    // 配列・オブジェクトの比較（参照チェックのみで高速化）
    // ReactのState更新がイミュータブルに行われていれば、中身が変われば参照も変わるはず
    return p.citations === n.citations
        && p.suggestions === n.suggestions
        && p.smartActions === n.smartActions
        && p.thoughtProcess === n.thoughtProcess
        && p.thinking === n.thinking
        && p.files === n.files
        && p.hasWorkflowError === n.hasWorkflowError  // ★追加
        && p.workflowError === n.workflowError
        && p.usage === n.usage  // ★追加
        && p.artifact === n.artifact;  // ★追加
};

export default React.memo(MessageBlock, arePropsEqual);