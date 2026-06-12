import React, { useState, useEffect } from 'react';
import { CustomBotCard } from './CustomBotCard';
import { CustomBotModal } from './CustomBotModal';
import { CustomBot } from '../../types/customBot';
import { MockMode } from '../../config/env';
import { useCustomBots } from '../../hooks/useCustomBots';
import { useGeminiStores } from '../../hooks/useGeminiStores';
import './CustomBotGallery.css';
import { Plus, Loader2, Search, Grid, List, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // アニメーションライブラリの追加

interface CustomBotGalleryProps {
  onSelectBot?: (bot: CustomBot) => void;
  mockMode?: MockMode;
  apiUrl?: string;
  apiKey?: string;
  backendBApiKey?: string;
  backendBApiUrl?: string;
  currentUser?: any;
}

export const CustomBotGallery: React.FC<CustomBotGalleryProps> = ({
  onSelectBot,
  mockMode = 'FE',
  apiUrl = '',
  apiKey = '',
  backendBApiKey = '',
  backendBApiUrl = '',
  currentUser
}) => {
  const customBotsApi = useCustomBots(mockMode, apiUrl, apiKey, currentUser);

  // StoreSelectorModal に渡すGeminiストア一覧（モックまたはBackend B から取得）
  const { stores, isLoading: isStoresLoading, refetch: refetchStores } = useGeminiStores(
    mockMode,
    backendBApiKey,
    backendBApiUrl
  );

  const [myBots, setMyBots] = useState<CustomBot[]>([]);
  const [departmentBots, setDepartmentBots] = useState<CustomBot[]>([]);
  const [publicBots, setPublicBots] = useState<CustomBot[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<'all' | 'my_bots' | 'department' | 'public'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botToEdit, setBotToEdit] = useState<CustomBot | null>(null);

  // 検索・フィルタリング・ソート用の新規ステート
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKnowledgeType, setFilterKnowledgeType] = useState<'all' | 'rag' | 'file' | 'hybrid'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // スコープ切り替え時に検索・フィルタをリセット
  useEffect(() => {
    setSearchQuery('');
    setFilterKnowledgeType('all');
  }, [scope]);

  // 検索・フィルタリング・ソートの適用ロジックを共通化
  const filterAndSortBots = (botsList: CustomBot[]) => {
    return botsList
      .filter((bot) => {
        // 1. テキスト検索（名前・説明・作成者名）
        const query = searchQuery.toLowerCase().trim();
        if (query) {
          const matchesName = bot.name.toLowerCase().includes(query);
          const matchesDesc = (bot.description || '').toLowerCase().includes(query);
          const matchesCreator = `@${bot.creator_uid}`.toLowerCase().includes(query);
          if (!matchesName && !matchesDesc && !matchesCreator) return false;
        }

        // 2. ナレッジタイプによる絞り込み
        const hasRag = !!(bot.rag_config?.enabled && bot.rag_config.target_store_id);
        const hasFile = !!bot.context_file_url || (Array.isArray(bot.context_file_urls) && bot.context_file_urls.length > 0);

        if (filterKnowledgeType === 'rag') return hasRag && !hasFile;
        if (filterKnowledgeType === 'file') return !hasRag && hasFile;
        if (filterKnowledgeType === 'hybrid') return hasRag && hasFile;
        
        return true; // 'all'
      })
      .sort((a, b) => {
        // 3. ソート順
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'ja');
        }
        // デフォルト: 作成日時の新しい順
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return b.bot_id.localeCompare(a.bot_id); // 同一ならIDでフォールバック
      });
  };

  const filteredMyBots = filterAndSortBots(myBots);
  const filteredDeptBots = filterAndSortBots(departmentBots);
  const filteredPublicBots = filterAndSortBots(publicBots);
  const totalFilteredCount = filteredMyBots.length + filteredDeptBots.length + filteredPublicBots.length;

  const loadBots = async () => {
    setLoading(true);
    try {
      const [my, dept, pub] = await Promise.all([
        customBotsApi.fetchBots('my_bots'),
        customBotsApi.fetchBots('department'),
        customBotsApi.fetchBots('public')
      ]);
      setMyBots(my);
      setDepartmentBots(dept);
      setPublicBots(pub);
    } catch (e) {
      console.error('Failed to load bots', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  const handleDelete = async (botId: string) => {
    if (!window.confirm('本当にこのボットを削除しますか？')) return;
    try {
      await customBotsApi.deleteBot(botId);
      loadBots();
    } catch (e) {
      console.error('Failed to delete bot', e);
    }
  };

  const handleEdit = (bot: CustomBot) => {
    setBotToEdit(bot);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setBotToEdit(null);
    setIsModalOpen(true);
  };

  // モーダルが開くタイミングでストア一覧を取得（手動fetch）
  const handleOpenModal = () => {
    handleCreate();
    refetchStores();
  };

  const handleOpenEditModal = (bot: CustomBot) => {
    handleEdit(bot);
    refetchStores();
  };

  // 各セクションのレンダリング用ヘルパー関数
  const renderSection = (title: string, filteredBots: CustomBot[]) => {
    if (filteredBots.length === 0) return null;

    return (
      <div className="gallery-section">
        <div className="section-header">
          <h3 className="section-title">{title}</h3>
          <span className="section-badge">{filteredBots.length}</span>
        </div>
        <motion.div 
          className={viewMode === 'grid' ? 'gallery-grid' : 'gallery-list'}
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredBots.map((bot) => (
              <motion.div
                key={bot.bot_id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 250, damping: 25 }}
              >
                <CustomBotCard
                  bot={bot}
                  viewMode={viewMode}
                  onClick={() => onSelectBot && onSelectBot(bot)}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="custom-bot-gallery">
      <div className="gallery-header">
        <h2 className="gallery-title gradient-text">Custom Bots</h2>
        <div className="gallery-actions">
          <button onClick={handleOpenModal}>
            <Plus size={16} /> 新しいボットを作成
          </button>
        </div>
      </div>

      {/* タブとツールバーコントロールを含む操作エリア */}
      <div className="gallery-control-panel">
        <div className="gallery-tabs-container">
          <div className="gallery-tabs">
            {/* スライディングアクティブ背景のための背景要素 */}
            <motion.div
              className="tabs-active-indicator"
              layoutId="activeTabIndicator"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'absolute',
                width: 'calc(25% - 4px)',
                height: 'calc(100% - 8px)',
                backgroundColor: 'var(--tab-active-bg, rgba(255, 255, 255, 0.85))',
                borderRadius: '8px',
                left: scope === 'all' ? '4px' : scope === 'my_bots' ? '25%' : scope === 'department' ? '50%' : '75%',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                zIndex: 0
              }}
            />
            <button
              className={`glass-tab ${scope === 'all' ? 'active' : ''}`}
              onClick={() => setScope('all')}
            >
              すべて
            </button>
            <button
              className={`glass-tab ${scope === 'my_bots' ? 'active' : ''}`}
              onClick={() => setScope('my_bots')}
            >
              マイボット
            </button>
            <button
              className={`glass-tab ${scope === 'department' ? 'active' : ''}`}
              onClick={() => setScope('department')}
            >
              部署ボット
            </button>
            <button
              className={`glass-tab ${scope === 'public' ? 'active' : ''}`}
              onClick={() => setScope('public')}
            >
              全社ボット
            </button>
          </div>
        </div>

        {/* 新設：Sequoia風 Unified ツールバー */}
        <div className="gallery-toolbar">
          {/* 検索窓 */}
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="ボット名、説明、作成者で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="toolbar-right-controls">
            {/* ナレッジフィルター */}
            <div className="select-wrapper">
              <select
                className="toolbar-select"
                value={filterKnowledgeType}
                onChange={(e) => setFilterKnowledgeType(e.target.value as any)}
              >
                <option value="all">すべてのナレッジ</option>
                <option value="rag">事前定義RAGのみ</option>
                <option value="file">ファイル添付のみ</option>
                <option value="hybrid">ハイブリッドのみ</option>
              </select>
              <ChevronDown size={12} className="select-arrow" />
            </div>

            {/* ソート順 */}
            <div className="select-wrapper">
              <select
                className="toolbar-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="created_at">作成日（新しい順）</option>
                <option value="name">ボット名（五十音順）</option>
              </select>
              <ChevronDown size={12} className="select-arrow" />
            </div>

            {/* グリッド/リスト表示トグル */}
            <div className="layout-toggle-group">
              <button
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="グリッド表示"
              >
                <Grid size={15} />
              </button>
              <button
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="リスト表示"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="gallery-content">
        {loading ? (
          <div className="gallery-loading">
            <Loader2 className="spinner icon-spin" size={24} />
            <span>読み込み中...</span>
          </div>
        ) : totalFilteredCount === 0 ? (
          <div className="gallery-empty">
            <p>{searchQuery || filterKnowledgeType !== 'all' ? '該当するボットが見つかりません。' : 'ボットが見つかりません。'}</p>
            {!searchQuery && filterKnowledgeType === 'all' && (
              <button className="glass-button outline" onClick={handleOpenModal}>
                最初のボットを作成する
              </button>
            )}
          </div>
        ) : (
          <div className="gallery-sections-container">
            {(scope === 'all' || scope === 'my_bots') && renderSection('マイボット', filteredMyBots)}
            {(scope === 'all' || scope === 'department') && renderSection('部署共有ボット', filteredDeptBots)}
            {(scope === 'all' || scope === 'public') && renderSection('全社共有ボット', filteredPublicBots)}
          </div>
        )}
      </div>

      <CustomBotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadBots}
        botToEdit={botToEdit}
        customBotsApi={customBotsApi}
        stores={stores}
        isStoresLoading={isStoresLoading}
      />
    </div>
  );
};
