// src/components/CitationList.jsx
import React from 'react';
import './styles/CitationList.css';
import { SourceIcon } from './FileIcons'; // FileIcons (複数形) からインポート

const CitationList = ({ citations, messageId }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!citations || citations.length === 0) return null;

  const groups = {
    web: { label: 'WEB', items: [] },
    rag: { label: '社内ナレッジ', items: [] },
    document: { label: '添付ファイル', items: [] },
  };

  citations.forEach((cite, index) => {
    const originalIndex = index + 1;
    const itemWithIndex = { ...cite, originalIndex };

    // type判定の正規化
    let type = cite.type || 'document';
    if (type === 'dataset') type = 'rag'; // Difyのdatasetはrag扱い

    if (groups[type]) {
      groups[type].items.push(itemWithIndex);
    } else {
      // 未知のタイプはdocumentに入れる
      groups['document'].items.push(itemWithIndex);
    }
  });

  const groupOrder = ['web', 'rag', 'document'];

  return (
    <div className="citation-container">
      <div
        className="citation-header-label collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>出典 ({citations.length})</span>
        <svg
          className={`citation-toggle-icon ${isOpen ? 'open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="citation-groups">
          {groupOrder.map(groupKey => {
            const group = groups[groupKey];
            if (group.items.length === 0) return null;

            return (
              <div key={groupKey} className="citation-group">
                <div className="citation-group-label">{group.label}</div>
                <div className="citation-list">
                  {group.items.map((cite) => {
                    const Wrapper = cite.url ? 'a' : 'div';
                    const props = cite.url
                      ? { href: cite.url, target: '_blank', rel: 'noopener noreferrer' }
                      : {};

                    return (
                      <Wrapper
                        key={cite.originalIndex}
                        id={`citation-${messageId}-${cite.originalIndex}`}
                        className="citation-item"
                        {...props}
                      >
                        {/* 左側: 番号バッジ */}
                        <div className="citation-number-badge">
                          {cite.originalIndex}
                        </div>

                        {/* 中央: ファイル/ソース種別アイコン (ここを追加) */}
                        <div className="citation-icon-wrapper">
                          <SourceIcon
                            type={cite.type === 'dataset' ? 'rag' : cite.type}
                            source={cite.source}
                            url={cite.url}
                            className="citation-icon-img"
                          />
                        </div>

                        {/* 右側: テキスト情報 */}
                        <div className="citation-content">
                          <div className="citation-source" title={cite.source}>
                            {/* 表示上の[1]などを除去してタイトルのみ表示 */}
                            {cite.source.replace(/^\[\d+\]\s*/, '')}
                          </div>
                          {cite.url && <div className="citation-url">{cite.url}</div>}
                        </div>
                      </Wrapper>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CitationList;