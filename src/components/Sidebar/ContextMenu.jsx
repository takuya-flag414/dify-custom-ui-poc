// src/components/Sidebar/ContextMenu.jsx
import React, { useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './ContextMenu.css';

const ContextMenu = ({
    isOpen,
    anchorRect, // 呼び出し元アイコンの座標
    onClose,
    onRename,
    onDelete,
}) => {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
        if (!isOpen || !anchorRect || !menuRef.current) return;

        const menu = menuRef.current;
        const { innerWidth, innerHeight } = window;
        const GAP = 8;

        // 基本位置: アイコンの右下
        let top = anchorRect.bottom + 2;
        let left = anchorRect.left;

        // 画面右端からはみ出る場合、左側に寄せる
        if (left + menu.offsetWidth > innerWidth) {
            left = anchorRect.right - menu.offsetWidth;
        }

        // 画面下端からはみ出る場合、上に表示
        if (top + menu.offsetHeight > innerHeight) {
            top = anchorRect.top - menu.offsetHeight - GAP;
        }

        setPosition({ top, left });
    }, [isOpen, anchorRect]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="context-menu-backdrop" onClick={onClose} />

                    <motion.div
                        ref={menuRef}
                        className="context-menu"
                        style={{ top: position.top, left: position.left }}
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Rename */}
                        <button className="context-menu-item" onClick={() => { onRename(); onClose(); }}>
                            <PencilIcon />
                            名前を変更
                        </button>

                        <div className="context-divider" />

                        {/* Delete */}
                        <button className="context-menu-item delete" onClick={() => { onDelete(); onClose(); }}>
                            <TrashIcon />
                            削除
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// --- Local Icons ---
const PencilIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

export default ContextMenu;