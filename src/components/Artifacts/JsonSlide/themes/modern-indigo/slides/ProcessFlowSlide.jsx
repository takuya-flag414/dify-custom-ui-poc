// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/ProcessFlowSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * ProcessFlowSlide - プロセスフロースライド
 * Z字型フロー、アダプティブレイアウト、シェブロンデザイン対応
 */
const ProcessFlowSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        steps = [], 
        process_steps = [], 
        items = [], 
        key_message,
        body_text,
        annotations = [] 
    } = content || {};

    // 複数のキーに対応
    const rawSteps = process_steps.length > 0 ? process_steps : (steps.length > 0 ? steps : items);
    const activeSteps = Array.isArray(rawSteps) ? rawSteps : [];

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <motion.div 
                className="indigo-slide-header"
                style={{ flexShrink: 0 }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || 'プロセスフロー'} />
                </h2>
                {/* 補足分析テキストをヘッダーの下に配置 */}
                {body_text && (
                    <div style={{ marginTop: '1cqi', fontSize: '1.4cqi', color: '#475569', lineHeight: 1.5 }}>
                        <SlideMarkdown content={body_text} />
                    </div>
                )}
            </motion.div>

            {/* ボディエリア */}
            <div className="indigo-slide-body" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: 0,
                justifyContent: 'flex-start',
                paddingTop: '2cqi',
                overflow: 'visible'
            }}>
                {(() => {
                    const count = activeSteps.length;
                    const aCount = annotations.length;
                    
                    // 情報密度のスコア化（垂直方向を重視）
                    const densityScore = (count * 3.5) + (key_message ? 4 : 0) + (body_text ? 3 : 0) + (aCount > 0 ? 1 : 0);
                    
                    // レイアウト判定
                    const gridCols = count <= 4 ? count : (count <= 8 ? Math.ceil(count / 2) : 5);
                    const rows = Math.ceil(count / gridCols);

                    // スケーリング感度（より確実に収まるように調整）
                    const scaleFactor = densityScore > 35 ? 0.65
                                      : densityScore > 28 ? 0.75
                                      : densityScore > 20 ? 0.85
                                      : 0.95;
                    
                    const gridGap = count <= 3 ? '4cqi' : '2.5cqi';
                    const cardPadding = count <= 3 ? '3cqi 3.5cqi' : '2cqi 2.5cqi';
                    
                    const titleSize = count <= 3 ? '2.3cqi' : '1.8cqi';
                    const descSize = count <= 3 ? '1.4cqi' : '1.2cqi';

                    return (
                        <div style={{ 
                            transform: `scale(${scaleFactor})`, 
                            transformOrigin: 'top center',
                            width: '100%',
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '2.5cqi',
                            justifyContent: 'flex-start',
                            marginTop: '1cqi'
                        }}>
                            {/* フローグリッド */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                                gap: gridGap,
                                width: '100%',
                                position: 'relative'
                            }}>
                                {activeSteps.map((step, idx) => {
                                    const isLastInRow = (idx + 1) % gridCols === 0;
                                    const isLastTotal = idx === count - 1;
                                    const stepTitle = step.title || step.label || (typeof step === 'string' ? step : '');
                                    
                                    return (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <motion.div 
                                                className="indigo-panel"
                                                style={{ 
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    padding: cardPadding,
                                                    background: '#ffffff',
                                                    border: '1px solid var(--slide-border)',
                                                    borderLeft: '7px solid var(--slide-primary)',
                                                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.06)',
                                                    position: 'relative',
                                                    zIndex: 2,
                                                    minHeight: count <= 3 ? '18cqi' : '13cqi' // 高さを圧縮
                                                }}
                                                {...(!isStatic && {
                                                    initial: { opacity: 0, y: 20 },
                                                    animate: { opacity: 1, y: 0 },
                                                    transition: { delay: 0.1 + idx * 0.1 }
                                                })}
                                            >
                                                {/* ステップ番号 */}
                                                <div style={{ 
                                                    fontSize: '1.2cqi', 
                                                    fontWeight: 800, 
                                                    color: 'var(--slide-primary)',
                                                    marginBottom: '1cqi',
                                                    opacity: 0.6,
                                                    letterSpacing: '0.1em'
                                                }}>
                                                    STEP {String(idx + 1).padStart(2, '0')}
                                                </div>

                                                <div style={{ 
                                                    fontWeight: 700, 
                                                    fontSize: titleSize, 
                                                    color: 'var(--slide-heading)',
                                                    marginBottom: '1cqi',
                                                    lineHeight: 1.3
                                                }}>
                                                    <SlideMarkdown content={stepTitle} />
                                                </div>

                                                {step.description && (
                                                    <div style={{ 
                                                        fontSize: descSize, 
                                                        color: '#64748b', 
                                                        lineHeight: 1.6,
                                                        fontWeight: 400
                                                    }}>
                                                        <SlideMarkdown content={step.description} />
                                                    </div>
                                                )}
                                            </motion.div>

                                            {/* コネクタ矢印 (同じ行の隣へ) */}
                                            {!isLastInRow && !isLastTotal && (
                                                <div style={{ 
                                                    position: 'absolute',
                                                    right: `calc(-${gridGap} / 2 - 1.5cqi)`,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    zIndex: 1,
                                                    color: 'var(--slide-primary)',
                                                    opacity: 0.3
                                                }}>
                                                    <svg width="3cqi" height="3cqi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="9 18 15 12 9 6"></polyline>
                                                    </svg>
                                                </div>
                                            )}

                                            {/* 折り返しコネクタ (次の行の先頭へ - Z字) */}
                                            {isLastInRow && !isLastTotal && (
                                                <div style={{ 
                                                    position: 'absolute',
                                                    bottom: `calc(-${gridGap} / 2)`,
                                                    right: '15%',
                                                    zIndex: 1,
                                                    color: 'var(--slide-primary)',
                                                    opacity: 0.2,
                                                    transform: 'rotate(90deg)'
                                                }}>
                                                    <svg width="2.5cqi" height="2.5cqi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="9 18 15 12 9 6"></polyline>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* インサイト解説 (下部の補足ボックス) */}
                            {key_message && (
                                <motion.div 
                                    style={{ 
                                        width: '100%',
                                        marginTop: '1cqi', 
                                        padding: '1.5cqi 3cqi',
                                        textAlign: 'center',
                                        background: 'rgba(99, 102, 241, 0.04)',
                                        border: '1.5px solid rgba(99, 102, 241, 0.12)',
                                        borderRadius: '1cqi',
                                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.03)'
                                    }}
                                    {...(!isStatic && { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5 } })}
                                >
                                    <div style={{ 
                                        fontSize: count <= 4 ? '1.9cqi' : '1.7cqi', 
                                        margin: 0, 
                                        color: 'var(--slide-primary, #6366f1)', 
                                        fontWeight: 700, 
                                        lineHeight: 1.5, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        <span style={{ marginRight: '1cqi', opacity: 0.8 }}>✦</span>
                                        <SlideMarkdown content={key_message} />
                                    </div>
                                </motion.div>
                            )}
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
                    paddingTop: '1cqi', 
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

export default ProcessFlowSlide;
