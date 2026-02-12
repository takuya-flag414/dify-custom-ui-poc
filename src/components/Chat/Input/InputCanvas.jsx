import React, { useEffect, useRef } from 'react';

const InputCanvas = ({
    text,
    onChange,
    onKeyDown,
    disabled,
    placeholder,
    isHistoryLoading,
    autoFocus = true
}) => {
    const textareaRef = useRef(null);

    // Auto-resize logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [text]);

    return (
        <div className="w-full flex-grow relative px-4 py-3 group">
            {/* Dimming effect background (Logic to be implemented if needed, currently implied by container styles) */}

            <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none outline-none resize-none 
                    text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-gray-400 dark:placeholder-gray-600
                    text-[16px] leading-relaxed font-normal min-h-[28px] max-h-[200px]
                    transition-all duration-200 ease-in-out"
                placeholder={placeholder}
                value={text}
                onChange={onChange}
                onKeyDown={onKeyDown}
                disabled={disabled}
                rows={1}
                autoFocus={autoFocus && !isHistoryLoading}
                style={{
                    fontFamily: '"SF Pro Text", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif'
                }}
            />
        </div>
    );
};

export default InputCanvas;
