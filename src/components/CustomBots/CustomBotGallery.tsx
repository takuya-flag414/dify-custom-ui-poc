import React, { useState, useEffect } from 'react';
import { CustomBotCard } from './CustomBotCard';
import { CustomBotModal } from './CustomBotModal';
import { CustomBot } from '../../types/customBot';
import { MockMode } from '../../config/env';
import { useCustomBots } from '../../hooks/useCustomBots';
import { useGeminiStores } from '../../hooks/useGeminiStores';
import './CustomBotGallery.css';
import { Plus, Loader2 } from 'lucide-react';

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

  const [bots, setBots] = useState<CustomBot[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<'my_bots' | 'department' | 'public'>('public');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botToEdit, setBotToEdit] = useState<CustomBot | null>(null);

  const loadBots = async () => {
    setLoading(true);
    try {
      const data = await customBotsApi.fetchBots(scope);
      setBots(data);
    } catch (e) {
      console.error('Failed to load bots', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBots();
  }, [scope]);

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

      <div className="gallery-tabs">
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

      <div className="gallery-content">
        {loading ? (
          <div className="gallery-loading">
            <Loader2 className="spinner icon-spin" size={24} />
            <span>読み込み中...</span>
          </div>
        ) : bots.length === 0 ? (
          <div className="gallery-empty">
            <p>ボットが見つかりません。</p>
            <button className="glass-button outline" onClick={handleOpenModal}>
              最初のボットを作成する
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {bots.map((bot) => (
              <CustomBotCard
                key={bot.bot_id}
                bot={bot}
                onClick={() => onSelectBot && onSelectBot(bot)}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ))}
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
