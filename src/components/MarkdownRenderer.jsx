// src/components/MarkdownRenderer.jsx
import React, { useState, useEffect, useRef } from 'react';
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
      const parts = child.split(/(\[\d+\])/g);
      parts.forEach((part, j) => {
        if (/^\[\d+\]$/.test(part)) {
          const numberStr = part.replace(/[\[\]]/g, '');
          const number = parseInt(numberStr, 10);

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
          } else {
            newChildren.push(part);
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
  const [displayMode, setDisplayMode] = useState(isStreaming ? 'streaming' : 'done');
  const [typedContent, setTypedContent] = useState('');

  const prevStreamingRef = useRef(isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setDisplayMode('streaming');
      setTypedContent('');
    }
    else if (prevStreamingRef.current === true && isStreaming === false) {
      setDisplayMode('typing');
      let currentIndex = 0;
      const fullText = content || '';

      // --- UX改善: 高速タイピング設定 ---
      const typingInterval = 5; // 更新間隔 (ms)
      const charsPerTick = 3;   // 一度の更新で進める文字数

      const intervalId = setInterval(() => {
        if (currentIndex < fullText.length) {
          currentIndex += charsPerTick;
          // インデックスが長さを超えないようにクランプ
          const nextIndex = Math.min(currentIndex, fullText.length);
          setTypedContent(fullText.substring(0, nextIndex));

          if (nextIndex >= fullText.length) {
            clearInterval(intervalId);
            setDisplayMode('done');
          }
        } else {
          clearInterval(intervalId);
          setDisplayMode('done');
        }
      }, typingInterval);

      return () => clearInterval(intervalId);
    }
    else if (displayMode === 'streaming' && !isStreaming) {
      setDisplayMode('done');
    }

    prevStreamingRef.current = isStreaming;
  }, [isStreaming, content]);

  if (displayMode === 'streaming') {
    return <div className="markdown-renderer blinking-cursor"></div>;
  }

  if (displayMode === 'typing') {
    return (
      <div className="markdown-renderer">
        <span style={{ whiteSpace: 'pre-wrap' }}>{typedContent}</span>
        <span className="blinking-cursor"></span>
      </div>
    );
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