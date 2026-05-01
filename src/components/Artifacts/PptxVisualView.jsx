import React from 'react';
import './PptxVisualView.css';

/**
 * PptxVisualView コンポーネント
 * スライドの16:9ビジュアルプレビューをレンダリングする。
 * pptxGenerator.js のロジックと同一の座標系（パーセントベース絶対配置）を使用。
 */
const PptxVisualView = ({ pptxSpec }) => {
    const { slides = [], theme = {} } = pptxSpec || {};

    if (!slides || slides.length === 0) {
        return (
            <div className="pptx-visual-view empty">
                <p>スライドデータがありません。</p>
            </div>
        );
    }

    // テーマカラーの取得（フォールバック付き）
    const sanitizeColor = (colorStr, fallback) => {
        if (!colorStr) return fallback;
        const cleaned = colorStr.replace('#', '');
        if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) return `#${cleaned.toUpperCase()}`;
        if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
            return `#${cleaned.split('').map(c => c + c).join('').toUpperCase()}`;
        }
        return fallback;
    };

    const bgColor = sanitizeColor(theme.backgroundColor, '#FFFFFF');
    const textColor = sanitizeColor(theme.textColor, '#333333');
    const primaryColor = sanitizeColor(theme.primaryColor, '#1C51DB');
    const secondaryColor = sanitizeColor(theme.secondaryColor, '#EEF7FF');
    const accentColor = sanitizeColor(theme.accentColor, '#FF5722');
    const mutedColor = sanitizeColor(theme.mutedTextColor, '#888888');
    const lightGray = '#F9F9FA';
    const borderGray = '#E0E0E0';

    // 色の明度を判定して「暗い色」かどうかを返すヘルパー
    const isDarkColor = (hex) => {
        if (!hex || typeof hex !== 'string') return false;
        // 正規化（#を除去）
        const color = hex.startsWith('#') ? hex.substring(1) : hex;
        if (color.length !== 6 && color.length !== 3) return false;
        
        let r, g, b;
        if (color.length === 6) {
            r = parseInt(color.substring(0, 2), 16);
            g = parseInt(color.substring(2, 4), 16);
            b = parseInt(color.substring(4, 6), 16);
        } else {
            r = parseInt(color[0] + color[0], 16);
            g = parseInt(color[1] + color[1], 16);
            b = parseInt(color[2] + color[2], 16);
        }
        // YIQ formula (明度)
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        // しきい値を145から160に引き上げ、より濃い色を確実にカバー
        return yiq < 160;
    };

    // 背景色に応じて「白」か「デフォルトの文字色」を返す
    const getContrastColor = (bgColor, defaultColor = textColor) => {
        return isDarkColor(bgColor) ? '#FFFFFF' : defaultColor;
    };
    
    // フォントの取得
    const fontHeading = theme.fontFamilyHeading ? `'${theme.fontFamilyHeading}', sans-serif` : "'Meiryo', sans-serif";
    const fontBody = theme.fontFamilyBody ? `'${theme.fontFamilyBody}', sans-serif` : "'Meiryo', sans-serif";

    const themeVars = {
        '--slide-bg': bgColor,
        '--slide-text': textColor,
        '--slide-primary': primaryColor,
        '--slide-secondary': secondaryColor,
        '--slide-accent': accentColor,
        '--slide-muted': mutedColor,
        '--slide-light-gray': lightGray,
        '--slide-border-gray': borderGray,
        '--font-heading': fontHeading,
        '--font-body': fontBody,
    };

    return (
        <div className="pptx-visual-view" style={themeVars}>
            <div className="visual-slides-container">
                {slides.map((slide, index) => (
                    <SlideVisual 
                        key={index} 
                        slide={slide} 
                        index={index} 
                        isDarkColor={isDarkColor} 
                        getContrastColor={getContrastColor}
                        secondaryColor={secondaryColor}
                        primaryColor={primaryColor}
                    />
                ))}
            </div>
        </div>
    );
};

// ヘルパー：x, y, w, hを%に変換 (ベース: 10.0 x 5.625)
const pX = (val) => `${(val / 10.0) * 100}%`;
const pY = (val) => `${(val / 5.625) * 100}%`;
const pW = (val) => `${(val / 10.0) * 100}%`;
const pH = (val) => `${(val / 5.625) * 100}%`;

// マスター要素: デフォルトスライド
const DefaultMaster = ({ index, title }) => (
    <>
        {/* 左上のアクセントライン */}
        <div className="abs-rect" style={{ left: pX(0), top: pY(0.3), width: pW(0.1), height: pH(0.45), backgroundColor: 'var(--slide-primary)' }}></div>
        {/* 右上 ロゴプレースホルダー */}
        <div className="abs-text logo-text" style={{ right: pX(0.5), top: pY(0.3), color: 'var(--slide-primary)', fontFamily: 'var(--font-heading)' }}>
            ● Company LOGO
        </div>
        {/* フッター区切り線 */}
        <div className="abs-line" style={{ left: pX(0.3), top: pY(5.2), width: pW(9.4), height: '1px', backgroundColor: 'var(--slide-border-gray)' }}></div>
        {/* 左下 コピーライト */}
        <div className="abs-text" style={{ left: pX(0.3), top: pY(5.3), fontSize: '1.2cqi', color: '#888888', fontFamily: 'Arial' }}>
            Copyright © {new Date().getFullYear()} All Rights Reserved.
        </div>
        {/* ページ番号 */}
        <div className="abs-text" style={{ right: pX(0.3), top: pY(5.3), fontSize: '1.4cqi', color: '#888888', fontFamily: 'Arial' }}>
            {index + 1}
        </div>
        {/* 見出し */}
        {title && (
            <div className="abs-text slide-header-title" style={{ left: pX(0.3), top: pY(0.3), width: pW(8.0), color: 'var(--slide-text)', fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>
                {title}
            </div>
        )}
    </>
);

// リードテキスト描画（タイトル直下の導入文）
const LeadText = ({ lead }) => {
    if (!lead) return null;
    return (
        <div className="abs-text lead-text" style={{ left: pX(0.3), top: pY(0.9), width: pW(9.0), color: 'var(--slide-muted)', fontFamily: 'var(--font-body)', fontSize: '2cqi' }}>
            {lead}
        </div>
    );
};

// フッターノート描画（フッター線の上）
const FooterNote = ({ note }) => {
    if (!note) return null;
    return (
        <div className="abs-text footer-note" style={{ left: pX(0.3), top: pY(4.95), width: pW(9.0), color: 'var(--slide-muted)', fontFamily: 'var(--font-body)', fontSize: '1.4cqi' }}>
            {note}
        </div>
    );
};

// コンテンツ開始Y座標を計算するヘルパー
const contentStartY = (hasLead) => hasLead ? 1.5 : 1.3;

const SlideVisual = ({ slide, index, isDarkColor, getContrastColor, secondaryColor, primaryColor }) => {
    
    // スライドタイプに応じたレンダリング
    const renderContent = () => {
        switch (slide.type) {
            case 'title':
                return (
                    <div className="slide-perfect-canvas bg-primary">
                        {/* 底部の白い帯 */}
                        <div className="abs-rect" style={{ left: pX(0), top: pY(4.5), width: pW(10.0), height: pH(1.125), backgroundColor: '#FFFFFF' }}></div>
                        {/* Company LOGO */}
                        <div className="abs-text logo-text" style={{ right: pX(0.5), top: pY(4.8), color: 'var(--slide-primary)', fontFamily: 'var(--font-heading)' }}>
                            ● Company LOGO
                        </div>
                        {/* Kicker（補助ラベル） */}
                        {slide.kicker ? (
                            <div className="abs-text" style={{ left: pX(0.5), top: pY(0.5), color: 'rgba(255,255,255,0.8)', fontSize: '1.6cqi', fontWeight: 'bold', fontFamily: 'Arial', letterSpacing: '0.1em' }}>
                                {slide.kicker}
                            </div>
                        ) : (
                            <div className="abs-text" style={{ left: pX(0.5), top: pY(0.5), color: '#FFFFFF', fontSize: '1.6cqi', fontWeight: 'bold', fontFamily: 'Arial' }}>
                                CONFIDENTIAL
                            </div>
                        )}
                        {/* Title */}
                        <div className="abs-text title-main" style={{ left: pX(0.5), top: pY(2.0), width: pW(9.0), color: '#FFFFFF', fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>
                            {slide.title}
                        </div>
                        {/* Subtitle */}
                        {slide.subtitle && (
                            <div className="abs-text title-sub" style={{ left: pX(0.5), top: pY(3.5), width: pW(9.0), color: '#FFFFFF', fontFamily: 'var(--font-body)' }}>
                                {slide.subtitle}
                            </div>
                        )}
                    </div>
                );
            case 'section':
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} />
                        {/* 大きなアクセント背景 */}
                        <div className="abs-rect" style={{ left: pX(0), top: pY(2.0), width: pW(10.0), height: pH(1.6), backgroundColor: 'var(--slide-secondary)' }}></div>
                        <div className="abs-rect" style={{ left: pX(0), top: pY(2.0), width: pW(0.15), height: pH(1.6), backgroundColor: 'var(--slide-primary)' }}></div>
                        
                        <div className="abs-text section-main" style={{ 
                            left: pX(0.5), top: pY(2.2), width: pW(9.0), 
                            color: getContrastColor(secondaryColor, primaryColor), 
                            fontFamily: 'var(--font-heading)', fontWeight: 'bold' 
                        }}>
                            {slide.title}
                        </div>
                        {slide.subtitle && (
                            <div className="abs-text section-sub" style={{ 
                                left: pX(0.5), top: pY(3.0), width: pW(9.0), 
                                color: getContrastColor(secondaryColor, 'var(--slide-text)') 
                            }}>
                                {slide.subtitle}
                            </div>
                        )}
                    </div>
                );
            case 'agenda': {
                const items = slide.items || [];
                const itemsPerCol = Math.ceil(items.length / 2);
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title || "目次"} />
                        <LeadText lead={slide.lead} />
                        {items.map((item, i) => {
                            const isRight = i >= itemsPerCol;
                            const colNum = isRight ? 1 : 0;
                            const rowNum = isRight ? i - itemsPerCol : i;
                            const x = 0.5 + colNum * 4.8;
                            const startY = contentStartY(!!slide.lead);
                            const y = startY + rowNum * 0.7;
                            return (
                                <React.Fragment key={i}>
                                    <div className="abs-text agenda-num" style={{ left: pX(x), top: pY(y), width: pW(0.5), color: 'var(--slide-primary)', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Arial' }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <div className="abs-text agenda-text" style={{ left: pX(x + 0.6), top: pY(y), width: pW(3.5), color: 'var(--slide-text)', fontWeight: 'bold', fontFamily: 'var(--font-body)' }}>
                                        {item}
                                    </div>
                                    <div className="abs-line" style={{ left: pX(x + 0.6), top: pY(y + 0.4), width: pW(3.8), height: '1px', borderBottom: '1px dashed var(--slide-border-gray)' }}></div>
                                </React.Fragment>
                            );
                        })}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }
            case 'bullet': {
                const bullets = slide.bullets || [];
                const count = bullets.length || 1;
                const startY = contentStartY(!!slide.lead);
                const availH = 4.8 - startY;
                const blockHeight = Math.min(0.8, availH / count);
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {bullets.map((b, i) => {
                            const y = startY + i * (blockHeight + 0.1);
                            return (
                                <React.Fragment key={i}>
                                    <div className="abs-rect" style={{ left: pX(0.5), top: pY(y + 0.1), width: pW(0.4), height: pH(0.4), backgroundColor: 'var(--slide-primary)' }}></div>
                                    <div className="abs-text bullet-num" style={{ left: pX(0.5), top: pY(y + 0.1), width: pW(0.4), color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Arial', display: 'flex', alignItems: 'center', justifyContent: 'center', height: pH(0.4) }}>
                                        {i + 1}
                                    </div>
                                    <div className="abs-text bullet-text" style={{ left: pX(1.1), top: pY(y), width: pW(8.4), height: pH(0.6), color: 'var(--slide-text)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center' }}>
                                        {b}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }
            case 'two-column': {
                const startY = contentStartY(!!slide.lead);
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {[slide.left, slide.right].map((colData, colIdx) => {
                            if (!colData) return null;
                            const xBase = colIdx === 0 ? 0.5 : 5.2;
                            const cardH = 4.8 - startY;
                            return (
                                <React.Fragment key={`col-${colIdx}`}>
                                    {/* カード背景 */}
                                    <div className="abs-rect" style={{ 
                                        left: pX(xBase), 
                                        top: pY(startY), 
                                        width: pW(4.3), 
                                        height: pH(cardH), 
                                        backgroundColor: 'var(--slide-light-gray)', 
                                        border: '1px solid var(--slide-border-gray)', 
                                        borderBottomLeftRadius: '1.5cqi', 
                                        borderBottomRightRadius: '1.5cqi',
                                        borderTopLeftRadius: '0',
                                        borderTopRightRadius: '0'
                                    }}></div>
                                    {/* ヘッダー背景 */}
                                    {colData.heading && (
                                        <>
                                            <div className="abs-rect" style={{ 
                                                left: pX(xBase), 
                                                top: pY(startY), 
                                                width: pW(4.3), 
                                                height: pH(0.6), 
                                                backgroundColor: 'var(--slide-primary)', 
                                                borderRadius: '0',
                                                borderBottom: '1px solid var(--slide-border-gray)'
                                            }}></div>
                                            <div className="abs-text" style={{ 
                                                left: pX(xBase), 
                                                top: pY(startY + 0.1), 
                                                width: pW(4.3), 
                                                textAlign: 'center', 
                                                color: '#FFFFFF', 
                                                fontFamily: 'var(--font-heading)', 
                                                fontWeight: 'bold', 
                                                fontSize: '2.4cqi' 
                                            }}>
                                                {colData.heading}
                                            </div>
                                        </>
                                    )}
                                    {/* Body points */}
                                    <div className="abs-text" style={{ 
                                        left: pX(xBase + 0.2), 
                                        top: pY(startY + 0.8), 
                                        width: pW(4.3 - 0.4), 
                                        height: pH(cardH - 1.0), 
                                        color: 'var(--slide-text)', 
                                        fontFamily: 'var(--font-body)', 
                                        fontSize: '2.2cqi' 
                                    }}>
                                        <ul style={{ margin: 0, paddingLeft: '1.2em', lineHeight: 1.4, listStyle: 'none' }}>
                                            {colData.bodyPoints?.map((bp, i) => (
                                                <li key={i} style={{ position: 'relative', marginBottom: '0.4em' }}>
                                                    <span style={{ position: 'absolute', left: '-1em', color: 'var(--slide-text)', opacity: 0.8 }}>•</span>
                                                    {bp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }
            case 'table': {
                const startY = contentStartY(!!slide.lead);
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        <div className="abs-rect" style={{ left: pX(0.5), top: pY(startY), width: pW(9.0), height: pH(4.8 - startY), overflow: 'visible' }}>
                            <table style={{ 
                                width: '100%', 
                                borderCollapse: 'collapse', 
                                border: '1px solid var(--slide-border-gray)', 
                                fontFamily: 'var(--font-body)', 
                                fontSize: '1.9cqi',
                                tableLayout: 'fixed'
                            }}>
                                {slide.headers && (
                                    <thead>
                                        <tr>
                                            {slide.headers.map((h, i) => (
                                                <th key={i} style={{ 
                                                    backgroundColor: 'var(--slide-primary)', 
                                                    color: getContrastColor(primaryColor, '#FFFFFF'), 
                                                    padding: '8px', 
                                                    border: '1px solid var(--slide-border-gray)', 
                                                    fontFamily: 'var(--font-heading)', 
                                                    fontWeight: 'bold', 
                                                    textAlign: 'center',
                                                    width: i === 0 ? '35%' : 'auto'
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                )}
                                <tbody>
                                    {slide.rows?.map((row, rIdx) => (
                                        <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : 'var(--slide-light-gray)' }}>
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} style={{ 
                                                    backgroundColor: cIdx === 0 ? 'var(--slide-secondary)' : 'transparent', 
                                                    color: cIdx === 0 ? getContrastColor(secondaryColor) : 'var(--slide-text)',
                                                    fontWeight: cIdx === 0 ? 'bold' : 'normal', 
                                                    padding: '4px 8px', 
                                                    border: '1px solid rgba(0,0,0,0.1)', 
                                                    textAlign: 'left', 
                                                    verticalAlign: 'middle',
                                                    wordBreak: 'break-all'
                                                }}>
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }
            case 'chart-placeholder': {
                let chartY = contentStartY(!!slide.lead);
                let chartH = 4.8 - chartY;
                const hasInsight = !!slide.insight;
                if (hasInsight) {
                    chartY = chartY + 0.8;
                    chartH = chartH - 0.8;
                }
                // チャートタイプの表示名マッピング
                const chartTypeLabel = {
                    'bar': 'Bar', 'line': 'Line', 'pie': 'Pie', 'doughnut': 'Doughnut',
                    'stacked-bar': 'Stacked Bar', 'horizontal-bar': 'Horizontal Bar'
                };
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {hasInsight && (
                            <>
                                <div className="abs-rect" style={{ left: pX(0.5), top: pY(contentStartY(!!slide.lead)), width: pW(9.0), height: pH(0.6), backgroundColor: 'var(--slide-secondary)', borderRadius: '4px' }}></div>
                                <div className="abs-text" style={{ left: pX(0.6), top: pY(contentStartY(!!slide.lead) + 0.1), width: pW(8.8), color: getContrastColor(secondaryColor, 'var(--slide-primary)'), fontWeight: 'bold', fontFamily: 'var(--font-body)', fontSize: '2cqi' }}>
                                    💡 Insight: {slide.insight}
                                </div>
                            </>
                        )}
                        {/* Chart Area */}
                        <div className="abs-rect" style={{ left: pX(0.5), top: pY(chartY), width: pW(9.0), height: pH(chartH), display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px dashed var(--slide-border-gray)', backgroundColor: '#fafafa' }}>
                            <div style={{ fontSize: '4cqi', marginBottom: '8px' }}>📊</div>
                            <div style={{ fontSize: '2cqi', fontWeight: 'bold', color: 'var(--slide-primary)' }}>グラフ: {chartTypeLabel[slide.chartType] || slide.chartType}</div>
                            <div style={{ fontSize: '1.5cqi', color: '#888' }}>PowerPoint上でチャートオブジェクトとして描画されます</div>
                        </div>
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }
            case 'summary': {
                const startY = contentStartY(!!slide.lead);
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title || "要約"} />
                        <LeadText lead={slide.lead} />
                        {/* カード背景 */}
                        <div className="abs-rect" style={{ 
                            left: pX(0.5), 
                            top: pY(startY), 
                            width: pW(9.0), 
                            height: pH(4.8 - startY), 
                            backgroundColor: 'var(--slide-light-gray)', 
                            borderBottomLeftRadius: '1.5cqi',
                            borderBottomRightRadius: '1.5cqi'
                        }}></div>
                        {/* 左リボン装飾 */}
                        <div className="abs-rect" style={{ left: pX(0.5), top: pY(startY + 0.2), width: pW(0.1), height: pH(0.8), backgroundColor: 'var(--slide-primary)' }}></div>
                        <div className="abs-text" style={{ left: pX(0.8), top: pY(startY + 0.3), width: pW(8.5), color: 'var(--slide-primary)', fontFamily: 'var(--font-heading)', fontWeight: 'bold', fontSize: '2.8cqi' }}>
                            キーポイント
                        </div>
                        <div className="abs-text" style={{ left: pX(0.8), top: pY(startY + 0.9), width: pW(8.5), height: pH(4.8 - startY - 1.2), color: 'var(--slide-text)', fontFamily: 'var(--font-body)', fontSize: '2.4cqi' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8em' }}>
                                {slide.summaryPoints?.map((p, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <span style={{ 
                                            fontWeight: 'bold', 
                                            color: 'var(--slide-text)',
                                            fontSize: '1.2em',
                                            lineHeight: '1',
                                            marginTop: '0.1em'
                                        }}>✓</span>
                                        <span>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }

            case 'toc-list': {
                const items = slide.items || [];
                const startY = contentStartY(!!slide.lead);
                const rowH = Math.min(0.65, (4.8 - startY) / Math.max(items.length, 1));
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title || "目次"} />
                        <LeadText lead={slide.lead} />
                        {items.map((item, i) => {
                            const y = startY + i * rowH;
                            return (
                                <React.Fragment key={i}>
                                    <div className="abs-text toc-num" style={{ left: pX(0.5), top: pY(y), width: pW(0.8), color: 'var(--slide-primary)', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Arial' }}>
                                        {item.index || String(i + 1).padStart(2, '0')}
                                    </div>
                                    <div className="abs-text toc-label" style={{ left: pX(1.4), top: pY(y), width: pW(6.0), color: 'var(--slide-text)', fontWeight: 'bold', fontFamily: 'var(--font-body)' }}>
                                        {item.label}
                                    </div>
                                    <div className="abs-text toc-page" style={{ left: pX(8.0), top: pY(y), width: pW(1.5), color: 'var(--slide-muted)', fontFamily: 'Arial', textAlign: 'right' }}>
                                        {item.page}
                                    </div>
                                    <div className="abs-line" style={{ left: pX(1.4), top: pY(y + rowH * 0.8), width: pW(8.1), height: '1px', borderBottom: '1px dashed var(--slide-border-gray)' }}></div>
                                </React.Fragment>
                            );
                        })}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }

            case 'numbered-points': {
                const points = slide.points || [];
                const startY = contentStartY(!!slide.lead);
                const count = points.length || 1;
                const blockH = Math.min(1.0, (4.8 - startY) / count);
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {points.map((pt, i) => {
                            const y = startY + i * blockH;
                            return (
                                <React.Fragment key={i}>
                                    <div className="abs-text numbered-num" style={{ 
                                        left: pX(0.5), top: pY(y), width: pW(0.6), 
                                        color: 'var(--slide-primary)', fontWeight: 'bold', 
                                        fontFamily: 'Arial', fontSize: '3.5cqi',
                                        lineHeight: '1'
                                    }}>
                                        {pt.number || String(i + 1)}
                                    </div>
                                    <div className="abs-text numbered-title" style={{ 
                                        left: pX(1.2), top: pY(y), width: pW(8.3), 
                                        color: 'var(--slide-primary)', fontWeight: 'bold', 
                                        fontFamily: 'var(--font-heading)', fontSize: '2.5cqi',
                                        borderBottom: '2px solid var(--slide-primary)',
                                        paddingBottom: '2px'
                                    }}>
                                        {pt.title}
                                    </div>
                                    <div className="abs-text numbered-desc" style={{ 
                                        left: pX(1.2), top: pY(y + 0.45), width: pW(8.3), 
                                        color: 'var(--slide-text)', fontFamily: 'var(--font-body)', 
                                        fontSize: '1.9cqi'
                                    }}>
                                        {pt.description}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }

            case 'feature-cards': {
                const cards = slide.cards || [];
                const cardCount = cards.length || 1;
                const startY = contentStartY(!!slide.lead);
                const totalW = 9.0;
                const gap = 0.3;
                const cardW = (totalW - gap * (cardCount - 1)) / cardCount;
                const cardH = 4.8 - startY;
                const cY = startY;
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {cards.map((card, i) => {
                            return (
                                <div key={i} className="abs-rect" style={{ 
                                    left: pX(0.5 + i * (cardW + 0.3)), top: pY(cY), width: pW(cardW), height: pH(cardH), 
                                    backgroundColor: 'var(--slide-secondary)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', boxSizing: 'border-box'
                                }}>
                                    <div className="card-title" style={{ fontWeight: 'bold', color: getContrastColor(secondaryColor, primaryColor), marginBottom: '8px' }}>{card.title}</div>
                                    <div className="card-desc" style={{ color: getContrastColor(secondaryColor), textAlign: 'center' }}>{card.description}</div>
                                    {card.caption && (
                                        <div style={{ marginTop: 'auto', fontSize: '1.2cqi', fontStyle: 'italic', color: getContrastColor(secondaryColor, 'var(--slide-muted)') }}>
                                            {card.caption}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }

            case 'pricing-table': {
                const plans = slide.plans || [];
                const featureRows = slide.featureRows || [];
                const startY = contentStartY(!!slide.lead);
                const labelColW = 2.5;
                const planColW = (9.0 - labelColW) / Math.max(plans.length, 1);
                const rowH = Math.min(0.5, (4.8 - startY - 1.0) / Math.max(featureRows.length, 1));
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {plans.map((plan, i) => {
                            const x = 0.5 + labelColW + i * planColW;
                            const isHighlight = plan.highlight;
                            return (
                                <React.Fragment key={`plan-${i}`}>
                                    <div className="abs-rect" style={{ 
                                        left: pX(x), top: pY(startY), 
                                        width: pW(planColW), height: pH(0.9),
                                        backgroundColor: isHighlight ? 'var(--slide-primary)' : 'var(--slide-secondary)',
                                        border: isHighlight ? '2px solid var(--slide-primary)' : '1px solid var(--slide-border-gray)'
                                    }}></div>
                                    <div className="abs-text" style={{ 
                                        left: pX(x), top: pY(startY + 0.05), 
                                        width: pW(planColW), 
                                        color: isHighlight ? '#FFFFFF' : getContrastColor(secondaryColor), 
                                        fontWeight: 'bold', fontFamily: 'var(--font-heading)', 
                                        fontSize: '2cqi', textAlign: 'center'
                                    }}>
                                        {plan.name}
                                    </div>
                                    <div className="abs-text" style={{ 
                                        left: pX(x), top: pY(startY + 0.45), 
                                        width: pW(planColW), 
                                        color: isHighlight ? 'rgba(255,255,255,0.9)' : getContrastColor(secondaryColor, mutedColor), 
                                        fontFamily: 'var(--font-body)', 
                                        fontSize: '1.6cqi', textAlign: 'center'
                                    }}>
                                        {plan.price}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        {featureRows.map((row, rIdx) => {
                            const y = startY + 1.0 + rIdx * rowH;
                            const rowBg = rIdx % 2 === 0 ? '#FFFFFF' : 'var(--slide-light-gray)';
                            return (
                                <React.Fragment key={`row-${rIdx}`}>
                                    <div className="abs-rect" style={{ left: pX(0.5), top: pY(y), width: pW(9.0), height: pH(rowH), backgroundColor: rowBg, border: '1px solid var(--slide-border-gray)' }}></div>
                                    <div className="abs-text" style={{ left: pX(0.6), top: pY(y + 0.05), width: pW(labelColW - 0.2), color: 'var(--slide-text)', fontWeight: 'bold', fontFamily: 'var(--font-body)', fontSize: '1.7cqi' }}>
                                        {row.label}
                                    </div>
                                    {row.values?.map((val, vIdx) => {
                                        const x = 0.5 + labelColW + vIdx * planColW;
                                        return (
                                            <div key={vIdx} className="abs-text" style={{ left: pX(x), top: pY(y + 0.05), width: pW(planColW), color: 'var(--slide-text)', fontFamily: 'var(--font-body)', fontSize: '1.7cqi', textAlign: 'center' }}>
                                                {val}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }

            case 'chart-analysis': {
                const charts = slide.charts || [];
                const insights = slide.insights || [];
                const startY = contentStartY(!!slide.lead);
                const hasInsights = insights.length > 0;
                const chartAreaW = hasInsights ? 5.5 : 9.0;
                const chartTypeLabel = {
                    'bar': 'Bar', 'line': 'Line', 'pie': 'Pie', 'doughnut': 'Doughnut',
                    'stacked-bar': 'Stacked Bar', 'horizontal-bar': 'Horizontal Bar'
                };
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {charts.map((chart, ci) => {
                            const chartH = charts.length === 1 ? (4.8 - startY) : (4.8 - startY) / 2;
                            const y = startY + ci * chartH;
                            return (
                                <div key={ci} className="abs-rect" style={{ 
                                    left: pX(0.5), top: pY(y), 
                                    width: pW(chartAreaW), height: pH(chartH - 0.1), 
                                    display: 'flex', flexDirection: 'column', 
                                    justifyContent: 'center', alignItems: 'center', 
                                    border: '1px dashed var(--slide-border-gray)', 
                                    backgroundColor: '#fafafa' 
                                }}>
                                    <div style={{ fontSize: '3cqi', marginBottom: '4px' }}>📊</div>
                                    <div style={{ fontSize: '1.8cqi', fontWeight: 'bold', color: 'var(--slide-primary)' }}>
                                        {chart.chartTitle || 'グラフ'}
                                    </div>
                                    <div style={{ fontSize: '1.3cqi', color: '#888' }}>
                                        {chartTypeLabel[chart.chartType] || chart.chartType}
                                    </div>
                                </div>
                            );
                        })}
                        {/* 洞察リスト（右側） */}
                        {hasInsights && (
                            <>
                                <div className="abs-rect" style={{ 
                                    left: pX(6.2), top: pY(startY), 
                                    width: pW(3.3), height: pH(4.8 - startY), 
                                    backgroundColor: 'var(--slide-secondary)',
                                    borderRadius: '0.8cqi'
                                }}></div>
                                <div className="abs-text" style={{ 
                                    left: pX(6.4), top: pY(startY + 0.2), 
                                    width: pW(2.9), 
                                    color: getContrastColor(secondaryColor, primaryColor), fontWeight: 'bold', 
                                    fontFamily: 'var(--font-heading)', fontSize: '2cqi'
                                }}>
                                    分析の要点
                                </div>
                                {insights.map((ins, i) => (
                                    <div key={i} className="abs-text" style={{ 
                                        left: pX(6.4), top: pY(startY + 0.7 + i * 0.8), 
                                        width: pW(2.9), 
                                        color: getContrastColor(secondaryColor, 'var(--slide-text)'), 
                                        fontFamily: 'var(--font-body)', 
                                        fontSize: '1.6cqi' 
                                    }}>
                                        <span style={{ color: getContrastColor(secondaryColor, primaryColor), marginRight: '0.5em' }}>●</span>
                                        {ins}
                                    </div>
                                ))}
                            </>
                        )}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }

            case 'profile-fact-sheet': {
                // 会社概要・人物紹介スライド: ファクト一覧 + プロフィール
                const facts = slide.facts || [];
                const profile = slide.profile;
                const startY = contentStartY(!!slide.lead);
                const hasProfile = !!profile;
                const factsW = hasProfile ? 5.5 : 9.0;
                const factH = Math.min(0.5, (4.8 - startY) / Math.max(facts.length, 1));
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title} />
                        <LeadText lead={slide.lead} />
                        {/* ファクト一覧（テーブル風） */}
                        {facts.map((fact, i) => {
                            const y = startY + i * factH;
                            const rowBg = i % 2 === 0 ? '#FFFFFF' : 'var(--slide-light-gray)';
                            return (
                                <React.Fragment key={i}>
                                    <div className="abs-rect" style={{ left: pX(0.5), top: pY(y), width: pW(factsW), height: pH(factH), backgroundColor: rowBg, border: '1px solid var(--slide-border-gray)' }}></div>
                                    <div className="abs-text" style={{ left: pX(0.6), top: pY(y + 0.05), width: pW(1.8), color: 'var(--slide-muted)', fontWeight: 'bold', fontFamily: 'var(--font-body)', fontSize: '1.7cqi' }}>
                                        {fact.label}
                                    </div>
                                    <div className="abs-text" style={{ left: pX(2.5), top: pY(y + 0.05), width: pW(factsW - 2.1), color: 'var(--slide-text)', fontFamily: 'var(--font-body)', fontSize: '1.7cqi' }}>
                                        {fact.value}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        {/* プロフィール（右カラム） */}
                        {hasProfile && (
                            <>
                                {/* プロフィールカード背景 */}
                                <div className="abs-rect" style={{ 
                                    left: pX(6.2), top: pY(startY), 
                                    width: pW(3.3), height: pH(4.8 - startY), 
                                    backgroundColor: 'var(--slide-secondary)',
                                    borderRadius: '0.8cqi',
                                    border: '1px solid var(--slide-border-gray)'
                                }}></div>
                                {/* プロフィールヘッダー */}
                                <div className="abs-text" style={{ 
                                    left: pX(6.2), top: pY(startY + 0.2), 
                                    width: pW(3.3), 
                                    color: getContrastColor(secondaryColor, primaryColor), fontWeight: 'bold', 
                                    fontFamily: 'var(--font-heading)', fontSize: '2cqi',
                                    textAlign: 'center'
                                }}>
                                    {profile.role || '代表者'}
                                </div>
                                {/* 画像プレースホルダー */}
                                <div className="abs-rect" style={{ 
                                    left: pX(7.2), top: pY(startY + 0.7), 
                                    width: pW(1.3), height: pH(1.3), 
                                    backgroundColor: 'var(--slide-border-gray)',
                                    borderRadius: '0.5cqi',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '2.5cqi', color: '#999' }}>👤</span>
                                </div>
                                {/* 名前 */}
                                <div className="abs-text" style={{ 
                                    left: pX(6.4), top: pY(startY + 2.2), 
                                    width: pW(2.9), 
                                    color: getContrastColor(secondaryColor, 'var(--slide-text)'), fontWeight: 'bold', 
                                    fontFamily: 'var(--font-heading)', fontSize: '2.4cqi',
                                    textAlign: 'center'
                                }}>
                                    {profile.name}
                                </div>
                                {/* Bio */}
                                <div className="abs-text" style={{ 
                                    left: pX(6.4), top: pY(startY + 2.7), 
                                    width: pW(2.9), height: pH(1.5),
                                    color: 'var(--slide-text)', 
                                    fontFamily: 'var(--font-body)', fontSize: '1.4cqi',
                                    textAlign: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {profile.bio}
                                </div>
                            </>
                        )}
                        <FooterNote note={slide.footerNote} />
                    </div>
                );
            }

            default:
                return (
                    <div className="slide-perfect-canvas bg-default">
                        <DefaultMaster index={index} title={slide.title || "スライド"} />
                        <div className="abs-text" style={{ left: pX(0.5), top: pY(2.0), width: pW(9.0), color: 'var(--slide-muted)', fontFamily: 'var(--font-body)', fontSize: '2.5cqi', textAlign: 'center' }}>
                            未対応タイプ: {slide.type}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="slide-visual-wrapper">
            <div className="slide-visual-number">SLIDE {index + 1}</div>
            {renderContent()}
            
            {/* スピーカーノート表示 */}
            {slide.speakerNotes && (
                <div className="slide-visual-notes">
                    <strong>ノート:</strong> {slide.speakerNotes}
                </div>
            )}
        </div>
    );
};

export default PptxVisualView;
