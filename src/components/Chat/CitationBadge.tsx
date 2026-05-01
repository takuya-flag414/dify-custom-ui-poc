import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Paperclip, Building2 } from 'lucide-react';
import { CitationSource, extractDomain, truncateMiddle } from '../../utils/citationFormatter';
import { SourceIcon } from '../Shared/FileIcons';
import './CitationBadge.css';

interface CitationBadgeProps {
  category: 'web' | 'file' | 'rag';
  sources: CitationSource[];
  messageId: string;
}

const CATEGORY_CONFIG = {
  web:  { icon: Globe, label: 'Webソース', className: 'badge-web' },
  file: { icon: Paperclip, label: '添付ファイル', className: 'badge-file' },
  rag:  { icon: Building2, label: '社内データ', className: 'badge-rag' }
};

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 250,
  damping: 25,
  mass: 1
};

export const CitationBadge: React.FC<CitationBadgeProps> = ({ category, sources, messageId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const lastClosedTimeRef = useRef<number>(0);
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!sources || sources.length === 0) return null;

  const config = CATEGORY_CONFIG[category];
  const IconComponent = config.icon;
  
  // ソースをインデックス順にソートして、最初のものを代表とする
  const sortedSources = [...sources].sort((a, b) => a.index - b.index);
  const representativeSource = sortedSources[0];
  
  // 表示名のフォーマット
  let displayName = representativeSource.title.replace(/^\[\d+\]\s*/, '');
  if (category === 'web') {
    displayName = representativeSource.url ? extractDomain(representativeSource.url) : extractDomain(displayName);
  } else {
    displayName = truncateMiddle(displayName, 15);
  }

  const extraCount = sortedSources.length - 1;

  const handleCitationClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    // 既存の仕組み（インスペクターやリスト展開）と連携
    const inspectorEvent = new CustomEvent('openInspectorCitation', {
      detail: { citationIndex: index, messageId }
    });
    window.dispatchEvent(inspectorEvent);

    const expandEvent = new CustomEvent('expandCitationList', {
      detail: { messageId }
    });
    window.dispatchEvent(expandEvent);

    setTimeout(() => {
      const el = document.getElementById(`citation-${messageId}-${index}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-citation');
        setTimeout(() => el.classList.remove('highlight-citation'), 2000);
      }
    }, 350);
  };

  const handleMouseEnter = () => {
    // 最後に閉じてから200ms以内は無視（マウスを外す際のスレスレの動き対策）
    const now = Date.now();
    if (now - lastClosedTimeRef.current < 200) return;
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
    lastClosedTimeRef.current = Date.now();
  };

  return (
    <span 
      className={`citation-badge-group ${config.className}`}
      ref={badgeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      <span className="badge-icon-wrapper">
        <IconComponent size={12} strokeWidth={2.5} />
      </span>
      <span className="badge-title">{displayName}</span>
      {extraCount > 0 && (
        <span className="badge-extra">+{extraCount}</span>
      )}

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="citation-popover"
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: 5,
              transition: { duration: 0.15 },
              pointerEvents: 'none' // 閉じている間はマウス入力を受け付けない
            }}
            transition={SPRING_CONFIG}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popover-header">
              <IconComponent size={14} />
              <span>{config.label} ({sortedSources.length}件)</span>
            </div>
            <ul className="popover-list">
              {sortedSources.map(source => {
                const titleStr = source.title.replace(/^\[\d+\]\s*/, '');
                return (
                  <li key={source.index} className="popover-item">
                    <span className="popover-item-index">[{source.index}]</span>
                    <span className="popover-item-icon">
                      <SourceIcon 
                        type={source.category} 
                        source={source.title} 
                        url={source.url} 
                      />
                    </span>
                    {source.url ? (
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="popover-item-link"
                        onClick={(e) => {
                          // Prevent triggering the popover close or badge click
                          e.stopPropagation();
                          handleCitationClick(e, source.index);
                        }}
                      >
                        {titleStr}
                      </a>
                    ) : (
                      <span 
                        className="popover-item-text"
                        onClick={(e) => handleCitationClick(e, source.index)}
                      >
                        {titleStr}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
