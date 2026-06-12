import React from 'react';
import { CustomBot } from '../../types/customBot';
import './CustomBotCard.css';
import { Bot, Edit2, Trash2, Database, Paperclip } from 'lucide-react';

interface CustomBotCardProps {
  bot: CustomBot;
  onClick?: (bot: CustomBot) => void;
  onEdit?: (bot: CustomBot) => void;
  onDelete?: (botId: string) => void;
  viewMode?: 'grid' | 'list'; // 表示モード ('grid' または 'list')
}

export const CustomBotCard: React.FC<CustomBotCardProps> = ({ 
  bot, 
  onClick, 
  onEdit, 
  onDelete, 
  viewMode = 'grid' 
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(bot);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(bot.bot_id);
  };

  // コンテキストファイルURLからファイル名を抽出
  const getFileNameFromUrl = (url: string): string => {
    const parts = url.split('/');
    const rawName = parts[parts.length - 1] || url;
    return rawName.replace(/^\d+_/, '');
  };

  const isList = viewMode === 'list';

  return (
    <div
      className={`custom-bot-card ${isList ? 'list-mode' : 'grid-mode'}`}
      onClick={() => onClick && onClick(bot)}
      role="button"
      tabIndex={0}
    >
      {isList ? (
        /* リストモードの構造 */
        <div className="bot-list-item-content">
          <div className="bot-list-left">
            <div className="bot-icon-wrapper">
              <Bot className="bot-icon" />
            </div>
            <div className="bot-info">
              <h3 className="bot-name gradient-text">{bot.name}</h3>
              <p className="bot-description" title={bot.description}>
                {bot.description || '説明はありません'}
              </p>
            </div>
          </div>

          <div className="bot-list-middle">
            <div className="bot-badges">
              {/* 公開範囲バッジ */}
              <span className={`bot-visibility-badge visibility-${bot.visibility}`}>
                {bot.visibility === 'public' ? '全社' : bot.visibility === 'department' ? '部署' : '非公開'}
              </span>

              {/* RAGストアバッジ */}
              {bot.rag_config?.enabled && (
                <span
                  className="bot-rag-badge"
                  title={`ナレッジ: ${bot.rag_config.target_store_name || bot.rag_config.target_store_id}`}
                >
                  <Database size={11} />
                  <span className="badge-text">
                    {bot.rag_config.target_store_name
                      ? bot.rag_config.target_store_name.replace(/_/g, ' ')
                      : 'ナレッジ'}
                  </span>
                </span>
              )}

              {/* コンテキストファイルバッジ */}
              {(bot.context_file_url || (Array.isArray(bot.context_file_urls) && bot.context_file_urls.length > 0)) && (
                <span
                  className="bot-file-badge"
                  title={`コンテキストファイル: ${
                    bot.context_file_url 
                      ? getFileNameFromUrl(bot.context_file_url) 
                      : bot.context_file_urls && bot.context_file_urls.length > 0
                      ? bot.context_file_urls.map(url => getFileNameFromUrl(url)).join(', ')
                      : ''
                  }`}
                >
                  <Paperclip size={11} />
                  <span className="badge-text">
                    <span className="file-name-text">
                      {bot.context_file_url 
                        ? getFileNameFromUrl(bot.context_file_url) 
                        : bot.context_file_urls && bot.context_file_urls.length > 0
                        ? getFileNameFromUrl(bot.context_file_urls[0])
                        : ''}
                    </span>
                    {(!bot.context_file_url && bot.context_file_urls && bot.context_file_urls.length > 1) && (
                      <span className="file-count-text">他{bot.context_file_urls.length - 1}件</span>
                    )}
                  </span>
                </span>
              )}
            </div>
            <div className="bot-creator-info">
              <span className="creator-id">@{bot.creator_uid}</span>
            </div>
          </div>

          <div className="bot-list-right">
            <div className="bot-actions">
              <button className="edit-btn" onClick={handleEdit} title="編集">
                <Edit2 size={16} />
              </button>
              <button className="danger" onClick={handleDelete} title="削除">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* グリッドモードの構造 */
        <>
          <div className="bot-card-header">
            <div className="bot-icon-wrapper">
              <Bot className="bot-icon" />
            </div>
            <div className="bot-actions">
              <button className="edit-btn" onClick={handleEdit} title="編集">
                <Edit2 size={16} />
              </button>
              <button className="danger" onClick={handleDelete} title="削除">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="bot-card-body">
            <h3 className="bot-name gradient-text">{bot.name}</h3>
            <p className="bot-description">{bot.description || '説明はありません'}</p>
          </div>

          <div className="bot-card-footer">
            <div className="bot-badges">
              {/* 公開範囲バッジ */}
              <span className={`bot-visibility-badge visibility-${bot.visibility}`}>
                {bot.visibility === 'public' ? '全社' : bot.visibility === 'department' ? '部署' : '非公開'}
              </span>

              {/* RAGストアバッジ */}
              {bot.rag_config?.enabled && (
                <span
                  className="bot-rag-badge"
                  title={`ナレッジ: ${bot.rag_config.target_store_name || bot.rag_config.target_store_id}`}
                >
                  <Database size={11} />
                  <span className="badge-text">
                    {bot.rag_config.target_store_name
                      ? bot.rag_config.target_store_name.replace(/_/g, ' ')
                      : 'ナレッジ'}
                  </span>
                </span>
              )}

              {/* コンテキストファイルバッジ */}
              {(bot.context_file_url || (Array.isArray(bot.context_file_urls) && bot.context_file_urls.length > 0)) && (
                <span
                  className="bot-file-badge"
                  title={`コンテキストファイル: ${
                    bot.context_file_url 
                      ? getFileNameFromUrl(bot.context_file_url) 
                      : bot.context_file_urls && bot.context_file_urls.length > 0
                      ? bot.context_file_urls.map(url => getFileNameFromUrl(url)).join(', ')
                      : ''
                  }`}
                >
                  <Paperclip size={11} />
                  <span className="badge-text">
                    <span className="file-name-text">
                      {bot.context_file_url 
                        ? getFileNameFromUrl(bot.context_file_url) 
                        : bot.context_file_urls && bot.context_file_urls.length > 0
                        ? getFileNameFromUrl(bot.context_file_urls[0])
                        : ''}
                    </span>
                    {(!bot.context_file_url && bot.context_file_urls && bot.context_file_urls.length > 1) && (
                      <span className="file-count-text">他{bot.context_file_urls.length - 1}件</span>
                    )}
                  </span>
                </span>
              )}
            </div>
            <div className="bot-creator-info">
              <span className="creator-id">@{bot.creator_uid}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
