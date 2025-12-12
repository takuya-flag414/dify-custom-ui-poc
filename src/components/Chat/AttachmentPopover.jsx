// src/components/Chat/AttachmentPopover.jsx
import React from 'react';
import './AttachmentPopover.css';
import FileIcon from '../Shared/FileIcon';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const AttachmentPopover = ({
  activeContextFiles = [], // ★変更: sessionFiles から activeContextFiles へ
  selectedFiles = [],
  onRemoveSelected,
  onAddFileClick,
  onClose,
  isLoading
}) => {
  const hasHistory = activeContextFiles.length > 0;
  const hasPending = selectedFiles.length > 0;
  const isEmpty = !hasHistory && !hasPending;

  return (
    <div className="attachment-popover" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="popover-header">
        <span className="popover-title">参照ファイル</span>
        <button className="popover-close-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {/* Content */}
      <div className="popover-content">
        {isEmpty ? (
          <div className="empty-state">
            参照しているファイルはありません
          </div>
        ) : (
          <>
            {/* History Section (Locked) */}
            {hasHistory && (
              <div className="file-section">
                <div className="section-label">送信済み (履歴)</div>
                {activeContextFiles.map((file, index) => (
                  <div key={`hist-${index}`} className="popover-file-item history">
                    <FileIcon filename={file.name} className="w-5 h-5 text-gray-500" />
                    <div className="file-info">
                      <span className="file-name" title={file.name}>{file.name}</span>
                      <span className="file-status">コンテキストとして保持中</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Section (Editable) */}
            {hasPending && (
              <div className="file-section">
                <div className="section-label">送信待ち</div>
                {selectedFiles.map((file, index) => (
                  <div key={`pend-${index}`} className="popover-file-item pending">
                    <FileIcon filename={file.name} className="w-5 h-5 text-blue-500" />
                    <div className="file-info">
                      <span className="file-name" title={file.name}>{file.name}</span>
                      <span className="file-status">次回メッセージで送信</span>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => onRemoveSelected(index)}
                      title="削除"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="popover-footer">
        <button className="add-file-btn" onClick={onAddFileClick} disabled={isLoading}>
          <AddIcon />
          ファイルを追加
        </button>
      </div>
    </div>
  );
};

export default AttachmentPopover;