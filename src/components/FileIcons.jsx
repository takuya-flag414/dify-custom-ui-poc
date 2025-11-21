// src/components/FileIcons.jsx
import React, { useState } from 'react';
import FileIcon from './FileIcon'; // 既存のリッチアイコンコンポーネント

/* --- SVG Icons for Non-File Sources --- */

// 🌐 Web (Fallback)
const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

// 🏛️ RAG (Internal)
const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

/**
 * ソースタイプに応じて適切なアイコンを表示する統合コンポーネント
 * Webの場合はFavicon取得を試み、失敗したらGlobeIconを表示する
 */
export const SourceIcon = ({ type, source, url, className = "w-6 h-6" }) => {
  const [faviconError, setFaviconError] = useState(false);

  // 1. Web (External)
  if (type === 'web') {
    // URLがある場合はFaviconを表示
    if (url && !faviconError) {
      const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${new URL(url).origin}`;
      return (
        <img 
          src={faviconUrl} 
          alt="favicon" 
          className={className} 
          onError={() => setFaviconError(true)}
          style={{ borderRadius: '4px', objectFit: 'contain' }}
        />
      );
    }
    
    // URLがない、またはFavicon取得エラー時はフォールバックアイコン
    return (
      <div 
        className={className}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#F3F4F6', // Gray-100
          color: '#6B7280',           // Gray-500
          borderRadius: '6px'
        }}
      >
        <GlobeIcon />
      </div>
    );
  }
  
  // 2. RAG (Internal Knowledge)
  if (type === 'rag') {
    return (
      <div 
        className={className}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#F3E8FF', // Purple-100
          color: '#9333EA',           // Purple-600
          borderRadius: '6px'
        }}
      >
        <DatabaseIcon />
      </div>
    );
  }

  // 3. Document / File (Upload) -> 既存のFileIconに委譲
  return <FileIcon filename={source} className={className} />;
};