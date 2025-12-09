// src/components/Sidebar/Sidebar.jsx
import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleNewChat = () => setConversationId(null);
  const handleSelectConversation = (id) => setConversationId(id);

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
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-area">
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
          className="new-chat-button"
          onClick={handleNewChat}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
          title={isCollapsed ? "新しいチャット" : ""}
        >
          <div className="new-chat-icon"><NewChatIcon /></div>
          <span className="new-chat-text">新しいチャット</span>
        </motion.button>
      </div>

      {/* Conversation List */}
      <div className="conversation-list">
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
                      className={`conversation-item group ${conv.id === conversationId ? 'active' : ''}`}
                      onClick={() => !isRenaming && handleSelectConversation(conv.id)}
                    >
                      {/* --- ラッパー: テキストまたは編集フォーム --- */}
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

                      {/* --- アイコン類 (縮小禁止) --- */}
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

// --- Icons (変更なし) ---
const LogoIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);
const NewChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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