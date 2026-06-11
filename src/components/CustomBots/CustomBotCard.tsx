import React from 'react';
import { CustomBot } from '../../types/customBot';
import './CustomBotCard.css';
import { Bot, Edit2, Trash2, Database, Paperclip } from 'lucide-react';

interface CustomBotCardProps {
  bot: CustomBot;
  onClick?: (bot: CustomBot) => void;
  onEdit?: (bot: CustomBot) => void;
  onDelete?: (botId: string) => void;
}

export const CustomBotCard: React.FC<CustomBotCardProps> = ({ bot, onClick, onEdit, onDelete }) => {
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

  return (
    <div
      className="custom-bot-card"
      onClick={() => onClick && onClick(bot)}
      role="button"
      tabIndex={0}
    >
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

          {/* RAGストアバッジ（ストア名も表示） */}
          {bot.rag_config?.enabled && (
            <span
              className="bot-rag-badge"
              title={`ナレッジ: ${bot.rag_config.target_store_name || bot.rag_config.target_store_id}`}
            >
              <Database size={11} />
              {bot.rag_config.target_store_name
                ? bot.rag_config.target_store_name.replace(/_/g, ' ')
                : 'ナレッジ'}
            </span>
          )}

          {/* コンテキストファイルバッジ */}
          {bot.context_file_url && (
            <span
              className="bot-file-badge"
              title={`コンテキストファイル: ${getFileNameFromUrl(bot.context_file_url)}`}
            >
              <Paperclip size={11} />
              {getFileNameFromUrl(bot.context_file_url)}
            </span>
          )}
        </div>
        <div className="bot-creator-info">
          <span className="creator-id">@{bot.creator_uid}</span>
        </div>
      </div>
    </div>
  );
};
