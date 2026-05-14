// src/routes/HistoryView.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Clock as ClockIcon, MessageSquare as MessageIcon, ChevronRight as ChevronRightIcon, Calendar as CalendarIcon, Filter as FilterIcon, ArrowUpDown as SortIcon, Edit2 as EditIcon, Trash2 as TrashIcon } from 'lucide-react';
import { fetchConversationsApi } from '../api/dify';
import { useAuth } from '../context/AuthContext';
import { useApiConfig } from '../hooks/useApiConfig';
import { normalizeDate } from '../utils/dateUtils';
import './HistoryView.css';

/**
 * 会話履歴一覧画面 (一括選択 & 安全な削除機能)
 */
const HistoryView = ({ handleDeleteConversation, handleRenameConversation }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiKey, apiUrl } = useApiConfig();

  const [allConversations, setAllConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchProgress, setFetchProgress] = useState(0);

  // フィルタ・ソート状態
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // 選択・編集・削除状態
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isDeletingId, setIsDeletingId] = useState(null); // 単一削除
  const [isBulkDeleting, setIsBulkDeleting] = useState(false); // 一括削除フラグ
  const [safetyInput, setSafetyInput] = useState(''); // 「削除」入力用

  // 1. データ取得
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.userId || !apiKey || !apiUrl) return;
      setIsLoading(true);
      setError(null);
      let fetchedData = [];
      let lastId = undefined;
      let hasMore = true;
      const MAX_TOTAL = 500;

      try {
        while (hasMore && fetchedData.length < MAX_TOTAL) {
          const response = await fetchConversationsApi(user.userId, apiUrl, apiKey, 100, lastId);
          if (response.data && response.data.length > 0) {
            fetchedData = [...fetchedData, ...response.data];
            lastId = response.data[response.data.length - 1].id;
            hasMore = response.has_more;
            setFetchProgress(Math.min(100, Math.round((fetchedData.length / MAX_TOTAL) * 100)));
          } else {
            hasMore = false;
          }
        }
        setAllConversations(fetchedData);
      } catch (err) {
        setError('履歴の読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [user?.userId, apiKey, apiUrl]);

  // 2. フィルタ・ソート・検索
  const filteredAndSortedConversations = useMemo(() => {
    let result = [...allConversations];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(conv => 
        conv.name.toLowerCase().includes(query) || 
        (conv.introduction && conv.introduction.toLowerCase().includes(query))
      );
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = today - (30 * 24 * 60 * 60 * 1000);
    if (dateFilter !== 'all') {
      result = result.filter(conv => {
        const date = normalizeDate(conv.updated_at || conv.created_at).getTime();
        if (dateFilter === 'today') return date >= today;
        if (dateFilter === 'week') return date >= weekAgo;
        if (dateFilter === 'month') return date >= monthAgo;
        return true;
      });
    }
    result.sort((a, b) => {
      const timeA = normalizeDate(a.updated_at || a.created_at).getTime();
      const timeB = normalizeDate(b.updated_at || b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return result;
  }, [allConversations, searchQuery, dateFilter, sortOrder]);

  // 3. 選択ハンドラ
  const toggleSelect = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedConversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedConversations.map(c => c.id)));
    }
  };

  // 4. 削除アクション
  const initiateDelete = (e, id) => {
    e.stopPropagation();
    setIsDeletingId(id);
    setSafetyInput('');
  };

  const initiateBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    setSafetyInput('');
  };

  const executeDeletion = async () => {
    if (safetyInput !== '削除') return;

    const idsToDelete = isBulkDeleting ? Array.from(selectedIds) : [isDeletingId];
    setIsLoading(true);
    setFetchProgress(0);

    try {
      let count = 0;
      for (const id of idsToDelete) {
        await handleDeleteConversation(id);
        count++;
        setFetchProgress(Math.round((count / idsToDelete.length) * 100));
      }
      setAllConversations(prev => prev.filter(c => !idsToDelete.includes(c.id)));
      setSelectedIds(new Set());
    } catch (err) {
      alert('一部の削除に失敗しました。');
    } finally {
      setIsLoading(false);
      setIsDeletingId(null);
      setIsBulkDeleting(false);
      setSafetyInput('');
    }
  };

  // 5. 名前変更ハンドラ
  const onRenameClick = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditName(conv.name);
  };

  const saveRename = async () => {
    if (!editingId || !editName.trim()) { setEditingId(null); return; }
    try {
      await handleRenameConversation(editingId, editName);
      setAllConversations(prev => prev.map(c => c.id === editingId ? { ...c, name: editName } : c));
      setEditingId(null);
    } catch (err) {
      alert('変更に失敗しました。');
    }
  };

  const HighlightText = ({ text, query }) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="search-highlight">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const date = normalizeDate(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'たった今';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`;
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="history-view">
      {/* --- Safe Delete Modal --- */}
      <AnimatePresence>
        {(isDeletingId || isBulkDeleting) && (
          <div className="modal-overlay" onClick={() => { setIsDeletingId(null); setIsBulkDeleting(false); }}>
            <motion.div 
              className="modal-content delete-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>{isBulkDeleting ? `${selectedIds.size}件の会話を削除しますか？` : '会話を削除しますか？'}</h3>
              <p>この操作は取り消せません。続行するには下に <strong>「削除」</strong> と入力してください。</p>
              
              <div className="safety-input-wrapper">
                <input 
                  type="text"
                  placeholder="削除 と入力"
                  value={safetyInput}
                  onChange={e => setSafetyInput(e.target.value)}
                  autoFocus
                  className="safety-confirm-input"
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => { setIsDeletingId(null); setIsBulkDeleting(false); }}>キャンセル</button>
                <button 
                  className="btn-danger" 
                  onClick={executeDeletion}
                  disabled={safetyInput !== '削除'}
                >
                  完全に削除する
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Header Section --- */}
      <header className="history-sticky-header">
        <div className="header-content">
          <div className="title-area">
            <h1>すべての履歴</h1>
            <span className="count-badge">{filteredAndSortedConversations.length} 件</span>
          </div>

          <div className="control-bar">
            {/* Selection Header */}
            <div className="selection-control">
              <input 
                type="checkbox" 
                className="mac-checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedConversations.length}
                onChange={toggleSelectAll}
              />
              {selectedIds.size > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="selection-actions"
                >
                  <span className="selection-count">{selectedIds.size} 件を選択中</span>
                  <button className="bulk-delete-btn" onClick={initiateBulkDelete}>一括削除</button>
                </motion.div>
              )}
            </div>

            <div className="search-wrapper">
              <SearchIcon className="search-icon" size={16} />
              <input
                type="text"
                placeholder="履歴を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="header-actions">
              <div className="filter-dropdown-container">
                <button className={`header-tool-btn ${dateFilter !== 'all' ? 'active' : ''}`} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}>
                  <FilterIcon size={16} />
                  <span>{dateFilter === 'all' ? '期間' : dateFilter === 'today' ? '今日' : dateFilter === 'week' ? '7日間' : '30日間'}</span>
                </button>
                <AnimatePresence>
                  {isFilterMenuOpen && (
                    <motion.div className="filter-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                      <button onClick={() => { setDateFilter('all'); setIsFilterMenuOpen(false); }}>すべて</button>
                      <button onClick={() => { setDateFilter('today'); setIsFilterMenuOpen(false); }}>今日</button>
                      <button onClick={() => { setDateFilter('week'); setIsFilterMenuOpen(false); }}>過去7日間</button>
                      <button onClick={() => { setDateFilter('month'); setIsFilterMenuOpen(false); }}>過去30日間</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button className="header-tool-btn" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                <SortIcon size={16} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                <span>{sortOrder === 'desc' ? '新しい順' : '古い順'}</span>
              </button>
            </div>
          </div>
        </div>
        
        {isLoading && (
          <div className="loading-progress-container">
            <motion.div className="loading-progress-bar" initial={{ width: 0 }} animate={{ width: `${fetchProgress}%` }} />
          </div>
        )}
      </header>

      {/* --- List Section --- */}
      <main className="history-main-content scrollbar-overlay">
        {error ? (
          <div className="history-error-state">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>再試行</button>
          </div>
        ) : filteredAndSortedConversations.length === 0 && !isLoading ? (
          <div className="history-empty-state">
            <MessageIcon size={48} className="empty-icon" />
            <h2>履歴が見つかりません</h2>
          </div>
        ) : (
          <div className="history-list">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  className={`history-item-card ${editingId === conv.id ? 'is-editing' : ''} ${selectedIds.has(conv.id) ? 'is-selected' : ''}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => editingId !== conv.id && navigate(`/chat/${conv.id}`)}
                >
                  <div className="item-checkbox-area" onClick={(e) => toggleSelect(e, conv.id)}>
                    <input 
                      type="checkbox" 
                      className="mac-checkbox"
                      checked={selectedIds.has(conv.id)}
                      readOnly
                    />
                  </div>

                  <div className="item-icon">
                    <MessageIcon size={20} />
                  </div>
                  
                  <div className="item-main-info">
                    <div className="item-top-row">
                      <div className="item-title-group">
                        {editingId === conv.id ? (
                          <input className="rename-input" value={editName} onChange={e => setEditName(e.target.value)} onBlur={saveRename} onKeyDown={e => e.key === 'Enter' && saveRename()} autoFocus onClick={e => e.stopPropagation()} />
                        ) : (
                          <h3 className="item-title"><HighlightText text={conv.name || '新しいチャット'} query={searchQuery} /></h3>
                        )}
                      </div>
                      
                      <span className="item-date">{formatRelativeTime(conv.updated_at || conv.created_at)}</span>
                      
                      <div className="item-actions">
                        <button className="item-action-btn" onClick={(e) => onRenameClick(e, conv)} title="名前変更"><EditIcon size={14} /></button>
                        <button className="item-action-btn delete" onClick={(e) => initiateDelete(e, conv.id)} title="削除"><TrashIcon size={14} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryView;
