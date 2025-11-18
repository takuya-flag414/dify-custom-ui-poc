// src/components/CitationItem.jsx
import React from 'react';
import './styles/MessageBlock.css'; // スタイルを共有

/**
 * 1つの出典を表示 (ファビコン・タイトル対応) (T-09, P-3)
 * @param {object} citation - 出典オブジェクト (ChatArea.jsxで生成)
 * (e.g., { id: '...', type: 'web', source: '[1] サイトタイトル', url: 'https://...' })
 * (e.g., { id: '...', type: 'file', source: '[2] ファイル名.pdf', url: null })
 */
const CitationItem = ({ citation }) => {
  const { type, source, url } = citation;

  /**
   * URLからファビコンAPIのURLを生成するヘルパー
   * @param {string} itemUrl - 出典のURL
   * @returns {string | null} ファビコン画像のURL
   */
  const getFaviconUrl = (itemUrl) => {
    if (!itemUrl) return null;
    try {
      // Googleのファビコンサービスを利用 (sz=32 で 32x32 px)
      const urlObj = new URL(itemUrl);
      return `https://www.google.com/s2/favicons?sz=32&domain_url=${urlObj.origin}`;
    } catch (e) {
      console.warn('[CitationItem] Invalid URL for favicon:', itemUrl);
      return null;
    }
  };

  // typeが'web'かつurlが存在する場合のみファビコンを取得
  const faviconUrl = type === 'web' ? getFaviconUrl(url) : null;

  // ファイルアイコン (typeが'file'の場合の代替)
  const FileIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      // インラインスタイルでファビコンと外観を合わせる
      style={{ 
        marginRight: '8px', 
        flexShrink: 0, 
        width: '16px', 
        height: '16px' 
      }}
    >
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="citation-item">
      {/* アイコン表示エリア */}
      {faviconUrl ? (
        <img
          src={faviconUrl}
          alt="favicon"
          className="citation-favicon"
          // 取得失敗時(404等)は非表示にし、ファイルアイコンも表示しない
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        // Webでない (file) 場合はファイルアイコンを表示
        type === 'file' && <FileIcon />
      )}

      {/* テキスト表示エリア */}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="citation-link"
          title={url} // ホバー時にフルのURLを表示
        >
          {source} {/* 例: [1] Dify APIドキュメント */}
        </a>
      ) : (
        <span className="citation-text">
          {source} {/* 例: [2] FEモック.pdf */}
        </span>
      )}
    </div>
  );
};

export default CitationItem;