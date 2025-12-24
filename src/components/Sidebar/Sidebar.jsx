// src/components/Sidebar/Sidebar.jsx
import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react'; // ★追加: Lucideアイコン
import DeletePopover from './DeletePopover';
import ContextMenu from './ContextMenu';
import { groupConversationsByDate } from '../../utils/dateUtils';
import './Sidebar.css';

/**
 * 自動拡張するインライン編集用テキストエリア
 */
const RenameInput = ({ initialValue, onSave, onCancel }) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSave(value.trim());
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      onSave(value.trim());
    } else {
      onCancel();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className="conversation-rename-textarea"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      autoFocus
      rows={1}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

// アニメーション付き「Compose」アイコン
const ComposeIcon = () => {
  const pencilVariants = {
    rest: { y: 0, x: 0, rotate: 0 },
    hover: {
      y: -2, x: 2, rotate: -12,
      transition: { type: "spring", stiffness: 300, damping: 15 }
    }
  };

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <motion.g variants={pencilVariants}>
        <path
          d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          fill="var(--color-bg-surface)"
        />
      </motion.g>
    </svg>
  );
};

const Sidebar = ({
  conversationId,
  setConversationId,
  conversations,
  pinnedIds,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
  isCollapsed,
  toggleSidebar,
  // ★追加Props
  currentView,
  onViewChange
}) => {
  const [menuConfig, setMenuConfig] = useState({
    isOpen: false,
    targetConv: null,
    anchorRect: null,
  });

  const [deletePopoverConfig, setDeletePopoverConfig] = useState({
    isOpen: false,
    targetConv: null,
    anchorRect: null,
  });

  const [renamingId, setRenamingId] = useState(null);

  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(conversations, pinnedIds);
  }, [conversations, pinnedIds]);

  // ★変更: チャット画面へ戻ってから新規作成
  const handleNewChat = () => {
    if (onViewChange) onViewChange('chat');
    setConversationId(null);
  };

  // ★変更: チャット画面へ戻ってから選択
  const handleSelectConversation = (id) => {
    if (onViewChange) onViewChange('chat');
    setConversationId(id);
  };

  // ★追加: チャット画面へ戻るハンドラ
  const handleGoToChat = () => {
    if (onViewChange) onViewChange('chat');
  };

  // ★追加: 設定画面へ行くハンドラ
  const handleGoToSettings = () => {
    if (onViewChange) onViewChange('settings');
  };

  const handleMenuOpen = (e, conv) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuConfig({ isOpen: true, targetConv: conv, anchorRect: rect });
  };

  const handleMenuClose = () => {
    setMenuConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleTriggerRename = () => {
    const target = menuConfig.targetConv;
    if (target) {
      setRenamingId(target.id);
    }
    handleMenuClose();
  };

  const handleTriggerPin = () => {
    const target = menuConfig.targetConv;
    if (target) {
      onPinConversation(target.id);
    }
    handleMenuClose();
  };

  const handleTriggerDelete = () => {
    const target = menuConfig.targetConv;
    const rect = menuConfig.anchorRect;
    setDeletePopoverConfig({ isOpen: true, targetConv: target, anchorRect: rect });
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (deletePopoverConfig.targetConv) {
      onDeleteConversation(deletePopoverConfig.targetConv.id);
    }
    setDeletePopoverConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveRename = (newName) => {
    if (renamingId) {
      onRenameConversation(renamingId, newName);
    }
    setRenamingId(null);
  };

  const handleCancelRename = () => {
    setRenamingId(null);
  };

  const smoothTransition = { duration: 0.25, ease: [0.2, 0, 0, 1] };

  const itemVariants = {
    hidden: {
      opacity: 0, height: 0, marginBottom: 0, scale: 0.98,
      transition: { duration: 0.2, ease: "easeInOut" }
    },
    visible: {
      opacity: 1, height: 'auto', marginBottom: 4, scale: 1,
      transition: smoothTransition
    },
    exit: {
      opacity: 0, height: 0, marginBottom: 0, scale: 0.98,
      transition: { duration: 0.15, ease: "easeOut" }
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} data-tutorial="sidebar"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }} // フレックスレイアウトを明示
    >

      {/* Header */}
      <div className="sidebar-header">
        <div
          className="sidebar-brand-area"
          onClick={handleGoToChat} // クリックでチャットへ戻る
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-logo"><LogoIcon /></div>
          <h1 className="sidebar-title">社内AI (PoC)</h1>
        </div>
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
        >
          <SidebarToggleIcon isCollapsed={isCollapsed} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="new-chat-wrapper">
        <motion.button
          className={`new-chat-button ${currentView === 'chat' && !conversationId ? 'active' : ''}`}
          onClick={handleNewChat}
          initial="rest"
          whileHover="hover"
          whileTap={{ scale: 0.98 }}
          title={isCollapsed ? "新しいチャット (⌘N)" : "新しいチャット (⌘N)"}
        >
          <div className="new-chat-icon">
            <ComposeIcon />
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="new-chat-text"
                initial={{ opacity: 0, width: 0, x: -10 }}
                animate={{
                  opacity: 1,
                  width: "auto",
                  x: 0,
                  transition: { duration: 0.3, ease: "easeOut", delay: 0.05 }
                }}
                exit={{
                  opacity: 0,
                  width: 0,
                  transition: { duration: 0.2 }
                }}
              >
                新しいチャット
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Conversation List */}
      <div className="conversation-list" style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div className="empty-state-message">履歴はありません</div>
        ) : (
          groupedConversations.map((group) => (
            <div key={group.key} className="sidebar-group">
              {!isCollapsed && <div className="group-title">{group.title}</div>}

              <AnimatePresence initial={false} mode='popLayout'>
                {group.items.map((conv) => {
                  const isPinned = pinnedIds.includes(conv.id);
                  const isRenaming = renamingId === conv.id;
                  const isActive = currentView === 'chat' && conv.id === conversationId;

                  return (
                    <motion.div
                      key={conv.id}
                      layout
                      layoutId={conv.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={smoothTransition}
                      whileHover={isRenaming ? {} : { scale: 1.01, x: 2, transition: { duration: 0.2 } }}
                      whileTap={isRenaming ? {} : { scale: 0.99, transition: { duration: 0.1 } }}
                      className={`conversation-item group ${isActive ? 'active' : ''}`}
                      onClick={() => !isRenaming && handleSelectConversation(conv.id)}
                    >
                      <div className="conversation-name-wrapper">
                        {isRenaming ? (
                          <RenameInput
                            initialValue={conv.name}
                            onSave={handleSaveRename}
                            onCancel={handleCancelRename}
                          />
                        ) : (
                          <span className="conversation-name" title={conv.name}>
                            {conv.name}
                          </span>
                        )}
                      </div>

                      {!isRenaming && (
                        <>
                          {isPinned && !isCollapsed && (
                            <span className="pinned-indicator" title="固定済み">
                              <PinIconSmall />
                            </span>
                          )}

                          <motion.button
                            className="delete-icon-button"
                            onClick={(e) => handleMenuOpen(e, conv)}
                            title="メニュー"
                            whileHover={{ scale: 1.1, color: 'var(--color-text-main)', transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <MoreIcon />
                          </motion.button>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Settings Button Area (Footer) */}
      <div className="sidebar-footer">
        <motion.button
          className={`sidebar-footer-button ${currentView === 'settings' ? 'active' : ''}`}
          onClick={handleGoToSettings}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="footer-icon">
            <SettingsIcon size={20} strokeWidth={2} />
          </div>

          {!isCollapsed && (
            <span className="footer-text">
              設定
            </span>
          )}
        </motion.button>
      </div>

      <ContextMenu
        isOpen={menuConfig.isOpen}
        anchorRect={menuConfig.anchorRect}
        onClose={handleMenuClose}
        onRename={handleTriggerRename}
        onPin={handleTriggerPin}
        onDelete={handleTriggerDelete}
        isPinned={menuConfig.targetConv && pinnedIds.includes(menuConfig.targetConv.id)}
      />

      <DeletePopover
        isOpen={deletePopoverConfig.isOpen}
        anchorRect={deletePopoverConfig.anchorRect}
        onClose={() => setDeletePopoverConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        conversationName={deletePopoverConfig.targetConv?.name || ''}
      />
    </div>
  );
};

// --- Icons (Existing SVGs) ---
const LogoIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const PinIconSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)', marginLeft: 'auto', marginRight: '4px' }}>
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"></path>
  </svg>
);

const SidebarToggleIcon = ({ isCollapsed }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    {isCollapsed ? <path d="M13 10L15 12L13 14" /> : <path d="M15 14L13 12L15 10" />}
  </svg>
);

export default Sidebar;