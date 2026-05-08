// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/TimelineSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * TimelineSlide - タイムライン / ロードマップスライド
 * 垂直・水平のレイアウト切替、アダプティブ密度調整対応
 */
const TimelineSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        items = [], 
        events = [], 
        annotations = [],
        layout_variation = 'vertical' 
    } = content || {};

    // データの正規化 (items または events の両方に対応)
    const rawEvents = events.length > 0 ? events : items;
    const activeEvents = Array.isArray(rawEvents) ? rawEvents.map(e => ({
        label: e.label || e.date || e.year || e.step || '',
        title: e.title || e.label || '',
        description: e.description || ''
    })) : [];

    const isHorizontal = layout_variation === 'horizontal';

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <motion.div 
                className="indigo-slide-header"
                style={{ flexShrink: 0 }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || 'タイムライン'} />
                </h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="indigo-slide-body" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: 0,
                justifyContent: 'flex-start',
                paddingTop: '0'
            }}>
                {(() => {
                    const count = activeEvents.length;
                    const aCount = annotations.length;
                    
                    // 情報密度の算出 (垂直方向のスペース消費をより厳格に評価)
                    const verticalDensity = count * 6;
                    const horizontalDensity = count * 4.5;
                    const densityScore = (isHorizontal ? horizontalDensity : verticalDensity) + (aCount > 0 ? 3 : 0);
                    
                    // スケーリング
                    const scaleFactor = densityScore > 50 ? 0.75
                                      : densityScore > 35 ? 0.85
                                      : densityScore > 22 ? 0.95
                                      : 1.0;

                    // 垂直レイアウトの描画
                    const renderVertical = () => (
                        <div style={{ position: 'relative', paddingLeft: '6cqi', width: '100%' }}>
                            {/* メインライン */}
                            <div style={{ 
                                position: 'absolute', 
                                left: '6.75cqi', 
                                top: '1cqi', 
                                bottom: '1cqi', 
                                width: '3px', 
                                background: 'linear-gradient(to bottom, var(--slide-primary), rgba(99, 102, 241, 0.1))',
                                borderRadius: '3px'
                            }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: densityScore > 25 ? '1.5cqi' : '2.5cqi' }}>
                                {activeEvents.map((event, idx) => (
                                    <motion.div 
                                        key={idx}
                                        style={{ display: 'flex', gap: '2.5cqi', alignItems: 'flex-start', position: 'relative' }}
                                        {...(!isStatic && {
                                            initial: { opacity: 0, x: 20 },
                                            animate: { opacity: 1, x: 0 },
                                            transition: { delay: 0.1 + idx * 0.1 }
                                        })}
                                    >
                                        {/* ノード */}
                                        <div style={{ 
                                            width: '1.6cqi', 
                                            height: '1.6cqi', 
                                            borderRadius: '50%', 
                                            background: 'var(--slide-primary)', 
                                            border: '3.5px solid #ffffff',
                                            boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
                                            zIndex: 2,
                                            flexShrink: 0,
                                            marginTop: '0.8cqi'
                                        }} />
                                        
                                        <div className="indigo-panel" style={{ 
                                            flex: 1, 
                                            padding: densityScore > 25 ? '1.5cqi 2cqi' : '2cqi 2.5cqi',
                                            background: '#ffffff',
                                            border: '1px solid var(--slide-border)',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                            position: 'relative',
                                            borderRadius: '0.5cqi'
                                        }}>
                                            <div style={{ 
                                                fontWeight: 800, 
                                                fontSize: '1.6cqi', 
                                                color: 'var(--slide-primary)', 
                                                marginBottom: '0.3cqi',
                                                letterSpacing: '0.05em'
                                            }}>
                                                <SlideMarkdown content={event.label} />
                                            </div>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                fontSize: '2.0cqi', 
                                                color: 'var(--slide-heading)',
                                                marginBottom: '0.4cqi'
                                            }}>
                                                <SlideMarkdown content={event.title} />
                                            </div>
                                            {event.description && (
                                                <div style={{ 
                                                    fontSize: '1.5cqi', 
                                                    color: '#475569', 
                                                    lineHeight: 1.5,
                                                    fontWeight: 400 
                                                }}>
                                                    <SlideMarkdown content={event.description} />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );

                    // 水平レイアウトの描画 (3行構成で重なりを物理的に排除)
                    const renderHorizontal = () => (
                        <div style={{ 
                            position: 'relative', 
                            width: '100%', 
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            marginTop: '-4cqi',           // タイトルに引き寄せる
                            minHeight: '40cqi'
                        }}>
                            {/* 1. 上段カードエリア */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-around', 
                                alignItems: 'flex-end',
                                width: '100%',
                                flex: 1,
                                paddingBottom: '2cqi' // 安全領域を短縮
                            }}>
                                {activeEvents.map((event, idx) => (
                                    <div key={idx} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                        {idx % 2 === 0 ? (
                                            <motion.div 
                                                style={{ 
                                                    width: '95%', maxWidth: '20cqi', padding: '0.5cqi',
                                                    textAlign: 'center', background: 'transparent' // 背景・枠線を削除
                                                }}
                                                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { delay: idx * 0.1 } })}
                                            >
                                                <div style={{ fontWeight: 800, fontSize: '1.5cqi', color: 'var(--slide-primary)', marginBottom: '0.3cqi' }}>
                                                    <SlideMarkdown content={event.label} />
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: '1.8cqi', color: 'var(--slide-heading)', marginBottom: '0.4cqi' }}>
                                                    <SlideMarkdown content={event.title} />
                                                </div>
                                                {event.description && (
                                                    <div style={{ fontSize: '1.4cqi', color: '#475569', lineHeight: 1.4 }}>
                                                        <SlideMarkdown content={event.description} />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : <div style={{ height: '1px' }} />}
                                    </div>
                                ))}
                            </div>

                            {/* 2. 中段ライン＆ドットエリア */}
                            <div style={{ position: 'relative', height: '4px', width: '100%' }}>
                                {/* メインライン */}
                                <div style={{ 
                                    position: 'absolute', left: 0, right: 0, top: '50%', height: '4px',
                                    background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), var(--slide-primary), rgba(99, 102, 241, 0.1))',
                                    transform: 'translateY(-50%)', borderRadius: '4px'
                                }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%', position: 'relative', zIndex: 5 }}>
                                    {activeEvents.map((event, idx) => (
                                        <div key={idx} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                            <motion.div 
                                                style={{ 
                                                    width: '2cqi', height: '2cqi', borderRadius: '50%',
                                                    background: 'var(--slide-primary)', border: '4px solid #ffffff',
                                                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
                                                }}
                                                {...(!isStatic && { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2 + idx * 0.1 } })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. 下段カードエリア */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-around', 
                                alignItems: 'flex-start',
                                width: '100%',
                                flex: 1,
                                paddingTop: '2cqi' // 安全領域を短縮
                            }}>
                                {activeEvents.map((event, idx) => (
                                    <div key={idx} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                        {idx % 2 !== 0 ? (
                                            <motion.div 
                                                style={{ 
                                                    width: '95%', maxWidth: '20cqi', padding: '0.5cqi',
                                                    textAlign: 'center', background: 'transparent' // 背景・枠線を削除
                                                }}
                                                {...(!isStatic && { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: idx * 0.1 } })}
                                            >
                                                <div style={{ fontWeight: 800, fontSize: '1.5cqi', color: 'var(--slide-primary)', marginBottom: '0.3cqi' }}>
                                                    <SlideMarkdown content={event.label} />
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: '1.8cqi', color: 'var(--slide-heading)', marginBottom: '0.4cqi' }}>
                                                    <SlideMarkdown content={event.title} />
                                                </div>
                                                {event.description && (
                                                    <div style={{ fontSize: '1.4cqi', color: '#475569', lineHeight: 1.4 }}>
                                                        <SlideMarkdown content={event.description} />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : <div style={{ height: '1px' }} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                    return (
                        <div style={{ 
                            transform: `scale(${scaleFactor})`, 
                            transformOrigin: 'top center',
                            width: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            paddingTop: '0'
                        }}>
                            {isHorizontal ? renderHorizontal() : renderVertical()}
                        </div>
                    );
                })()}
            </div>

            {/* フッター注釈 */}
            {annotations.length > 0 && (
                <div style={{ 
                    fontSize: '1.1cqi', 
                    color: 'var(--slide-muted, #94a3b8)', 
                    marginTop: 'auto', 
                    paddingTop: '1.5cqi', 
                    borderTop: '1px solid var(--slide-border, #e2e8f0)',
                    flexShrink: 0
                }}>
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 1cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TimelineSlide;
