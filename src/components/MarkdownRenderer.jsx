// src/components/MarkdownRenderer.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourceIcon } from './FileIcons';
import './styles/MessageBlock.css';

/**
 * インライン出典 [1] をクリック可能なバッジに変換
 */
const renderWithInlineCitations = (children, citations, messageId) => {
  if (!children) return null;
  const childrenArray = Array.isArray(children) ? children : [children];
  const newChildren = [];
  const citationCount = citations ? citations.length : 0;

  childrenArray.forEach((child, i) => {
    if (typeof child === 'string') {
      // [1] や [12] を検出して分割
      const parts = child.split(/(\[\d+\])/g);
      parts.forEach((part, j) => {
        if (/^\[\d+\]$/.test(part)) {
          const numberStr = part.replace(/[\[\]]/g, '');
          const number = parseInt(numberStr, 10);

          // 有効な出典番号であればバッジ化
          if (number > 0 && number <= citationCount) {
            const citation = citations[number - 1];

            newChildren.push(
              <span key={`${i}-${j}`} className="citation-badge-wrapper">
                <a
                  href={`#citation-${messageId}-${number}`}
                  className="citation-badge"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(`citation-${messageId}-${number}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('highlight-citation');
                      setTimeout(() => el.classList.remove('highlight-citation'), 2000);
                    }
                  }}
                >
                  {number}
                </a>

                {/* ホバー時に表示するツールチップ */}
                <div className="citation-tooltip">
                  <div className="citation-tooltip-content">
                    <div className="citation-tooltip-icon">
                      <SourceIcon
                        type={citation.type === 'dataset' ? 'rag' : citation.type}
                        source={citation.source}
                        url={citation.url}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="citation-tooltip-text">
                      <div className="citation-tooltip-title">
                        {citation.source.replace(/^\[\d+\]\s*/, '')}
                      </div>
                      {citation.url && (
                        <div className="citation-tooltip-url">{citation.url}</div>
                      )}
                    </div>
                  </div>
                </div>
              </span>
            );
          }
        } else if (part) {
          newChildren.push(part);
        }
      });
    } else {
      newChildren.push(child);
    }
  });
  return newChildren;
};

const MarkdownRenderer = ({ content, isStreaming = false, citations = [], messageId }) => {
  if (isStreaming) {
    return <div className="markdown-renderer blinking-cursor">{content}</div>;
  }

  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          p: ({ node, children, ...props }) => {
            const processed = renderWithInlineCitations(children, citations, messageId);
            return <p {...props}>{processed}</p>;
          },
          li: ({ node, children, ...props }) => {
            const processed = renderWithInlineCitations(children, citations, messageId);
            return <li {...props}>{processed}</li>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);