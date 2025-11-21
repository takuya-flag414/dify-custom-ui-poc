// src/components/FileIcons.jsx
import React from 'react';
import FileIcon from './FileIcon'; // 既存のコンポーネントを活用

/* --- SVG Icon Definitions for Non-File Sources --- */

// 🌐 Web (Web Search)
const GlobeIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

// 🏛️ RAG (Internal Knowledge) - Database
const DatabaseIcon = () => (
  <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

/**
 * ソースタイプに応じて適切なアイコンを表示する統合コンポーネント
 * @param {string} type - 'web' | 'rag' | 'document' (or 'file')
 * @param {string} source - ファイル名 または ソース名
 * @param {string} className - 追加スタイル
 */
export const SourceIcon = ({ type, source, className = "" }) => {
  // 1. Webの場合
  if (type === 'web') {
    return (
      <div 
        className={className} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'var(--color-bg-body)', 
          color: 'var(--color-text-sub)', 
          borderRadius: '6px', // FileIconの形状に寄せる
          width: '24px', 
          height: '24px' 
        }}
        title="Web検索"
      >
        <GlobeIcon />
      </div>
    );
  }
  
  // 2. RAG (内部ナレッジ) の場合
  if (type === 'rag') {
    return (
      <div 
        className={className}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#F3E8FF', // Purple Background
          color: '#9333EA',           // Purple Text
          borderRadius: '6px',
          width: '24px', 
          height: '24px' 
        }}
        title="社内ナレッジ (RAG)"
      >
        <DatabaseIcon />
      </div>
    );
  }

  // 3. Document (アップロードファイル) の場合 -> 既存のFileIconを活用
  return <FileIcon filename={source} className={className} />;
};