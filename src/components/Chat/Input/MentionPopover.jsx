/**
 * MentionPopover - ファイルメンション候補のポップオーバーUI
 *
 * DESIGN_RULE.md に準拠:
 * - mat-popover マテリアル（backdrop-filter: blur(40px) saturate(180%)）
 * - Spring Physics アニメーション（stiffness: 250, damping: 25）
 * - Inset Highlight パターンによる候補選択
 */
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileIcon from '../../Shared/FileIcon';
import './MentionPopover.css';

const MentionPopover = ({
  show = false,
  files = [],
  selectedIndex = 0,
  position = { x: 0, y: 0 },
  query = '',
  onSelect,
  containerRef, // InputCanvasのコンテナ参照（位置計算用）
}) => {
  const listRef = useRef(null);

  // 選択中のアイテムが見えるようにスクロール
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector('.mention-item.selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // コンテナからの相対位置を計算
  const getRelativePosition = () => {
    if (!containerRef?.current) {
      return { left: position.x, bottom: 20 };
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      left: Math.max(0, Math.min(position.x - containerRect.left, containerRect.width - 280)),
      bottom: containerRect.bottom - position.y + 8, // カーソルの上に表示
    };
  };

  const relPos = getRelativePosition();

  /**
   * ファイル名内のクエリ一致部分をハイライト表示
   */
  const highlightMatch = (filename, searchQuery) => {
    if (!searchQuery) return filename;

    const lowerName = filename.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const matchIndex = lowerName.indexOf(lowerQuery);

    if (matchIndex === -1) return filename;

    const before = filename.substring(0, matchIndex);
    const match = filename.substring(matchIndex, matchIndex + searchQuery.length);
    const after = filename.substring(matchIndex + searchQuery.length);

    return (
      <>
        {before}
        <span className="mention-highlight">{match}</span>
        {after}
      </>
    );
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="mention-popover"
          // DESIGN_RULE.md 第6章: Standard UI Transition
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 250, damping: 25 }}
          style={{
            position: 'absolute',
            left: `${relPos.left}px`,
            bottom: `${relPos.bottom}px`,
          }}
        >
          {/* ヘッダー */}
          <div className="mention-popover-header">
            <span className="mention-popover-title">ファイルを参照</span>
            {query && (
              <span className="mention-popover-query">
                @{query}
              </span>
            )}
          </div>

          {/* ファイルリスト */}
          <div className="mention-popover-list" ref={listRef}>
            {files.length > 0 ? (
              files.map((file, index) => (
                <div
                  key={file.id || file.name}
                  className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
                  onMouseDown={(e) => {
                    // mousedownで処理（blurイベントとの競合回避）
                    e.preventDefault();
                    onSelect(file);
                  }}
                  onMouseEnter={() => {
                    // マウスホバーで選択インデックスを更新（視覚フィードバック）
                  }}
                >
                  <FileIcon filename={file.name} className="mention-item-icon" />
                  <span className="mention-item-name">
                    {highlightMatch(file.name, query)}
                  </span>
                </div>
              ))
            ) : (
              <div className="mention-empty">
                参照可能なファイルはありません
              </div>
            )}
          </div>

          {/* フッター（操作ヒント） */}
          <div className="mention-popover-footer">
            <span><kbd>↑↓</kbd> 選択</span>
            <span><kbd>Enter</kbd> 確定</span>
            <span><kbd>Esc</kbd> 閉じる</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MentionPopover;
