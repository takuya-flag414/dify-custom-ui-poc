// src/components/Settings/sections/RagSettings.jsx
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Search, LayoutGrid, List, Plus, CheckCircle,
  Loader, AlertCircle, Clock, Trash2, Database, Upload, AlertTriangle
} from 'lucide-react';
import FileIcon from '../../Shared/FileIcon';
import { ChatServiceAdapter } from '../../../services/ChatServiceAdapter';
import './SettingsComponents.css';

// === モックデータ ===
const INITIAL_FILES = [
  {
    id: 'doc-001',
    name: '2025年度_就業規則.pdf',
    size: '2.4 MB',
    type: 'pdf',
    updatedAt: '2025-10-20',
    status: 'indexed',
    chunkCount: 152,
    errorMessage: null
  },
  {
    id: 'doc-002',
    name: '製品マニュアル_v3.docx',
    size: '5.1 MB',
    type: 'docx',
    updatedAt: '2025-11-15',
    status: 'indexing',
    chunkCount: null,
    errorMessage: null
  },
  {
    id: 'doc-003',
    name: '旧システム仕様書.pdf',
    size: '1.8 MB',
    type: 'pdf',
    updatedAt: '2025-09-01',
    status: 'error',
    chunkCount: null,
    errorMessage: 'パスワード保護されたPDFは処理できません'
  },
  {
    id: 'doc-004',
    name: '新入社員研修資料.pptx',
    size: '8.2 MB',
    type: 'pptx',
    updatedAt: '2025-12-01',
    status: 'queued',
    chunkCount: null,
    errorMessage: null
  },
  {
    id: 'doc-005',
    name: '営業戦略2025.xlsx',
    size: '3.6 MB',
    type: 'xlsx',
    updatedAt: '2025-11-28',
    status: 'indexed',
    chunkCount: 89,
    errorMessage: null
  }
];

// === サブコンポーネント ===

/** ステータスバッジ */
const StatusBadge = ({ status, errorMessage }) => {
  const config = {
    indexed: { icon: CheckCircle, color: 'var(--color-success)', label: '学習完了' },
    indexing: { icon: Loader, color: '#F59E0B', label: '処理中', animate: true },
    error: { icon: AlertCircle, color: 'var(--color-error)', label: 'エラー' },
    queued: { icon: Clock, color: '#9CA3AF', label: '待機中' }
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

/** 削除確認ダイアログ - Portalで全画面オーバーレイ */
const DeleteConfirmDialog = ({ file, onConfirm, onCancel }) => {
  // ESCキーでキャンセル
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  // Portalを使用してbody直下に描画（全画面オーバーレイを実現）
  return ReactDOM.createPortal(
    <div className="rag-confirm-overlay" onClick={onCancel}>
      <div className="rag-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rag-confirm-icon">
          <AlertTriangle size={32} />
        </div>
        <h3 className="rag-confirm-title">ファイルを削除しますか？</h3>
        <p className="rag-confirm-filename">{file.name}</p>
        <p className="rag-confirm-warning">
          この操作は取り消せません。AIはこのドキュメントを参照できなくなります。
        </p>
        <div className="rag-confirm-actions">
          <button className="rag-confirm-btn-cancel" onClick={onCancel}>
            キャンセル
          </button>
          <button className="rag-confirm-btn-delete" onClick={onConfirm}>
            削除する
          </button>
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
      <Search size={16} className="rag-search-icon" />
      <input
        type="text"
        className="rag-search-input settings-input"
        placeholder="ファイルを検索..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <div className="rag-view-toggle">
      <button
        className={`rag-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => onViewModeChange('grid')}
        title="グリッド表示"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        className={`rag-view-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onViewModeChange('list')}
        title="リスト表示"
      >
        <List size={18} />
      </button>
    </div>
    <button className="settings-btn primary rag-add-btn" onClick={onAddClick}>
      <Plus size={16} />
      <span>追加</span>
    </button>
  </div>
);

/** ドロップゾーンオーバーレイ */
const DropZoneOverlay = () => (
  <div className="rag-dropzone-overlay">
    <div className="rag-dropzone-content">
      <Upload size={48} className="rag-dropzone-icon" />
      <p className="rag-dropzone-text">ここにドロップして学習開始</p>
      <p className="rag-dropzone-subtext">PDF, DOCX, PPTX, XLSX, TXT</p>
    </div>
  </div>
);

/** ファイルカード (Grid用) */
const FileCard = ({ file, onDelete }) => (
  <div className={`rag-file-card ${file.status === 'error' ? 'has-error' : ''}`}>
    <button
      className="rag-file-card-delete"
      onClick={() => onDelete(file)}
      title="削除"
    >
      <Trash2 size={14} />
    </button>
    <div className="rag-file-card-icon">
      <FileIcon filename={file.name} className="w-12 h-12" />
    </div>
    <div className="rag-file-card-info">
      <p className="rag-file-card-name" title={file.name}>{file.name}</p>
      <StatusBadge status={file.status} errorMessage={file.errorMessage} />
    </div>
  </div>
);

/** ファイル行 (List用 - テーブル形式) */
const FileRow = ({ file, onDelete }) => (
  <div className={`rag-table-row ${file.status === 'error' ? 'has-error' : ''}`}>
    <div className="rag-table-cell rag-table-cell-name">
      <FileIcon filename={file.name} className="w-6 h-6" />
      <span className="rag-file-name" title={file.name}>{file.name}</span>
    </div>
    <div className="rag-table-cell rag-table-cell-date">
      {file.updatedAt}
    </div>
    <div className="rag-table-cell rag-table-cell-size">
      {file.size}
    </div>
    <div className="rag-table-cell rag-table-cell-status">
      <StatusBadge status={file.status} errorMessage={file.errorMessage} />
    </div>
    <div className="rag-table-cell rag-table-cell-actions">
      <button
        className="rag-table-delete-btn"
        onClick={() => onDelete(file)}
        title="削除"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

/** Grid表示 */
const FileGrid = ({ files, onDelete }) => (
  <div className="rag-file-grid">
    {files.map(file => (
      <FileCard key={file.id} file={file} onDelete={onDelete} />
    ))}
  </div>
);

/** List表示（テーブル形式） */
const FileList = ({ files, onDelete }) => (
  <div className="rag-table">
    {/* テーブルヘッダー */}
    <div className="rag-table-header">
      <div className="rag-table-cell rag-table-cell-name">名前</div>
      <div className="rag-table-cell rag-table-cell-date">更新日時</div>
      <div className="rag-table-cell rag-table-cell-size">サイズ</div>
      <div className="rag-table-cell rag-table-cell-status">ステータス</div>
      <div className="rag-table-cell rag-table-cell-actions"></div>
    </div>
    {/* テーブルボディ */}
    <div className="rag-table-body">
      {files.map(file => (
        <FileRow key={file.id} file={file} onDelete={onDelete} />
      ))}
    </div>
  </div>
);

// === メインコンポーネント ===
const RagSettings = ({ mockMode, userId, apiUrl, apiKey }) => {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);  // 削除確認用

  // 検索フィルタリング
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 擬似アップロード処理（ステータス遷移をシミュレート）
  const simulateUpload = useCallback((file) => {
    const newFile = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.name.split('.').pop().toLowerCase(),
      updatedAt: new Date().toISOString().split('T')[0],
      status: 'queued',
      chunkCount: null,
      errorMessage: null
    };

    setFiles(prev => [newFile, ...prev]);

    // queued → indexing (1秒後)
    setTimeout(() => {
      setFiles(prev => prev.map(f =>
        f.id === newFile.id ? { ...f, status: 'indexing' } : f
      ));
    }, 1000);

    // indexing → indexed (3秒後)
    setTimeout(() => {
      setFiles(prev => prev.map(f =>
        f.id === newFile.id ? {
          ...f,
          status: 'indexed',
          chunkCount: Math.floor(Math.random() * 200) + 50
        } : f
      ));
    }, 3000);
  }, []);

  // ファイルアップロード処理
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Adapter経由でアップロード（モックモードならMock IDが返る）
      await ChatServiceAdapter.uploadFile(file, { mockMode, userId, apiUrl, apiKey });
      simulateUpload(file);
    } catch (err) {
      console.error(err);
      // エラー時もUIには追加（status='error'で）
      const errorFile = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.name.split('.').pop().toLowerCase(),
        updatedAt: new Date().toISOString().split('T')[0],
        status: 'error',
        chunkCount: null,
        errorMessage: 'アップロードに失敗しました'
      };
      setFiles(prev => [errorFile, ...prev]);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // input をリセット
    }
  };

  // ドラッグ＆ドロップ処理
  // カウンターを使用してちらつきを防止（子要素へのドラッグ進入時のdragleave対策）
  const dragCounterRef = React.useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      simulateUpload(file);
    }
  }, [simulateUpload]);

  // 削除ボタンクリック → 確認ダイアログ表示
  const handleDeleteClick = (file) => {
    setDeleteTarget(file);
  };

  // 削除確認
  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      setFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  // 削除キャンセル
  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // 追加ボタンのクリック（隠し input をトリガー）
  const fileInputRef = React.useRef(null);
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="rag-container"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ドラッグ時のオーバーレイ */}
      {isDragOver && <DropZoneOverlay />}

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.md"
        disabled={isUploading}
      />

      {/* ツールバー */}
      <RagToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddClick={handleAddClick}
      />

      {/* ファイル一覧 */}
      <div className="rag-content-area">
        {filteredFiles.length > 0 ? (
          viewMode === 'grid' ? (
            <FileGrid files={filteredFiles} onDelete={handleDeleteClick} />
          ) : (
            <FileList files={filteredFiles} onDelete={handleDeleteClick} />
          )
        ) : (
          <div className="rag-empty-state">
            <Database size={40} className="rag-empty-icon" />
            <p className="rag-empty-text">
              {searchQuery ? '検索結果がありません' : 'ドキュメントがありません'}
            </p>
            <p className="rag-empty-subtext">
              {searchQuery ? '検索キーワードを変更してください' : 'ファイルをドロップまたは追加ボタンからアップロード'}
            </p>
          </div>
        )}
      </div>

      {/* フッター：ファイル数表示 */}
      <div className="rag-footer">
        <span className="rag-file-count-text">
          {filteredFiles.length} / {files.length} ファイル
          {files.filter(f => f.status === 'indexed').length > 0 && (
            <span className="rag-indexed-count">
              （{files.filter(f => f.status === 'indexed').length}件が学習完了）
            </span>
          )}
        </span>
      </div>

      {/* 削除確認ダイアログ */}
      {deleteTarget && (
        <DeleteConfirmDialog
          file={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default RagSettings;