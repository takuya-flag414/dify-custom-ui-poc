/**
 * InputCanvas - リッチテキスト入力キャンバス
 *
 * ContentEditable方式を採用し、プレーンテキストの軽快さを保ちつつ
 * Mention Pill（ファイルメンションバッジ）の装飾を実現する。
 *
 * ★改修: <textarea> → <div contentEditable="true"> に移行
 * - useMention フックによるファイルメンション機能の統合
 * - IME（日本語入力）対応: compositionstart/end でメンション検知を一時停止
 * - 送信時のシリアライズ: getPlainTextWithMentions() でプレーンテキストに変換
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { useMention } from '../../../hooks/useMention';
import MentionPopover from './MentionPopover';

const InputCanvas = ({
    text,
    onChange,
    onKeyDown,
    disabled,
    placeholder,
    isHistoryLoading,
    autoFocus = true,
    focusTrigger, // 動的にフォーカスを当てるためのトリガー
    availableFiles = [], // ★追加: メンション候補ファイル一覧
    onTextExtract, // ★追加: プレーンテキスト抽出関数を親に公開
}) => {
    const editorRef = useRef(null);
    const containerRef = useRef(null);
    // 内部的にテキスト変更を追跡するフラグ（プログラム的な更新とユーザー入力を区別）
    const isInternalUpdateRef = useRef(false);

    // useMention フック
    const mention = useMention(availableFiles);

    // テキスト抽出関数を親に公開（送信時にプレーンテキストを取得するため）
    useEffect(() => {
        if (onTextExtract) {
            onTextExtract(() => {
                if (editorRef.current) {
                    return mention.getPlainTextWithMentions(editorRef.current);
                }
                return '';
            });
        }
    }, [onTextExtract, mention.getPlainTextWithMentions]);

    // Auto-resize: ContentEditableの自然な高さに制限
    const adjustHeight = useCallback(() => {
        if (editorRef.current) {
            const el = editorRef.current;
            // min-height: 24px, max-height: 200px
            el.style.height = 'auto';
            const scrollHeight = el.scrollHeight;
            el.style.height = `${Math.min(scrollHeight, 200)}px`;
            el.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
        }
    }, []);

    // text Prop が外部から変更された場合の同期（例: 送信後のクリア）
    useEffect(() => {
        if (editorRef.current && !isInternalUpdateRef.current) {
            const currentText = mention.getPlainTextWithMentions(editorRef.current);
            if (text !== currentText) {
                // 外部からのリセット（送信後の空文字セット等）
                if (text === '' || text === undefined) {
                    editorRef.current.innerHTML = '';
                    mention.resetMention();
                }
                // テキストが外部で設定された場合
                else if (editorRef.current.textContent !== text) {
                    editorRef.current.textContent = text;
                }
                adjustHeight();
            }
        }
        isInternalUpdateRef.current = false;
    }, [text, mention, adjustHeight]);

    // focusTriggerが変化した時にフォーカスする
    useEffect(() => {
        if (focusTrigger && editorRef.current && !disabled && !isHistoryLoading) {
            editorRef.current.focus();
        }
    }, [focusTrigger, disabled, isHistoryLoading]);

    // 初期フォーカス
    useEffect(() => {
        if (autoFocus && editorRef.current && !disabled) {
            editorRef.current.focus();
        }
    }, [autoFocus, disabled]);

    /**
     * onInput イベントハンドラ
     * ContentEditableのテキスト変更を親に通知
     */
    const handleInput = useCallback(() => {
        if (!editorRef.current) return;

        // メンションフックに入力イベントを通知
        mention.handleInput(editorRef.current);

        // 親コンポーネントにテキスト変更を通知
        const plainText = mention.getPlainTextWithMentions(editorRef.current);
        isInternalUpdateRef.current = true;
        onChange({ target: { value: plainText } });

        adjustHeight();
    }, [mention, onChange, adjustHeight]);

    /**
     * onKeyDown イベントハンドラ
     * メンション操作を優先し、それ以外は親にバブルアップ
     */
    const handleKeyDown = useCallback((e) => {
        // IME入力中はスキップ
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;

        // メンション操作を優先処理
        if (mention.handleKeyDown(e, editorRef.current)) {
            // メンションがイベントを消費した → 親に伝搬しない
            return;
        }

        // メンションが処理しなかった → 既存のキーハンドラ（Enter送信等）を実行
        if (onKeyDown) {
            onKeyDown(e);
        }
    }, [mention, onKeyDown]);

    /**
     * IME対応: compositionstart/end
     */
    const handleCompositionStart = useCallback(() => {
        mention.setIsComposing(true);
    }, [mention]);

    const handleCompositionEnd = useCallback(() => {
        mention.setIsComposing(false);
        // IME確定後にメンション検知を再開
        if (editorRef.current) {
            mention.handleInput(editorRef.current);
        }
    }, [mention]);

    /**
     * ペースト処理: プレーンテキストのみ受け付ける（リッチテキストの混入防止）
     */
    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        // プレーンテキストとして挿入
        document.execCommand('insertText', false, text);
    }, []);

    /**
     * メンション確定時のコールバック
     */
    const handleMentionSelect = useCallback((file) => {
        if (editorRef.current) {
            mention.confirmMention(file, editorRef.current);

            // 親にテキスト変更を通知
            const plainText = mention.getPlainTextWithMentions(editorRef.current);
            isInternalUpdateRef.current = true;
            onChange({ target: { value: plainText } });
        }
    }, [mention, onChange]);

    // プレースホルダーの表示判定
    const showPlaceholder = !text || text.trim() === '';
    const placeholderText = isHistoryLoading
        ? '履歴を読み込み中...'
        : placeholder || 'AIに相談...';

    return (
        <div
            className="w-full flex-grow relative px-4 py-3 group"
            ref={containerRef}
            style={{ position: 'relative' }}
        >
            {/* プレースホルダー（ContentEditableには::placeholder が使えないため自前実装） */}
            {showPlaceholder && (
                <div
                    className="absolute left-4 top-3 pointer-events-none text-gray-400 dark:text-gray-500 select-none"
                    style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        fontFamily: '"SF Pro Text", -apple-system, sans-serif',
                    }}
                >
                    {placeholderText}
                </div>
            )}

            {/* ContentEditable 入力エリア */}
            <div
                ref={editorRef}
                contentEditable={!disabled}
                role="textbox"
                aria-multiline="true"
                aria-placeholder={placeholderText}
                suppressContentEditableWarning={true}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onPaste={handlePaste}
                className={`
                    w-full resize-none bg-transparent outline-none
                    text-[15px] leading-relaxed
                    text-gray-900 dark:text-gray-100
                    custom-scrollbar
                    transition-all duration-200 ease-out
                    mention-editor
                `}
                style={{
                    minHeight: '32px',
                    maxHeight: '200px',
                    fontFamily: '"SF Pro Text", -apple-system, sans-serif',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    overflowX: 'hidden',
                }}
            />

            {/* メンションポップオーバー */}
            <MentionPopover
                show={mention.showPopover}
                files={mention.filteredFiles}
                selectedIndex={mention.selectedIndex}
                position={mention.popoverPosition}
                query={mention.mentionQuery}
                onSelect={handleMentionSelect}
                containerRef={containerRef}
            />
        </div>
    );
};

export default InputCanvas;
