// src/components/MarkdownRenderer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourceIcon } from './FileIcons';
import './styles/MessageBlock.css';
import { useLogger } from '../hooks/useLogger';

/**
 * インライン出典 [1] をクリック可能なバッジに変換
 * 修正: div を span に変更して p タグ内でのネストエラーを回避
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

// ログ出力用ラッパーコンポーネント (useEffectで副作用としてログ出力)
const LoggedElement = ({ as: Component, logTag, content, logFunction, children, ...props }) => {
  useEffect(() => {
    if (logFunction) {
      logFunction(logTag, content);
    }
  }, [logTag, content, logFunction]);

  return <Component {...props}>{children}</Component>;
};

const MarkdownRenderer = ({ content, isStreaming = false, citations = [], messageId }) => {
  const [displayMode, setDisplayMode] = useState(isStreaming ? 'streaming' : 'done');
  const [typedContent, setTypedContent] = useState('');
  const { addLog } = useLogger();

  const prevStreamingRef = useRef(isStreaming);
  // ログ出力済みフラグ（再レンダリング時の重複ログ防止）
  const loggedElementsRef = useRef(new Set());

  useEffect(() => {
    if (isStreaming) {
      setDisplayMode('streaming');
      setTypedContent('');
      loggedElementsRef.current.clear(); // ストリーミング開始時にログ履歴をクリア
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

  // レンダリングログ出力ヘルパー (useCallbackで安定化)
  const logMarkdownRender = useCallback((tag, contentSnippet) => {
    if (displayMode !== 'done') return; // タイピング完了後のみログ出力

    const logKey = `${tag}-${contentSnippet?.substring(0, 20)}`;
    if (loggedElementsRef.current.has(logKey)) return;

    loggedElementsRef.current.add(logKey);
    const message = `Rendered [${tag}]: ${contentSnippet?.substring(0, 50)}${contentSnippet?.length > 50 ? '...' : ''}`;
    // コンソールには詳細に出す
    console.log(`%c[Markdown] ${message}`, 'color: #4caf50; font-weight: bold;');
    // システムログにも記録
    addLog(message, 'info');
  }, [displayMode, addLog]);

  // 未反映Markdown検出ヘルパー
  const checkUnrenderedMarkdown = useCallback((text) => {
    if (displayMode !== 'done' || typeof text !== 'string') return;

    // 一般的なMarkdown記法の正規表現（簡易版）
    const patterns = [
      { name: 'Bold', regex: /\*\*[^*]+\*\*/ },
      { name: 'Italic', regex: /(?<!\*)\*[^*]+\*(?!\*)/ }, // 単独の*
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

  // Markdownのレンダリング前処理
  // CommonMarkの仕様上、句読点(％など)の後ろに**があり、その直後が文字(スペースや句読点以外)の場合、
  // 太字の閉じタグとして認識されない問題を回避するため、一時的に句読点(@@FIX@@)を挿入する。
  // 例: "10％**です" -> "10％**@@FIX@@です"
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    return content.replace(/([％！？。、])\*\*(?![ \t\r\n\v\f　、。，．！？])/g, '$1**@@FIX@@');
  }, [content]);

  // 子要素から @@FIX@@ を除去するヘルパー
  const cleanChildren = useCallback((children) => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') {
        return child.replace(/@@FIX@@/g, '');
      }
      return child;
    });
  }, []);

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
          code: ({ node, inline, className, children, ...props }) => (
            <LoggedElement as="code" logTag={inline ? 'code-inline' : 'code-block'} content={String(children)} logFunction={logMarkdownRender} className={className} {...props}>
              {cleanChildren(children)}
            </LoggedElement>
          ),
          p: ({ node, children, ...props }) => {
            // テキストノードの子要素をチェック (useEffectで副作用として実行)
            useEffect(() => {
              React.Children.forEach(children, child => {
                if (typeof child === 'string') {
                  checkUnrenderedMarkdown(child);
                }
              });
            }, [children]);

            // @@FIX@@ を除去してから引用処理
            const cleaned = cleanChildren(children);
            const processed = renderWithInlineCitations(cleaned, citations, messageId);
            return <p {...props}>{processed}</p>;
          },
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
    </div>
  );
};

export default React.memo(MarkdownRenderer);