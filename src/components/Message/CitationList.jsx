// src/components/Message/CitationList.jsx
import React from 'react';
import './CitationList.css';
import { SourceIcon } from '../Shared/FileIcons';

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
    if (type === 'dataset') type = 'rag';

    if (groups[type]) {
      groups[type].items.push(itemWithIndex);
    } else {
      groups['document'].items.push(itemWithIndex);
    }
  });

  const groupOrder = ['web', 'rag', 'document'];
  const hasItems = groupOrder.some(key => groups[key].items.length > 0);

  if (!hasItems) return null;

  return (
    <div className="citation-container">
      {/* Header (Toggle) */}
      <div
        className="citation-header-label collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
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

      {/* Accordion Animation Wrapper (CSS Grid Transition) */}
      <div className={`citation-accordion-grid ${isOpen ? 'expanded' : ''}`}>
        <div className="citation-accordion-overflow">
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
                          {/* 1. Badge */}
                          <div className="citation-number-badge">
                            {cite.originalIndex}
                          </div>

                          {/* 2. Icon */}
                          <div className="citation-icon-wrapper">
                            <SourceIcon
                              type={cite.type === 'dataset' ? 'rag' : cite.type}
                              source={cite.source}
                              url={cite.url}
                              className="citation-icon-img"
                            />
                          </div>

                          {/* 3. Text */}
                          <div className="citation-content">
                            <div className="citation-source" title={cite.source}>
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
        </div>
      </div>
    </div>
  );
};

export default CitationList;