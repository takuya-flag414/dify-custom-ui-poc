// src/components/Sidebar/DeletePopover.jsx
import React, { useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './DeletePopover.css';

/**
 * 削除確認ポップオーバー
 * React Portalを使用してbody直下に描画し、サイドバーのoverflow回避
 */
const DeletePopover = ({
    isOpen,
    anchorRect, // クリックしたアイコンの座標情報 (getBoundingClientRect)
    onClose,
    onConfirm,
    conversationName
}) => {
    const popoverRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // 表示位置の計算 (レンダリング直前に実行)
    useLayoutEffect(() => {
        if (!isOpen || !anchorRect || !popoverRef.current) return;

        const popover = popoverRef.current;
        const { innerWidth, innerHeight } = window;
        const POPOVER_WIDTH = 280; // CSSと合わせる
        const GAP = 12;

        // 基本位置: アイコンの右側、上揃え
        let top = anchorRect.top - 10; // 少し上にずらしてバランスを取る
        let left = anchorRect.right + GAP;

        // 画面右端からはみ出る場合、左側に表示
        if (left + POPOVER_WIDTH > innerWidth) {
            left = anchorRect.left - POPOVER_WIDTH - GAP;
        }

        // 画面下端からはみ出る場合、上にずらす
        if (top + popover.offsetHeight > innerHeight) {
            top = innerHeight - popover.offsetHeight - GAP;
        }

        setPosition({ top, left });
    }, [isOpen, anchorRect]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 透明なバックドロップ（外側クリックで閉じる用） */}
                    <div className="popover-backdrop" onClick={onClose} />

                    {/* ポップオーバー本体 */}
                    <motion.div
                        ref={popoverRef}
                        className="delete-popover"
                        style={{ top: position.top, left: position.left }}
                        initial={{ opacity: 0, scale: 0.96, x: -8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        onClick={(e) => e.stopPropagation()} // ポップオーバー内のクリックは伝播させない
                    >
                        <div className="popover-content">
                            <h4 className="popover-title">削除しますか？</h4>
                            <p className="popover-desc">
                                「{conversationName}」<br />
                                この操作は取り消せません。
                            </p>

                            <div className="popover-actions">
                                <button className="popover-btn cancel" onClick={onClose}>
                                    キャンセル
                                </button>
                                <button className="popover-btn delete" onClick={onConfirm}>
                                    削除
                                </button>
                            </div>
                        </div>

                        {/* 吹き出しのしっぽ（装飾的要素、左配置の場合のみ表示などの制御はCSSで簡易化） */}
                        <div className="popover-arrow" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body // body直下にレンダリング
    );
};

export default DeletePopover;