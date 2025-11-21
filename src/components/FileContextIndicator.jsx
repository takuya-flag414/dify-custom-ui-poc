// src/components/FileContextIndicator.jsx
import React from 'react';
import './styles/FileContextIndicator.css';
// ★修正: FileIconを使用
import FileIcon from './FileIcon';

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FileContextIndicator = ({ file, onClear }) => {
  if (!file) return null;

  return (
    <div className="file-context-indicator" role="status" aria-live="polite">
      <div className="file-context-content">
        {/* ★修正: FileIconを表示 */}
        <div className="file-context-icon-wrapper">
           <FileIcon filename={file.name} className="w-6 h-6" />
        </div>
        <span className="file-context-name" title={file.name}>
          {file.name}
        </span>
        <span className="file-context-status">
          <LockIcon />
          会話中 (Sticky Mode)
        </span>
      </div>
      <button 
        className="file-context-close" 
        onClick={onClear}
        aria-label="ファイルの参照を解除してWeb検索モードに戻る"
        title="ファイルの参照を解除"
      >
        <XIcon />
      </button>
    </div>
  );
};

export default FileContextIndicator;