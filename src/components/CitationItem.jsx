// src/components/CitationItem.jsx
import React from 'react';
import './styles/MessageBlock.css'; // .citation-item 等の定義を利用

const CitationItem = ({ citation }) => {
  const { type, source, url } = citation;

  const getFaviconUrl = (itemUrl) => {
    if (!itemUrl) return null;
    try {
      const urlObj = new URL(itemUrl);
      return `https://www.google.com/s2/favicons?sz=32&domain_url=${urlObj.origin}`;
    } catch (e) {
      return null;
    }
  };

  const faviconUrl = type === 'web' ? getFaviconUrl(url) : null;

  return (
    <a 
      href={url || '#'} 
      className="citation-item"
      target={url ? "_blank" : undefined}
      rel={url ? "noopener noreferrer" : undefined}
      onClick={(e) => !url && e.preventDefault()} // URLがない場合(ファイル)はクリック無効
      title={source}
    >
      {/* Icon */}
      {faviconUrl ? (
        <img
          src={faviconUrl}
          alt="icon"
          className="citation-favicon"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        // Fallback / File Icon (SVG)
        <svg className="citation-favicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}

      {/* Text */}
      <span className="citation-link">
        {source}
      </span>
    </a>
  );
};

export default CitationItem;