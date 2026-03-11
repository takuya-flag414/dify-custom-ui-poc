import React, { useEffect, useRef } from 'react';

const InputCanvas = ({
    text,
    onChange,
    onKeyDown,
    disabled,
    placeholder,
    isHistoryLoading,
    autoFocus = true,
    focusTrigger // ★追加: 動的にフォーカスを当てるためのトリガー
}) => {
    const textareaRef = useRef(null);

    // Auto-resize logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [text]);

    // ★追加: focusTriggerが変化した（例：引用がセットされた）時にフォーカスする
    useEffect(() => {
        if (focusTrigger && textareaRef.current && !disabled && !isHistoryLoading) {
            textareaRef.current.focus();
        }
    }, [focusTrigger, disabled, isHistoryLoading]);

    return (
        <div className="w-full flex-grow relative px-4 py-3 group">
            {/* Dimming effect background (Logic to be implemented if needed, currently implied by container styles) */}
            
            <textarea
                ref={textareaRef}
                value={text}
                onChange={onChange}
                onKeyDown={onKeyDown}
                disabled={disabled}
                placeholder={isHistoryLoading ? "履歴を読み込み中..." : placeholder || "Message..."}
                rows={1}
                autoFocus={autoFocus}
                className={`
                    w-full resize-none bg-transparent outline-none
                    text-[15px] leading-relaxed
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-500
                    overflow-y-auto custom-scrollbar
                    transition-all duration-200 ease-out
                `}
                style={{
                    minHeight: '24px',
                    maxHeight: '200px',
                    fontFamily: '"SF Pro Text", -apple-system, sans-serif'
                }}
            />
        </div>
    );
};

export default InputCanvas;
