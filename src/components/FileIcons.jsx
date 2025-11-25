// src/components/FileIcons.jsx
import React, { useState } from 'react';
import FileIcon from './FileIcon';

// 共通SVG設定
const svgProps = {
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
};

/* --- Non-File Icons (Web / RAG) --- */

// 🌐 Web (Fallback)
const GlobeIcon = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="10" stroke="#6366F1" strokeWidth="2" />
    <line x1="2" y1="12" x2="22" y2="12" stroke="#6366F1" strokeWidth="2" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#6366F1" strokeWidth="2" />
  </svg>
);

// 🏛️ RAG (Internal Database)
const DatabaseIcon = () => (
  <svg {...svgProps}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="#9333EA" strokeWidth="2" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="#9333EA" strokeWidth="2" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="#9333EA" strokeWidth="2" />
  </svg>
);

/**
 * SourceIcon: タイプとソース名から適切なアイコンを返す
 */
export const SourceIcon = ({ type, source, url, className = "citation-icon-img" }) => {
  const [faviconError, setFaviconError] = useState(false);

  // 1. Web (External)
  if (type === 'web') {
    if (url && !faviconError) {
      // Google S2 Favicon API
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
    return <div className={className} style={{ color: '#6366F1' }}><GlobeIcon /></div>;
  }

  // 2. RAG (Internal Knowledge)
  // typeが'rag' または 'dataset' の場合にデータベースアイコンを表示
  if (type === 'rag' || type === 'dataset') {
    return <div className={className} style={{ color: '#9333EA' }}><DatabaseIcon /></div>;
  }

  // 3. Document / File (Extension based)
  // FileIconコンポーネントを使用して統一されたデザインを提供
  return (
    <div className={className}>
      <FileIcon filename={source || 'file'} className="w-5 h-5" />
    </div>
  );
};

export default SourceIcon;