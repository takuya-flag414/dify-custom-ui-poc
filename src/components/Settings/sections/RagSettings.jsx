// src/components/Settings/sections/RagSettings.jsx
import React, { useState } from 'react';
import { UploadCloud, FileText, Trash2, Database } from 'lucide-react';
import { ChatServiceAdapter } from '../../../services/ChatServiceAdapter'; // アップロード用
import './SettingsComponents.css';

const RagSettings = ({ mockMode, userId, apiUrl, apiKey }) => {
  // Phase 1ではUIのみのMock実装 (実際のベクトルDB連携はStep 1の範囲外だが、Adapter経由で動くふりをする)
  const [files, setFiles] = useState([
    { id: 'mock-1', name: '社内規定.pdf', size: '1.2MB', date: '2023-10-01' },
    { id: 'mock-2', name: '製品マニュアル_v2.docx', size: '3.4MB', date: '2023-10-05' },
  ]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Adapter経由でアップロード（FEモードならMock IDが返る）
      const res = await ChatServiceAdapter.uploadFile(file, { mockMode, userId, apiUrl, apiKey });
      
      const newFile = {
        id: res.id,
        name: res.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        date: new Date().toISOString().split('T')[0]
      };
      
      setFiles(prev => [newFile, ...prev]);
    } catch (err) {
      console.error(err);
      alert('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
       
       <div className="settings-card">
         <div className="settings-card-header">
           <h3 className="settings-card-title flex items-center gap-2">
             <Database size={18} className="text-[var(--color-primary)]"/>
             Knowledge Base
           </h3>
           <p className="settings-card-description">
             AIが参照する社内ドキュメントを管理します。
           </p>
         </div>

         <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:bg-[var(--color-bg-body)] transition-colors cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-sub)]">
              <UploadCloud size={32} />
              {isUploading ? (
                <span className="text-sm font-medium">アップロード中...</span>
              ) : (
                <>
                  <span className="text-sm font-medium">クリックしてファイルをアップロード</span>
                  <span className="text-xs">PDF, DOCX, TXT (Max 10MB)</span>
                </>
              )}
            </div>
         </div>
       </div>

       <div className="settings-card">
         <h4 className="text-sm font-bold text-[var(--color-text-main)] mb-3">
           インデックス済みファイル ({files.length})
         </h4>
         <div className="flex flex-col gap-2">
           {files.map(file => (
             <div key={file.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-body)] rounded-lg border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-[var(--color-border)]">
                    <FileText size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">{file.name}</p>
                    <p className="text-xs text-[var(--color-text-sub)]">{file.size} • {file.date}</p>
                  </div>
                </div>
                <button 
                  className="p-2 text-[var(--color-text-sub)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash2 size={16} />
                </button>
             </div>
           ))}
           {files.length === 0 && (
             <p className="text-center text-sm text-[var(--color-text-sub)] py-4">ファイルはありません</p>
           )}
         </div>
       </div>

    </div>
  );
};

export default RagSettings;