// src/components/Shared/MarkdownRenderer.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourceIcon } from './FileIcons';
import '../Message/MessageBlock.css';
import { useLogger } from '../../hooks/useLogger';
import SecureVaultService, { TOKEN_PATTERN } from '../../services/SecureVaultService';
import RestoredToken from '../Message/RestoredToken';

// --- Helper: Inline Citation Renderer ---
// (renderWithInlineCitations, LoggedElement, CodeBlock は変更なしのため省略。元のコードを維持してください)
const renderWithInlineCitations = (children, citations, messageId) => {
  if (!children) return null;
  const childrenArray = Array.isArray(children) ? children : [children];
  const newChildren = [];
  const citationCount = citations ? citations.length : 0;

  childrenArray.forEach((child, i) => {
    if (typeof child === 'string') {
      // 変更点: [1, 2] のようにカンマ区切りで複数の数字が含まれるケースに対応
      const parts = child.split(/(\[\s*\d+(?:\s*,\s*\d+)*\s*\])/g);
      parts.forEach((part, j) => {
        if (/^\[\s*\d+(?:\s*,\s*\d+)*\s*\]$/.test(part)) {
          const numbersStr = part.replace(/[\[\]]/g, '');
          const numberItems = numbersStr.split(',');

          const groupNodes = [];

          numberItems.forEach((nStr, k) => {
            const number = parseInt(nStr.trim(), 10);

            if (number > 0 && number <= citationCount) {
              const citation = citations[number - 1];
              groupNodes.push(
                <span key={`${i}-${j}-${k}`} className="citation-badge-wrapper">
                  <a
                    href={`#citation-${messageId}-${number}`}
                    className="citation-badge"
                    onClick={(e) => {
                      e.preventDefault();

                      // ★Phase 3: InspectorPanel連携用イベントを発火
                      const inspectorEvent = new CustomEvent('openInspectorCitation', {
                        detail: { citationIndex: number, messageId }
                      });
                      window.dispatchEvent(inspectorEvent);

                      // 従来の出典リスト展開も維持（フォールバック）
                      const expandEvent = new CustomEvent('expandCitationList', {
                        detail: { messageId }
                      });
                      window.dispatchEvent(expandEvent);

                      // アコーディオン展開アニメーション後にスクロール（従来のチャット内CitationList用）
                      setTimeout(() => {
                        const el = document.getElementById(`citation-${messageId}-${number}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('highlight-citation');
                          setTimeout(() => el.classList.remove('highlight-citation'), 2000);
                        }
                      }, 350);
                    }}
                  >
                    {number}
                  </a>
                  {citation.url ? (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="citation-tooltip citation-tooltip-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="citation-tooltip-content">
                        <span className="citation-tooltip-icon">
                          <SourceIcon
                            type={citation.type === 'dataset' ? 'rag' : citation.type}
                            source={citation.source}
                            url={citation.url}
                            className="w-4 h-4"
                          />
                        </span>
                        <span className="citation-tooltip-text">
                          <span className="citation-tooltip-title" style={{ display: 'block' }}>
                            {citation.source.replace(/^\[\d+\]\s*/, '')}
                          </span>
                          <span className="citation-tooltip-url" style={{ display: 'block' }}>{citation.url}</span>
                        </span>
                      </span>
                    </a>
                  ) : (
                    <span className="citation-tooltip">
                      <span className="citation-tooltip-content">
                        <span className="citation-tooltip-icon">
                          <SourceIcon
                            type={citation.type === 'dataset' ? 'rag' : citation.type}
                            source={citation.source}
                            url={citation.url}
                            className="w-4 h-4"
                          />
                        </span>
                        <span className="citation-tooltip-text">
                          <span className="citation-tooltip-title" style={{ display: 'block' }}>
                            {citation.source.replace(/^\[\d+\]\s*/, '')}
                          </span>
                        </span>
                      </span>
                    </span>
                  )}
                </span>
              );
            } else {
              groupNodes.push(<span key={`${i}-${j}-${k}-invalid`}>{nStr}</span>);
            }

            // 複数のバッジの間の隙間を少し空ける
            if (k < numberItems.length - 1) {
              groupNodes.push(<span key={`${i}-${j}-${k}-space`} className="citation-comma"> </span>);
            }
          });

          newChildren.push(
            <span key={`${i}-${j}-group`} className="inline-citation-group">
              {groupNodes}
            </span>
          );
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

// --- Helper: Restored Token Renderer ---
// SecureVault のトークン ({{CATEGORY_INDEX}}) を RestoredToken コンポーネントに置換
const renderWithRestoredTokens = (children) => {
  if (!children) return null;
  const childrenArray = Array.isArray(children) ? children : [children];
  const newChildren = [];

  childrenArray.forEach((child, i) => {
    if (typeof child === 'string') {
      const tokenRegex = /\{\{([A-Z_]+_[A-Z0-9]+)\}\}/g;
      let lastIdx = 0;
      let match;

      while ((match = tokenRegex.exec(child)) !== null) {
        // トークン前のテキスト
        if (match.index > lastIdx) {
          newChildren.push(child.slice(lastIdx, match.index));
        }

        const token = match[0];
        const entry = SecureVaultService.getEntry(token);

        newChildren.push(
          <RestoredToken
            key={`token-${i}-${match.index}`}
            token={token}
            restoredValue={entry ? entry.originalValue : null}
          />
        );

        lastIdx = tokenRegex.lastIndex;
      }

      // 残りのテキスト
      if (lastIdx < child.length) {
        newChildren.push(child.slice(lastIdx));
      } else if (lastIdx === 0) {
        // トークンなし: そのまま
        newChildren.push(child);
      }
    } else {
      newChildren.push(child);
    }
  });

  return newChildren;
};

const LoggedElement = ({ as: Component, logTag, content, logFunction, children, ...props }) => {
  useEffect(() => {
    if (logFunction) {
      logFunction(logTag, content);
    }
  }, [logTag, content, logFunction]);

  return <Component {...props}>{children}</Component>;
};

const CodeBlock = ({ inline, className, children, logFunction, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : (inline ? '' : 'text');
  const codeText = String(children).replace(/\n$/, '');

  useEffect(() => {
    if (logFunction) {
      logFunction(inline ? 'code-inline' : 'code-block', codeText);
    }
  }, [inline, codeText, logFunction]);

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // ★追加: textタイプのコードブロックはインラインのプレーンテキストとしてレンダリングする
  if (lang === 'text') {
    return (
      <span className="markdown-plain-text" {...props}>
        {children}
      </span>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{lang}</span>
        <button
          className={`code-block-copy-btn ${isCopied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {isCopied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <div className="code-copy-content">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </div>
          )}
        </button>
      </div>
      <pre className={className} {...props}>
        <code>{children}</code>
      </pre>
    </div>
  );
};

// --- Main Component: MarkdownRenderer ---
const MarkdownRenderer = ({
  content,
  isStreaming = false,
  // ★追加: 描画モード ('normal' | 'realtime')
  // normal: ストリーミング中は待機 -> 完了後にタイピング演出
  // realtime: ストリーミング中も即座に表示 (Fastモード用)
  renderMode = 'normal',
  citations = [],
  messageId,
  onOpenArtifact,
  onOpenTableModal // ★追加: 親(ChatArea等)から渡されるモーダル開閉ハンドラ
}) => {
  const logger = useLogger();
  // 初期状態の設定: realtimeなら即 'done' (表示状態) にする
  const [displayMode, setDisplayMode] = useState(() => {
    if (renderMode === 'realtime') return 'done';
    return isStreaming ? 'streaming' : 'done';
  });

  const [typedContent, setTypedContent] = useState('');
  // const { addLog } = useLogger(); // Replaced by logger.addLog
  const prevStreamingRef = useRef(isStreaming);
  const loggedElementsRef = useRef(new Set());

  // --- 1. Typing Effect Logic (タイピング演出制御) ---
  useEffect(() => {
    // realtimeモードの場合は、このEffectによる待機・演出制御をスキップして常に表示状態を維持
    if (renderMode === 'realtime') {
      setDisplayMode('done');
      prevStreamingRef.current = isStreaming;
      return;
    }

    if (isStreaming) {
      // ストリーミング中は常に「受信中」モード
      setDisplayMode('streaming');
      setTypedContent('');
      loggedElementsRef.current.clear();
    }
    else if (prevStreamingRef.current === true && isStreaming === false) {
      // ストリーミング終了直後 -> 高速タイピング演出へ移行
      setDisplayMode('typing');
      let currentIndex = 0;
      const fullText = content || '';
      const typingInterval = 5;
      const charsPerTick = 3;

      const intervalId = setInterval(() => {
        if (currentIndex < fullText.length) {
          currentIndex += charsPerTick;
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
      // その他のケースで完了した場合
      setDisplayMode('done');
    }

    prevStreamingRef.current = isStreaming;
  }, [isStreaming, content, renderMode]);

  // --- 2. Content Text Resolution ---
  // normalモードのタイピング中は途中経過、それ以外（realtime含む）は全文を使用
  const textToRender = useMemo(() => {
    return (displayMode === 'typing' && renderMode === 'normal') ? typedContent : content || '';
  }, [content, typedContent, displayMode, renderMode]);

  // --- 3. Logging Logic ---
  const logMarkdownRender = useCallback((tag, contentSnippet) => {
    if (displayMode !== 'done' || (isStreaming && renderMode === 'realtime')) return; // ストリーミング中はログ過多を防ぐ
    const logKey = `${tag}-${contentSnippet?.substring(0, 20)}`;
    if (loggedElementsRef.current.has(logKey)) return;

    loggedElementsRef.current.add(logKey);
    const message = `Rendered [${tag}]: ${contentSnippet?.substring(0, 50)}${contentSnippet?.length > 50 ? '...' : ''}`;
    logger.addLog(message, 'info');
  }, [displayMode, logger, isStreaming, renderMode]);

  const checkUnrenderedMarkdown = useCallback((text) => {
    if (displayMode !== 'done' || typeof text !== 'string') return;
    const patterns = [
      { name: 'Bold', regex: /\*\*[^*]+\*\*/ },
      { name: 'Italic', regex: /(?<!\*)\*[^*]+\*(?!\*)/ },
      { name: 'Header', regex: /^#{1,6}\s/m },
      { name: 'Link', regex: /\[.+\]\(.+\)/ },
      { name: 'List', regex: /^[\*\-\+]\s/m },
      { name: 'Code', regex: /`[^`]+`/ }
    ];
    patterns.forEach(({ name, regex }) => {
      if (regex.test(text)) {
        const match = text.match(regex)[0];
        const logKey = `warning-${name}-${match.substring(0, 20)}`;
        if (loggedElementsRef.current.has(logKey)) return;
        loggedElementsRef.current.add(logKey);
        const message = `Potential unrendered Markdown (${name}) detected: "${match}"`;
        logger.addLog(message, 'warn');
      }
    });
  }, [displayMode, logger]);

  const cleanChildren = useCallback((children) => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') {
        return child.replace(/@@FIX@@/g, '');
      }
      return child;
    });
  }, []);

  // --- 4. Render Phase ---

  // normalモードでストリーミング待機中の場合のみカーソルだけを表示
  if (displayMode === 'streaming' && renderMode !== 'realtime') {
    return <div className="markdown-renderer blinking-cursor"></div>;
  }

  // ★変更: リアルタイムモードかつストリーミング中の場合にクラスを付与
  const isRealtimeStreaming = isStreaming && renderMode === 'realtime';

  return (
    <div className={`markdown-renderer ${isRealtimeStreaming ? 'streaming-active' : ''}`}>
      {(() => {
        const processedContent = textToRender.replace(/([％！？。、])\*\*(?![ \t\r\n\v\f　、。，．！？])/g, '$1**@@FIX@@');

        return (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, children, ...props }) => (
                <LoggedElement as="a" logTag="a" content={String(children)} logFunction={logMarkdownRender} {...props} target="_blank" rel="noopener noreferrer">
                  {cleanChildren(children)}
                </LoggedElement>
              ),
              h1: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <LoggedElement as="h1" logTag="h1" content={String(children)} logFunction={logMarkdownRender} {...props}>{processed}</LoggedElement>;
              },
              h2: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <LoggedElement as="h2" logTag="h2" content={String(children)} logFunction={logMarkdownRender} {...props}>{processed}</LoggedElement>;
              },
              h3: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <LoggedElement as="h3" logTag="h3" content={String(children)} logFunction={logMarkdownRender} {...props}>{processed}</LoggedElement>;
              },
              h4: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <LoggedElement as="h4" logTag="h4" content={String(children)} logFunction={logMarkdownRender} {...props}>{processed}</LoggedElement>;
              },
              h5: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <LoggedElement as="h5" logTag="h5" content={String(children)} logFunction={logMarkdownRender} {...props}>{processed}</LoggedElement>;
              },
              h6: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <LoggedElement as="h6" logTag="h6" content={String(children)} logFunction={logMarkdownRender} {...props}>{processed}</LoggedElement>;
              },
              strong: ({ node, children, ...props }) => (
                <LoggedElement as="strong" logTag="strong" content={String(children)} logFunction={logMarkdownRender} {...props}>
                  {cleanChildren(children)}
                </LoggedElement>
              ),
              em: ({ node, children, ...props }) => (
                <LoggedElement as="em" logTag="em" content={String(children)} logFunction={logMarkdownRender} {...props}>
                  {cleanChildren(children)}
                </LoggedElement>
              ),
              code: ({ node, inline, className, children, ...props }) => (
                <CodeBlock
                  inline={inline}
                  className={className}
                  logFunction={logMarkdownRender}
                  {...props}
                >
                  {cleanChildren(children)}
                </CodeBlock>
              ),
              p: ({ node, children, ...props }) => {
                useEffect(() => {
                  React.Children.forEach(children, child => {
                    if (typeof child === 'string') {
                      checkUnrenderedMarkdown(child);
                    }
                  });
                }, [children]);

                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <p {...props}>{processed}</p>;
              },
              li: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return (
                  <LoggedElement as="li" logTag="li" content={String(children)} logFunction={logMarkdownRender} {...props}>
                    {processed}
                  </LoggedElement>
                );
              },
              td: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <td {...props}>{processed}</td>;
              },
              th: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <th {...props}>{processed}</th>;
              },
              blockquote: ({ node, children, ...props }) => {
                const cleaned = cleanChildren(children);
                const withCitations = renderWithInlineCitations(cleaned, citations, messageId);
                const processed = renderWithRestoredTokens(withCitations);
                return <blockquote {...props}>{processed}</blockquote>;
              },
              table: ({ node, children, ...props }) => {
                return (
                  <div className="markdown-table-wrapper group">
                    <button
                      className="table-expand-btn"
                      onClick={() => {
                        if (onOpenTableModal) {
                          onOpenTableModal(<table {...props}>{children}</table>);
                        }
                      }}
                      aria-label="Expand table"
                      title="View Fullscreen"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                    </button>
                    <table {...props}>{children}</table>
                  </div>
                );
              }
            }}
          >
            {processedContent}
          </ReactMarkdown>
        );
      })()}
      {/* normalモードのタイピング中カーソル */}
      {displayMode === 'typing' && <span className="blinking-cursor"></span>}
    </div>
  );
};

export default React.memo(MarkdownRenderer);