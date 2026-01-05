// src/components/Sidebar/Sidebar.jsx
import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
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
      if (value.trim()) onSave(value.trim());
      else onCancel();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (value.trim()) onSave(value.trim());
    else onCancel();
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

// --- Icons ---
const ComposeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SidebarToggleIcon = ({ isCollapsed }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    {isCollapsed ? <path d="M13 10L15 12L13 14" /> : <path d="M15 14L13 12L15 10" />}
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

// --- Animation Config (DESIGN_RULE.md v3.0) ---
// Mass & Friction based Physics
const springTransition = {
  type: "spring",
  stiffness: 250, // "Snappy" response
  damping: 25,    // "Smooth Settling"
  mass: 1
};

// "Bouncy Feedback" for interactive elements
const bounceTransition = {
  type: "spring",
  stiffness: 300,
  damping: 15
};

// New Chat Button: Intelligent Glow Feedback
const newChatButtonVariants = {
  initial: {
    scale: 1,
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: bounceTransition
  },
  tap: {
    scale: 0.96,
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
};

const newChatIconVariants = {
  initial: { rotate: 0 },
  hover: {
    rotate: -10,
    transition: bounceTransition
  }
};

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeOut" }
  }
};

const groupVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.1 }
  }
};

// SettingsNav hover slide
const hoverAnimation = {
  x: 4,
  transition: { type: "spring", stiffness: 400, damping: 25 }
};

const tapAnimation = {
  scale: 0.98,
  transition: { duration: 0.05, ease: "easeOut" } // Instant physical feedback
};

const Sidebar = ({
  conversationId,
  setConversationId,
  conversations,
  onDeleteConversation,
  onRenameConversation,
  isCollapsed,
  toggleSidebar,
  currentView,
  onViewChange
}) => {
  const [menuConfig, setMenuConfig] = useState({ isOpen: false, targetConv: null, anchorRect: null });
  const [deletePopoverConfig, setDeletePopoverConfig] = useState({ isOpen: false, targetConv: null, anchorRect: null });
  const [renamingId, setRenamingId] = useState(null);

  const groupedConversations = useMemo(() => {
    if (isCollapsed) return [];
    return groupConversationsByDate(conversations);
  }, [conversations, isCollapsed]);

  const handleNewChat = () => { if (onViewChange) onViewChange('chat'); setConversationId(null); };
  const handleSelectConversation = (id) => { if (onViewChange) onViewChange('chat'); setConversationId(id); };
  const handleGoToChat = () => { if (onViewChange) onViewChange('chat'); };
  const handleGoToSettings = () => { if (onViewChange) onViewChange('settings'); };

  const handleMenuOpen = (e, conv) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuConfig({ isOpen: true, targetConv: conv, anchorRect: rect });
  };
  const handleMenuClose = () => { setMenuConfig((prev) => ({ ...prev, isOpen: false })); };

  const handleTriggerRename = () => { const t = menuConfig.targetConv; if (t) setRenamingId(t.id); handleMenuClose(); };
  const handleTriggerDelete = () => { const t = menuConfig.targetConv; const r = menuConfig.anchorRect; setDeletePopoverConfig({ isOpen: true, targetConv: t, anchorRect: r }); handleMenuClose(); };
  const handleConfirmDelete = () => { if (deletePopoverConfig.targetConv) onDeleteConversation(deletePopoverConfig.targetConv.id); setDeletePopoverConfig((prev) => ({ ...prev, isOpen: false })); };
  const handleSaveRename = (val) => { if (renamingId) onRenameConversation(renamingId, val); setRenamingId(null); };
  const handleCancelRename = () => { setRenamingId(null); };

  return (
    <LayoutGroup>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} data-tutorial="sidebar">

        {/* 1. Header Row - "Stealth & Brand" (No Traffic Lights) */}
        <div className="sidebar-header-row">
          <motion.button
            layout="position"
            className="header-icon-btn toggle-btn"
            onClick={toggleSidebar}
            title={isCollapsed ? "開く (⌘+B)" : "閉じる (⌘+B)"}
            whileTap={{ scale: 0.9 }}
          >
            <SidebarToggleIcon isCollapsed={isCollapsed} />
          </motion.button>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, transition: { duration: 0.1 } }}
                className="header-app-title"
                onClick={handleGoToChat}
              >
                AI AGENT
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Primary Action - "Intelligent Feedback" */}
        <div className="sidebar-primary-action">
          {isCollapsed ? (
            <motion.button
              layoutId="new-chat-btn"
              className={`zen-new-chat-btn ${currentView === 'chat' && !conversationId ? 'active' : ''}`}
              onClick={handleNewChat}
              title="新しいチャット (⌘N)"
              variants={newChatButtonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <motion.span variants={newChatIconVariants}>
                <ComposeIcon />
              </motion.span>
            </motion.button>
          ) : (
            <motion.button
              layoutId="new-chat-btn"
              className={`hero-new-chat-btn ${currentView === 'chat' && !conversationId ? 'active' : ''}`}
              onClick={handleNewChat}
              variants={newChatButtonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              {/* Glow Effect Layer */}
              <div className="btn-glow-layer" />

              <motion.span
                layoutId="new-chat-icon"
                className="hero-icon"
                variants={newChatIconVariants}
              >
                <ComposeIcon />
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="hero-text"
              >
                新しいチャット
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5, transition: { delay: 0.15 } }}
                className="hero-shortcut"
              >

              </motion.span>
            </motion.button>
          )}
        </div>

        {/* 3. Scrollable List - "Clean Glass" */}
        <div className="sidebar-scroll-area scrollbar-overlay">
          <AnimatePresence mode='wait'>
            {!isCollapsed && conversations.length > 0 && (
              <motion.div
                key="list-container"
                variants={listContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {groupedConversations.map((group) => (
                  <motion.div
                    key={group.key}
                    className="sidebar-group"
                    variants={groupVariants}
                  >
                    <div className="group-label">{group.title}</div>
                    {group.items.map((conv) => {
                      const isRenaming = renamingId === conv.id;
                      const isActive = currentView === 'chat' && conv.id === conversationId;

                      return (
                        <motion.div
                          key={conv.id}
                          layout="position"
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={`conversation-item ${isActive ? 'active' : ''}`}
                          onClick={() => !isRenaming && handleSelectConversation(conv.id)}
                          // Interaction Physics (Unified with SettingsNav)
                          whileHover={!isRenaming ? hoverAnimation : {}}
                          whileTap={!isRenaming ? tapAnimation : {}}
                        >
                          <div className="conversation-content">
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
                            <div className="item-actions">
                              <button className="action-btn" onClick={(e) => handleMenuOpen(e, conv)}>
                                <MoreIcon />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ))}
              </motion.div>
            )}
            {!isCollapsed && conversations.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="empty-state-message"
              >
                履歴なし
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Footer */}
        <div className="sidebar-footer">
          <button
            className={`footer-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={handleGoToSettings}
            title="設定"
          >
            <motion.div layout className="footer-icon-anchor">
              <SettingsIcon size={18} strokeWidth={2} />
            </motion.div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="footer-label"
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  設定
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Popovers */}
        <ContextMenu
          isOpen={menuConfig.isOpen}
          anchorRect={menuConfig.anchorRect}
          onClose={handleMenuClose}
          onRename={handleTriggerRename}
          onDelete={handleTriggerDelete}
        />
        <DeletePopover
          isOpen={deletePopoverConfig.isOpen}
          anchorRect={deletePopoverConfig.anchorRect}
          onClose={() => setDeletePopoverConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmDelete}
          conversationName={deletePopoverConfig.targetConv?.name || ''}
        />
      </div>
    </LayoutGroup>
  );
};

export default Sidebar;