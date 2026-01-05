// src/components/Settings/sections/RagSettings.jsx
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  Search, LayoutGrid, List, Plus, CheckCircle,
  Loader, AlertCircle, Clock, Trash2, Database,
  FileText, AlertTriangle, Upload
} from 'lucide-react';
import FileIcon from '../../Shared/FileIcon';
import { ChatServiceAdapter } from '../../../services/ChatServiceAdapter';
import { MacSettingsSection } from './MacSettingsComponents';
import './SettingsCommon.css';
import './RagSettings.css';

// === モックデータ ===
const INITIAL_FILES = [
  { id: 'doc-001', name: '2025年度_就業規則.pdf', size: '2.4 MB', updatedAt: '2025-10-20', status: 'indexed' },
  { id: 'doc-002', name: '製品マニュアル_v3.docx', size: '5.1 MB', updatedAt: '2025-11-15', status: 'indexing' },
  { id: 'doc-003', name: '旧システム仕様書.pdf', size: '1.8 MB', updatedAt: '2025-09-01', status: 'error', errorMessage: 'パスワード保護' },
  { id: 'doc-004', name: '新入社員研修資料.pptx', size: '8.2 MB', updatedAt: '2025-12-01', status: 'queued' },
  { id: 'doc-005', name: '営業戦略2025.xlsx', size: '3.6 MB', updatedAt: '2025-11-28', status: 'indexed' }
];

// === サブコンポーネント ===

/** ステータスバッジ */
const StatusBadge = ({ status, errorMessage }) => {
  const config = {
    indexed: { icon: CheckCircle, color: 'var(--color-success)', label: '学習完了' },
    indexing: { icon: Loader, color: 'var(--color-warning-amber)', label: '処理中', animate: true },
    error: { icon: AlertCircle, color: 'var(--color-error)', label: 'エラー' },
    queued: { icon: Clock, color: 'var(--color-text-muted)', label: '待機中' }
  };
  const { icon: Icon, color, label, animate } = config[status] || config.queued;

  return (
    <span
      className="rag-status-badge"
      style={{ color }}
      title={status === 'error' ? errorMessage : label}
    >
      <Icon size={12} className={animate ? 'animate-spin' : ''} />
      <span>{label}</span>
    </span>
  );
};

/** 削除確認ダイアログ (Portal) */
const DeleteConfirmDialog = ({ file, onConfirm, onCancel }) => {
  // ESCキー対応
  React.useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return ReactDOM.createPortal(
    <div className="rag-confirm-overlay" onClick={onCancel}>
      <div className="rag-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rag-confirm-icon"><AlertTriangle size={32} /></div>
        <h3 className="rag-confirm-title">ファイルを削除しますか？</h3>
        <p className="rag-confirm-filename">{file.name}</p>
        <p className="rag-confirm-warning">
          この操作は取り消せません。AIはこのドキュメントを参照できなくなります。
        </p>
        <div className="rag-confirm-actions">
          <button className="rag-confirm-btn-cancel" onClick={onCancel}>キャンセル</button>
          <button className="rag-confirm-btn-delete" onClick={onConfirm}>削除する</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/** ツールバー */
const RagToolbar = ({ searchQuery, onSearchChange, viewMode, onViewModeChange, onAddClick }) => (
  <div className="rag-toolbar">
    <div className="rag-search-wrapper">
      <Search size={14} className="rag-search-icon" />
      <input
        type="text"
        className="settings-input rag-search-input"
        placeholder="ファイルを検索..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>

    <div className="mac-segmented">
      <button
        className={`mac-segmented-item ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => onViewModeChange('grid')}
        title="グリッド表示"
      >
        <LayoutGrid size={14} />
      </button>
      <button
        className={`mac-segmented-item ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onViewModeChange('list')}
        title="リスト表示"
      >
        <List size={14} />
      </button>
    </div>

    <button className="settings-btn primary" onClick={onAddClick}>
      <Plus size={14} />
      <span>追加</span>
    </button>
  </div>
);

/** リスト表示用 行コンポーネント */
const FileRow = ({ file, onDelete }) => (
  <div className="mac-settings-row rag-list-row">
    {/* Icon Col */}
    <div className="settings-icon-col">
      <div className="settings-icon-box">
        <FileText size={16} className="text-primary" />
      </div>
    </div>

    {/* Label Col (Name & Meta) */}
    <div className="settings-label-col" style={{ flex: 1, paddingRight: '16px' }}>
      <div className="settings-label-text">{file.name}</div>
      <div className="settings-description">
        {file.size} • {file.updatedAt}
      </div>
    </div>

    {/* Status Col (Middle) */}
    <div className="rag-list-status">
      <StatusBadge status={file.status} errorMessage={file.errorMessage} />
    </div>

    {/* Control Col (Action) */}
    <div className="settings-control-col" style={{ minWidth: 'auto' }}>
      <button
        className="rag-action-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(file); }}
        title="削除"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

/** グリッド表示用 カードコンポーネント */
const FileGridItem = ({ file, onDelete }) => (
  <div className="rag-grid-item">
    <div className="rag-grid-icon">
      <FileIcon filename={file.name} className="w-10 h-10" />
    </div>
    <div className="rag-grid-info">
      <div className="rag-grid-name" title={file.name}>{file.name}</div>
      <StatusBadge status={file.status} errorMessage={file.errorMessage} />
    </div>
    <button
      className="rag-grid-delete"
      onClick={(e) => { e.stopPropagation(); onDelete(file); }}
      title="削除"
    >
      <Trash2 size={12} />
    </button>
  </div>
);

// === メインコンポーネント ===
const RagSettings = ({ mockMode, userId, apiUrl, apiKey }) => {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [viewMode, setViewMode] = useState('list'); // Default to list for system-settings feel
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  // ドラッグ＆ドロップ処理
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload({ target: { files: [file] } });
  };

  // ファイルアップロード (Mock)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mock Upload logic
    const newFile = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      updatedAt: new Date().toISOString().split('T')[0],
      status: 'indexing'
    };

    setFiles(prev => [newFile, ...prev]);

    // Simulate indexing completion
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'indexed' } : f));
    }, 2000);

    e.target.value = ''; // Reset input
  };

  const handleDeleteClick = (file) => setDeleteTarget(file);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="settings-container">
      <div
        className={`rag-drop-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <RagToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddClick={() => fileInputRef.current?.click()}
        />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.md"
        />

        <MacSettingsSection title={`Documents (${filteredFiles.length})`}>
          {filteredFiles.length === 0 ? (
            <div className="rag-empty">
              <Database size={24} className="rag-empty-icon" />
              <span className="rag-empty-text">No documents found</span>
              <span className="rag-empty-subtext">Drag files here or click Add</span>
            </div>
          ) : (
            viewMode === 'list' ? (
              <div>
                {filteredFiles.map(file => (
                  <FileRow key={file.id} file={file} onDelete={handleDeleteClick} />
                ))}
              </div>
            ) : (
              <div className="rag-grid-container">
                {filteredFiles.map(file => (
                  <FileGridItem key={file.id} file={file} onDelete={handleDeleteClick} />
                ))}
              </div>
            )
          )}
        </MacSettingsSection>

        {deleteTarget && (
          <DeleteConfirmDialog
            file={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </div>
  );
};

export default RagSettings;