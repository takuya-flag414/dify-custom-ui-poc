// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/StatsSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * StatsSlide - 実績値ハイライトスライド
 * 少数の大きな数字を強調するためのプロフェッショナルデザイン
 */
const StatsSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        stats = [], 
        description, 
        body_text,
        annotations = [],
        layout_variation = 'default' 
    } = content || {};

    const activeStats = Array.isArray(stats) ? stats : [];
    const mainText = body_text || description;

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <motion.div 
                className="indigo-slide-header"
                style={{ flexShrink: 0 }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || '主要実績'} />
                </h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="indigo-slide-body" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: 0,
                justifyContent: 'flex-start', // 上詰めを基本に
                paddingTop: '1cqi' 
            }}>
                {(() => {
                    const count = activeStats.length;
                    const aCount = annotations.length;
                    const isSplit = layout_variation === 'two-column';
                    
                    // 情報密度のスコア化（垂直方向の溢れをより厳格に評価）
                    const densityScore = (count * (isSplit ? 4.5 : 3.5)) + (mainText ? 4 : 0) + (aCount > 0 ? 1.5 : 0);
                    
                    // 動的な設定値
                    const isLowDensity = count <= 2 && !isSplit;
                    const isHighDensity = count >= 4 || (isSplit && count >= 3);

                    // スケーリング（見切れ防止のため感度を向上）
                    const scaleFactor = densityScore > 22 ? 0.68
                                      : densityScore > 16 ? 0.78
                                      : densityScore > 10 ? 0.88
                                      : 1.0;
                    
                    // グリッド設定
                    let gridCols = '1fr';
                    if (!isSplit) {
                        gridCols = count === 1 ? '1fr' : count === 2 ? '1fr 1fr' : count === 4 ? '1fr 1fr' : 'repeat(auto-fit, minmax(22cqi, 1fr))';
                    } else {
                        gridCols = count >= 3 ? '1fr 1fr' : '1fr';
                    }

                    const gridGap = isLowDensity ? '5cqi' : isHighDensity ? '1.2cqi' : '2.5cqi';
                    
                    // カード個別設定
                    const cardPadding = isLowDensity ? '5cqi 4cqi' : isHighDensity ? '1.5cqi 1.2cqi' : '2.5cqi 2cqi';
                    const valueSize = isLowDensity ? '7.5cqi' : isHighDensity ? '3.5cqi' : '5cqi';
                    const labelSize = isLowDensity ? '2.4cqi' : '1.4cqi';

                    const StatsGrid = () => (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: gridCols,
                            gap: gridGap,
                            width: '100%'
                        }}>
                            {activeStats.map((stat, idx) => {
                                const subtext = stat.subtext || stat.description;
                                return (
                                    <motion.div 
                                        key={idx}
                                        className="indigo-highlight-card"
                                        style={{ 
                                            textAlign: 'center', 
                                            padding: cardPadding,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            background: 'linear-gradient(135deg, #ffffff 0%, rgba(99, 102, 241, 0.05) 100%)',
                                            border: '1px solid var(--slide-border)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            minHeight: isLowDensity ? '22cqi' : isHighDensity ? '12cqi' : '16cqi'
                                        }}
                                        {...(!isStatic && {
                                            initial: { opacity: 0, scale: 0.9 },
                                            animate: { opacity: 1, scale: 1 },
                                            transition: { delay: 0.1 + idx * 0.1 }
                                        })}
                                    >
                                        {/* 装飾用サークル背景 */}
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: '-10%', 
                                            right: '-10%', 
                                            width: '35%', 
                                            height: '35%', 
                                            background: 'rgba(99, 102, 241, 0.04)', 
                                            borderRadius: '50%',
                                            zIndex: 0
                                        }} />

                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ 
                                                fontSize: valueSize, 
                                                fontWeight: 800, 
                                                color: 'var(--slide-primary)',
                                                lineHeight: 1,
                                                marginBottom: '0.6cqi',
                                                letterSpacing: '-0.02em'
                                            }}>
                                                {stat.value}
                                                {stat.unit && <span style={{ fontSize: '0.45em', marginLeft: '0.2em', fontWeight: 600, color: 'var(--slide-muted)' }}>{stat.unit}</span>}
                                            </div>
                                            <div style={{ 
                                                fontSize: labelSize, 
                                                fontWeight: 700, 
                                                color: 'var(--slide-heading)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em'
                                            }}>
                                                <SlideMarkdown content={stat.label} />
                                            </div>
                                            {subtext && (
                                                <div style={{ 
                                                    fontSize: isLowDensity ? '1.4cqi' : '1.1cqi', 
                                                    color: 'var(--slide-muted)', 
                                                    marginTop: '0.8cqi',
                                                    fontWeight: 500,
                                                    lineHeight: 1.4
                                                }}>
                                                    <SlideMarkdown content={subtext} />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );

                    return (
                        <div style={{ 
                            transform: `scale(${scaleFactor})`, 
                            transformOrigin: 'top center', // 起点を上部に
                            width: '100%',
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: gridGap,
                            justifyContent: isLowDensity ? 'center' : 'flex-start',
                            marginTop: isLowDensity ? 'auto' : '0',
                            marginBottom: isLowDensity ? 'auto' : '0'
                        }}>
                            {isSplit ? (
                                <div style={{ display: 'flex', gap: '4cqi', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <motion.div 
                                            className="indigo-point-box" 
                                            style={{ padding: '2.5cqi 3cqi', borderLeft: '6px solid var(--slide-primary)' }}
                                            {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.2 } })}
                                        >
                                            <div style={{ fontSize: '1.7cqi', margin: 0, color: '#475569', fontWeight: 500, lineHeight: 1.6 }}>
                                                <SlideMarkdown content={mainText} />
                                            </div>
                                        </motion.div>
                                    </div>
                                    <div style={{ flex: 1.4 }}>
                                        <StatsGrid />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: gridGap,
                                    alignItems: 'center'
                                }}>
                                    <StatsGrid />
                                    {mainText && (
                                        <motion.div 
                                            className="indigo-point-box" 
                                            style={{ 
                                                width: '100%',
                                                marginTop: isLowDensity ? '2cqi' : '1cqi', 
                                                padding: isLowDensity ? '2.5cqi 4cqi' : '1.5cqi 2.5cqi',
                                                textAlign: 'center'
                                            }}
                                            {...(!isStatic && { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5 } })}
                                        >
                                            <div style={{ fontSize: isLowDensity ? '2cqi' : '1.6cqi', margin: 0, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
                                                <SlideMarkdown content={mainText} />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
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
                    marginTop: '2cqi', 
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

export default StatsSlide;
