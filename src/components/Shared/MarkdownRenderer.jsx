// src/components/Shared/MarkdownRenderer.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourceIcon } from './FileIcons';
import ArtifactCard from '../Artifacts/ArtifactCard'; // 追加: アーティファクト用カード
import '../Message/MessageBlock.css';
import { useLogger } from '../../hooks/useLogger';

// --- Helper: Inline Citation Renderer ---
// 文中の [1] などをインタラクティブなバッジに変換する
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
                      {citation.url && (
                        <span className="citation-tooltip-url" style={{ display: 'block' }}>{citation.url}</span>
                      )}
                    </span>
                  </span>
                </span>
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

// --- Helper: Log Wrapper ---
// レンダリング状況をログ出力するラッパー
const LoggedElement = ({ as: Component, logTag, content, logFunction, children, ...props }) => {
  useEffect(() => {
    if (logFunction) {
      logFunction(logTag, content);
    }
  }, [logTag, content, logFunction]);

  return <Component {...props}>{children}</Component>;
};

// --- Component: CodeBlock with Copy Button ---
// コードブロックの表示（コピーボタン付き）
const CodeBlock = ({ inline, className, children, logFunction, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);

  // 言語名の抽出 (例: language-js -> js)
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : (inline ? '' : 'text');
  const codeText = String(children).replace(/\n$/, '');

  useEffect(() => {
    if (logFunction) {
      logFunction(inline ? 'code-inline' : 'code-block', codeText);
    }
  }, [inline, codeText, logFunction]);

  // インラインコードの場合は単純なcodeタグを返す
  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // ブロックコードの場合はヘッダー付きのUIを返す
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
            /* Check Icon */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            /* Copy Icon */
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
const MarkdownRenderer = ({ content, isStreaming = false, citations = [], messageId, onOpenArtifact }) => {
  const [displayMode, setDisplayMode] = useState(isStreaming ? 'streaming' : 'done');
  const [typedContent, setTypedContent] = useState('');
  const { addLog } = useLogger();

  const prevStreamingRef = useRef(isStreaming);
  const loggedElementsRef = useRef(new Set());

  // --- 1. Typing Effect Logic (タイピング演出制御) ---
  useEffect(() => {
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
  }, [isStreaming, content]);

  // --- 2. Artifact Parsing Logic (成果物タグの解析) ---
  const parseArtifacts = useMemo(() => {
    // タイピング中は途中経過テキスト、完了後は全文を使用
    const textToRender = displayMode === 'typing' ? typedContent : content || '';

    // Regex: :::artifact{...} ... :::
    // capture 1: attributes string (e.g. type="code" title="Foo")
    // capture 2: content body
    const artifactRegex = /:::artifact\{([^}]+)\}\n([\s\S]*?)\n:::/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    // テキスト全体を走査して分割
    while ((match = artifactRegex.exec(textToRender)) !== null) {
      // A. マッチ箇所の前の通常テキスト
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: textToRender.substring(lastIndex, match.index)
        });
      }

      // B. Artifact属性のパース
      const attrStr = match[1];
      const attributes = {};
      const attrMatcher = /(\w+)="([^"]+)"/g;
      let attrMatch;
      while ((attrMatch = attrMatcher.exec(attrStr)) !== null) {
        attributes[attrMatch[1]] = attrMatch[2];
      }

      // C. Artifactパーツとして追加
      parts.push({
        type: 'artifact',
        attributes: attributes,
        content: match[2] // Artifactの中身（コード等）
      });

      lastIndex = artifactRegex.lastIndex;
    }

    // D. 残りのテキスト
    if (lastIndex < textToRender.length) {
      parts.push({
        type: 'text',
        content: textToRender.substring(lastIndex)
      });
    }

    return parts;
  }, [content, typedContent, displayMode]);

  // --- 3. Logging Logic & Helpers ---
  const logMarkdownRender = useCallback((tag, contentSnippet) => {
    if (displayMode !== 'done') return;
    const logKey = `${tag}-${contentSnippet?.substring(0, 20)}`;
    if (loggedElementsRef.current.has(logKey)) return;

    loggedElementsRef.current.add(logKey);
    const message = `Rendered [${tag}]: ${contentSnippet?.substring(0, 50)}${contentSnippet?.length > 50 ? '...' : ''}`;
    // console.log(`%c[Markdown] ${message}`, 'color: #4caf50; font-weight: bold;');
    addLog(message, 'info');
  }, [displayMode, addLog]);

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
        console.warn(`[Markdown Warning] ${message}`);
        addLog(message, 'warn');
      }
    });
  }, [displayMode, addLog]);

  const cleanChildren = useCallback((children) => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') {
        // 日本語特有のMarkdown崩れ防止用ハックの除去
        return child.replace(/@@FIX@@/g, '');
      }
      return child;
    });
  }, []);

  // --- 4. Render Phase ---

  // ストリーミング中のカーソル表示のみの状態
  if (displayMode === 'streaming') {
    return <div className="markdown-renderer blinking-cursor"></div>;
  }

  return (
    <div className="markdown-renderer">
      {parseArtifacts.map((part, index) => {
        // --- Artifact Card (成果物) ---
        if (part.type === 'artifact') {
          return (
            <ArtifactCard
              key={`art-${index}`}
              title={part.attributes.title || 'Untitled'}
              type={part.attributes.type || 'code'}
              content={part.content}
              onClick={(artifact) => {
                if (onOpenArtifact) {
                  onOpenArtifact(artifact);
                } else {
                  console.warn('onOpenArtifact prop is missing in MarkdownRenderer');
                }
              }}
            />
          );
        } else {
          // --- Normal Markdown Text ---
          // 事前処理: 日本語Markdownの記号干渉を防ぐためのハック
          const processedContent = part.content.replace(/([％！？。、])\*\*(?![ \t\r\n\v\f　、。，．！？])/g, '$1**@@FIX@@');

          return (
            <ReactMarkdown
              key={`md-${index}`}
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, children, ...props }) => (
                  <LoggedElement as="a" logTag="a" content={String(children)} logFunction={logMarkdownRender} {...props} target="_blank" rel="noopener noreferrer">
                    {cleanChildren(children)}
                  </LoggedElement>
                ),
                h1: ({ node, children, ...props }) => (
                  <LoggedElement as="h1" logTag="h1" content={String(children)} logFunction={logMarkdownRender} {...props}>
                    {cleanChildren(children)}
                  </LoggedElement>
                ),
                h2: ({ node, children, ...props }) => (
                  <LoggedElement as="h2" logTag="h2" content={String(children)} logFunction={logMarkdownRender} {...props}>
                    {cleanChildren(children)}
                  </LoggedElement>
                ),
                h3: ({ node, children, ...props }) => (
                  <LoggedElement as="h3" logTag="h3" content={String(children)} logFunction={logMarkdownRender} {...props}>
                    {cleanChildren(children)}
                  </LoggedElement>
                ),
                h4: ({ node, children, ...props }) => (
                  <LoggedElement as="h4" logTag="h4" content={String(children)} logFunction={logMarkdownRender} {...props}>
                    {cleanChildren(children)}
                  </LoggedElement>
                ),
                h5: ({ node, children, ...props }) => (
                  <LoggedElement as="h5" logTag="h5" content={String(children)} logFunction={logMarkdownRender} {...props}>
                    {cleanChildren(children)}
                  </LoggedElement>
                ),
                h6: ({ node, children, ...props }) => (
                  <LoggedElement as="h6" logTag="h6" content={String(children)} logFunction={logMarkdownRender} {...props}>
                    {cleanChildren(children)}
                  </LoggedElement>
                ),
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
                // Code Block (with Copy Button)
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
                // Paragraph (with Citations check)
                p: ({ node, children, ...props }) => {
                  useEffect(() => {
                    React.Children.forEach(children, child => {
                      if (typeof child === 'string') {
                        checkUnrenderedMarkdown(child);
                      }
                    });
                  }, [children]);

                  const cleaned = cleanChildren(children);
                  const processed = renderWithInlineCitations(cleaned, citations, messageId);
                  return <p {...props}>{processed}</p>;
                },
                // List Item (with Citations check)
                li: ({ node, children, ...props }) => {
                  const cleaned = cleanChildren(children);
                  const processed = renderWithInlineCitations(cleaned, citations, messageId);
                  return (
                    <LoggedElement as="li" logTag="li" content={String(children)} logFunction={logMarkdownRender} {...props}>
                      {processed}
                    </LoggedElement>
                  );
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
          );
        }
      })}
      {displayMode === 'typing' && <span className="blinking-cursor"></span>}
    </div>
  );
};

export default React.memo(MarkdownRenderer);