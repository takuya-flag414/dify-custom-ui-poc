// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/AgendaSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const AgendaSlide = ({ content, isStatic = false }) => {
    const {
        title,
        items = [],
        lead_text,
        annotations = [],
        layout_variation = 'one-column'
    } = content || {};

    const activeItems = Array.isArray(items) ? items : [];

    // activeItems を使用して項目数を判定
    const isTwoColumn = layout_variation === 'two-column' || activeItems.length > 5;

    // 個別のアジェンダ項目コンポーネント
    const AgendaItem = ({ item, index }) => (
        <motion.div
            className="relative flex items-start"
            initial={!isStatic ? { opacity: 0, x: 15 } : {}}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + (index * 0.08) }}
            style={{ marginBottom: '2.5cqi' }}
        >
            {/* 01, 02 形式のインデックス (Monospace) */}
            <div style={{
                flex: '0 0 5cqi',
                fontSize: '1.4cqi',
                fontWeight: 800,
                color: 'var(--slide-primary)',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                paddingTop: '0.3cqi'
            }}>
                {String(index + 1).padStart(2, '0')}
            </div>

            {/* Architectural Tick & Label */}
            <div style={{ flex: 1, paddingLeft: '1.5cqi', borderLeft: '1px solid var(--slide-border)' }}>
                <div style={{
                    fontSize: '1.8cqi',
                    fontWeight: 700,
                    color: 'var(--slide-heading)',
                    lineHeight: 1.3,
                    marginBottom: (item.description || item.subtitle || item.text) ? '0.6cqi' : '0'
                }}>
                    <SlideMarkdown content={item.title || item.label} inline />
                </div>

                {/* 修正: 補助文（サブテキスト）の表示を復元 */}
                {(item.description || item.subtitle || item.text) && (
                    <div style={{
                        fontSize: '1.3cqi',
                        color: 'var(--slide-body)',
                        lineHeight: 1.5,
                        fontWeight: 400
                    }}>
                        <SlideMarkdown content={item.description || item.subtitle || item.text} />
                    </div>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{
                    marginBottom: '3cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Agenda'} />
                </h2>
            </motion.div>

            {/* メイン・目次エリア */}
            <div className="flex-1 flex flex-col min-h-0 mt-[1cqi]">

                {/* Lead Text (分析の導入としてのリード文) */}
                {lead_text && (
                    <motion.div
                        className="flex-shrink-0"
                        style={{
                            borderLeft: '4px solid var(--slide-primary)',
                            paddingLeft: '1.5cqi',
                            marginBottom: '4cqi'
                        }}
                        initial={!isStatic ? { opacity: 0, x: -15 } : {}}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div style={{
                            fontSize: '1.6cqi',
                            color: 'var(--slide-body)',
                            lineHeight: 1.6,
                            fontWeight: 500,
                            maxWidth: '85%'
                        }}>
                            <SlideMarkdown content={lead_text} />
                        </div>
                    </motion.div>
                )}

                {/* Agenda Items List */}
                <div className="flex-1 flex items-center w-full min-h-0">
                    {isTwoColumn ? (
                        // 2カラムレイアウト: 中央に垂直ディバイダーを配置
                        <div className="w-full grid grid-cols-[1fr_1px_1fr] items-start gap-[4cqi]">
                            <div className="flex flex-col">
                                {activeItems.slice(0, Math.ceil(activeItems.length / 2)).map((item, i) => (
                                    <AgendaItem key={i} item={item} index={i} />
                                ))}
                            </div>

                            {/* 垂直ディバイダー */}
                            <div style={{ width: '1px', backgroundColor: 'var(--slide-border)', alignSelf: 'stretch', margin: '1cqi 0' }} />

                            <div className="flex flex-col">
                                {activeItems.slice(Math.ceil(activeItems.length / 2)).map((item, i) => (
                                    <AgendaItem key={i} item={item} index={i + Math.ceil(activeItems.length / 2)} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        // 1カラムレイアウト: 中央帯に美しく配置
                        <div className="w-full flex flex-col max-w-[80%]">
                            {activeItems.map((item, i) => (
                                <AgendaItem key={i} item={item} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* フッター注釈 */}
            {annotations?.length > 0 && (
                <div
                    className="flex-shrink-0"
                    style={{
                        fontSize: '1.1cqi',
                        color: 'var(--slide-muted)',
                        marginTop: '2cqi',
                        paddingTop: '1cqi',
                        borderTop: '1px solid var(--slide-border)'
                    }}
                >
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 0.8cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgendaSlide;