// src/components/CitationList.jsx
import React from 'react';
import './styles/CitationList.css';
import { SourceIcon } from './FileIcons';

const CitationList = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  // グルーピング処理
  const groups = {
    web: { label: 'WEB', items: [] },
    rag: { label: '社内ナレッジ', items: [] },
    document: { label: '添付ファイル', items: [] },
  };

  citations.forEach(cite => {
    // typeが不明な場合は document にフォールバック、または適宜振り分け
    const type = cite.type || 'document';
    if (groups[type]) {
      groups[type].items.push(cite);
    } else {
      // 未定義のtypeはdocument扱い（またはその他）
      groups.document.items.push(cite);
    }
  });

  // 表示順序: Web -> RAG -> Document
  const groupOrder = ['web', 'rag', 'document'];

  return (
    <div className="citation-container">
      <div className="citation-header-label">出典</div>
      
      <div className="citation-groups">
        {groupOrder.map(groupKey => {
          const group = groups[groupKey];
          if (group.items.length === 0) return null;

          return (
            <div key={groupKey} className="citation-group">
              <div className="citation-group-label">{group.label}</div>
              <div className="citation-list">
                {group.items.map((cite, index) => {
                  const Wrapper = cite.url ? 'a' : 'div';
                  const props = cite.url 
                    ? { href: cite.url, target: '_blank', rel: 'noopener noreferrer' } 
                    : {};

                  return (
                    <Wrapper 
                      key={cite.id || index} 
                      className="citation-item" 
                      {...props}
                    >
                      <div className="citation-icon-wrapper">
                        <SourceIcon 
                          type={cite.type} 
                          source={cite.source} 
                          url={cite.url}
                          className="citation-icon-img"
                        />
                      </div>
                      <span className="citation-source" title={cite.source}>
                        {cite.source}
                      </span>
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CitationList;