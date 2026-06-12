import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomBot, BotVisibility } from '../../types/customBot';
import StoreSelectorModal, { Store } from '../Shared/StoreSelectorModal';
import './CustomBotModal.css';
import { X, Loader2, Upload, Database, Paperclip, CheckCircle2, XCircle, CloudUpload } from 'lucide-react';


interface CustomBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  botToEdit?: CustomBot | null;
  customBotsApi: any;
  stores?: Store[];
  isStoresLoading?: boolean;
}

export const CustomBotModal: React.FC<CustomBotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  botToEdit,
  customBotsApi,
  stores = [],
  isStoresLoading = false
}) => {
  // --- 基本情報フォーム ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [visibility, setVisibility] = useState<BotVisibility>('private');

  // --- ナレッジ設定 ---
  // RAG（Gemini Store）選択
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);

  // コンテキストファイル
  const [files, setFiles] = useState<File[]>([]);
  const [existingFileUrls, setExistingFileUrls] = useState<string[]>([]);

  // --- UI状態 ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // botToEdit または isOpen の変更時にフォームを初期化・復元
  useEffect(() => {
    if (isOpen) {
      if (botToEdit) {
        // --- 編集モード: 既存値を復元 ---
        setName(botToEdit.name);
        setDescription(botToEdit.description);
        setSystemPrompt(botToEdit.system_prompt);
        setVisibility(botToEdit.visibility);

        // ナレッジ設定の復元（RAG）
        if (botToEdit.rag_config?.enabled && botToEdit.rag_config.target_store_id) {
          setSelectedStore({
            id: botToEdit.rag_config.target_store_id,
            display_name: botToEdit.rag_config.target_store_name || botToEdit.rag_config.target_store_id,
          });
        } else {
          setSelectedStore(null);
        }

        // ナレッジ設定の復元（ファイル）
        // マイグレーション対応: 古い context_file_url があれば配列の先頭に入れる
        const urls = botToEdit.context_file_urls || (botToEdit.context_file_url ? [botToEdit.context_file_url] : []);
        setExistingFileUrls(urls);
        setFiles([]);
      } else {
        // --- 新規作成モード: 全フィールドをリセット ---
        setName('');
        setDescription('');
        setSystemPrompt('');
        setVisibility('private');
        setSelectedStore(null);
        setExistingFileUrls([]);
        setFiles([]);
      }
    }
  }, [botToEdit, isOpen]);

  if (typeof window === 'undefined') return null;

  // ファイルURLからファイル名を抽出するヘルパー
  const getFileNameFromUrl = (url: string): string => {
    const parts = url.split('/');
    const rawName = parts[parts.length - 1] || url;
    // タイムスタンププレフィックス（例: "1234567890_filename.pdf"）を除去
    return rawName.replace(/^\d+_/, '');
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
  };

  const handleClearRag = () => {
    setSelectedStore(null);
  };

  const handleRemoveExistingFile = (urlToRemove: string) => {
    setExistingFileUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let context_file_urls: string[] = [...existingFileUrls];
      let rag_config: CustomBot['rag_config'];

      // RAGの処理
      if (selectedStore) {
        rag_config = {
          enabled: true,
          target_store_id: selectedStore.id,
          target_store_name: selectedStore.display_name,
        };
      }

      // ファイルの処理（新規アップロード）
      if (files.length > 0) {
        // 並列で全ファイルをアップロード
        const uploadPromises = files.map(f => customBotsApi.uploadContextFile(f));
        const uploadedUrls = await Promise.all(uploadPromises);
        context_file_urls = [...context_file_urls, ...uploadedUrls];
      }

      const botData: Partial<CustomBot> = {
        name,
        description,
        system_prompt: systemPrompt,
        visibility,
        rag_config: rag_config ?? undefined,
        context_file_urls: context_file_urls.length > 0 ? context_file_urls : undefined,
      };

      if (botToEdit) {
        await customBotsApi.updateBot(botToEdit.bot_id, botData);
      } else {
        await customBotsApi.createBot(botData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save bot', error);
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="custom-bot-modal-overlay" onClick={onClose}>
            <motion.div
              className="custom-bot-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {/* Mac風タイトルバーヘッダー */}
              <div className="modal-header-mac">
                <h2 className="modal-title-mac">
                  {botToEdit ? 'ボットを編集' : '新しいボットを作成'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                {/* ボット名 */}
                <div className="form-group">
                  <label>ボット名 <span className="required">*</span></label>
                  <input
                    className="glass-input"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="例: 営業提案アシスタント"
                  />
                </div>

                {/* 説明 */}
                <div className="form-group">
                  <label>説明</label>
                  <textarea
                    className="glass-input"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="ボットの目的や使い方を簡潔に"
                    rows={2}
                  />
                </div>

                {/* システムプロンプト */}
                <div className="form-group">
                  <label>システムプロンプト <span className="required">*</span></label>
                  <textarea
                    className="glass-input"
                    required
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    placeholder="あなたは〇〇です。××のように振る舞い..."
                    rows={4}
                  />
                </div>

                {/* ナレッジ設定（RAG/ファイル）*/}
                <div className="form-group">
                  <label>
                    ナレッジ設定（オプション）
                    <span className="knowledge-label-hint">共有データとファイルのアップロードは併用できます</span>
                  </label>
                  <div className="knowledge-section">
                    
                    {/* 事前定義RAGセクション */}
                    <div className="knowledge-panel">
                      <div className="knowledge-panel-header">
                        <Database size={14} className="icon-rag" />
                        <span className="knowledge-panel-title">社内共有データ</span>
                      </div>
                      {selectedStore ? (
                        <div className="selected-store-badge">
                          <CheckCircle2 size={15} className="check-icon" />
                          <span className="store-name">{selectedStore.display_name}</span>
                          <button
                            type="button"
                            className="clear-btn"
                            onClick={handleClearRag}
                            title="選択を解除"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="select-store-btn"
                          onClick={() => setIsStoreSelectorOpen(true)}
                        >
                          <Database size={16} />
                          ナレッジを選択...
                        </button>
                      )}
                      <p className="knowledge-hint">
                        登録済みの社内データ（マニュアルや規程等）をボットの知識として設定します。
                      </p>
                    </div>

                    <div className="knowledge-divider" />

                    {/* コンテキストファイルセクション */}
                    <div className="knowledge-panel">
                      <div className="knowledge-panel-header">
                        <Paperclip size={14} className="icon-file" />
                        <span className="knowledge-panel-title">コンテキストファイル</span>
                      </div>
                      {/* アップロード済み/選択済みファイルリスト */}
                      {(existingFileUrls.length > 0 || files.length > 0) && (
                        <div className="file-list">
                          {existingFileUrls.map((url, i) => (
                            <div key={`existing-${i}`} className="file-list-item existing-file-badge">
                              <Paperclip size={13} />
                              <span>{getFileNameFromUrl(url)}</span>
                              <button
                                type="button"
                                className="clear-btn"
                                onClick={() => handleRemoveExistingFile(url)}
                                title="ファイルを削除"
                              >
                                <XCircle size={15} />
                              </button>
                            </div>
                          ))}
                          {files.map((f, i) => (
                            <div key={`new-${i}`} className="file-list-item new-file-badge">
                              <Paperclip size={13} />
                              <span>{f.name}</span>
                              <button
                                type="button"
                                className="clear-btn"
                                onClick={() => handleRemoveNewFile(i)}
                                title="アップロードをキャンセル"
                              >
                                <XCircle size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 新規ファイル選択 */}
                      <div 
                        className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          id="bot-file-upload"
                          className="hidden-file-input"
                          multiple
                          accept=".pdf,.docx,.doc,.txt,.md"
                          onChange={e => {
                            if (e.target.files && e.target.files.length > 0) {
                              const selectedFiles = Array.from(e.target.files);
                              setFiles(prev => [...prev, ...selectedFiles]);
                              e.target.value = ''; // 入力リセットで同じファイルを再選択可能に
                            }
                          }}
                        />
                        <label htmlFor="bot-file-upload" className="file-upload-label-new">
                          <CloudUpload size={32} className="upload-icon-main" />
                          <div className="upload-text-group">
                            <span className="upload-text-primary">クリック、またはここにファイルをドラッグ＆ドロップ</span>
                            <span className="upload-text-secondary">対応形式: PDF, DOCX, TXT, MD 等</span>
                          </div>
                        </label>
                      </div>
                      <p className="knowledge-hint">
                        手元のファイルをアップロードして、ボット固有の知識として追加します。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 共有設定 */}
                <div className="form-group">
                  <label>共有設定</label>
                  <select
                    className="glass-input"
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as BotVisibility)}
                  >
                    <option value="private">非公開（自分のみ）</option>
                    <option value="department">部署内に共有</option>
                    <option value="public">全社に公開</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button type="button" className="modal-cancel-btn" onClick={onClose} disabled={isSubmitting}>
                    キャンセル
                  </button>
                  <button type="submit" className="modal-save-btn" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="icon-spin" size={16} /> : '保存する'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* StoreSelectorModal（Portal内でレンダリング） */}
      <StoreSelectorModal
        isOpen={isStoreSelectorOpen}
        onClose={() => setIsStoreSelectorOpen(false)}
        onSelect={(store) => {
          handleStoreSelect(store);
          setIsStoreSelectorOpen(false);
        }}
        stores={stores}
        isLoading={isStoresLoading}
      />
    </>,
    document.body
  );
};
