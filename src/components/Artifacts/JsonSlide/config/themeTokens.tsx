import React from 'react';

// テーマの装飾（Decoration）コンポーネント
// Modern Indigo の背景装飾
export const ModernIndigoDecoration: React.FC = () => (
    <div className="theme-decoration modern-indigo-decoration" style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.05) 100%)'
    }} />
);

export const CorporateModernDecoration: React.FC = () => (
    <div className="theme-decoration corporate-modern-decoration" style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        borderTop: '8px solid var(--primary-color)'
    }} />
);

export const ConsultingClassicDecoration: React.FC = () => (
    <>
        <div className="theme-decoration consulting-classic-decoration" style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
            borderTop: '6px solid var(--primary-color)',
            overflow: 'hidden'
        }}>
            {/* プレミアム感のあるウォーターマーク（極薄い幾何学模様） */}
            <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.02, right: '-15%', bottom: '-30%' }}>
                <polygon points="800,800 800,0 100,800" fill="var(--primary-color)" />
                <polygon points="900,800 900,200 400,800" fill="var(--primary-color)" opacity="0.5" />
            </svg>
        </div>
        <style>{`
            /* コンサルスタイルのCSS上書き */
            .theme-consulting-classic {
                font-family: Arial, 'Helvetica Neue', Helvetica, 'Meiryo', sans-serif; /* マッキンゼー風のシャープで読みやすいサンセリフ体 */
                font-size: 13px;
                --slide-padding: 24px 32px; /* 余白を詰める */
                --primary-color: #00205B; /* 濃紺 */
                --text-main: #333333;
                --border-color: #cbd5e1;
            }
            /* エグゼクティブ・ボックス化されたKey Message (下線スタイルへ変更) */
            .theme-consulting-classic .slide-key-message {
                border-bottom: 2px solid var(--primary-color) !important;
                border-left: none !important;
                background-color: transparent !important;
                padding: 0 0 12px 0 !important;
                margin-bottom: 20px !important;
                font-weight: bold;
                font-size: 15px !important;
                box-shadow: none !important;
                text-align: left;
                line-height: 1.5 !important;
            }
            .theme-consulting-classic .grid-column {
                padding: 8px !important;
            }
            .theme-consulting-classic .grid-content {
                gap: 16px !important;
            }
            .theme-consulting-classic .left-zone,
            .theme-consulting-classic .right-zone,
            .theme-consulting-classic .stack-layout {
                gap: 8px !important;
            }
            /* カードとテーブルの質感向上 */
            .theme-consulting-classic .slide-card,
            .theme-consulting-classic .slide-content-card,
            .theme-consulting-classic .slide-table-wrapper {
                box-shadow: 0 4px 12px rgba(0, 32, 91, 0.05) !important;
                border-radius: 4px !important;
                border: 1px solid var(--border-color) !important;
            }
            .theme-consulting-classic .slide-card {
                padding: 10px 16px !important;
                border-left: 3px solid var(--primary-color) !important; /* 左アクセント線 */
            }
            .theme-consulting-classic .card-value {
                font-size: 24px !important;
                margin-top: 4px !important;
            }
            .theme-consulting-classic .slide-text {
                font-size: 13px !important;
                line-height: 1.4 !important;
                white-space: pre-wrap !important;
                text-align: left !important;
                margin-top: 0 !important;
            }
            /* リスト（箇条書き）のプロフェッショナル化 */
            .theme-consulting-classic ul {
                list-style: none !important;
                padding-left: 20px !important;
            }
            .theme-consulting-classic ul li {
                position: relative;
                margin-bottom: 6px;
            }
            .theme-consulting-classic ul li::before {
                content: "■";
                color: var(--primary-color);
                position: absolute;
                left: -16px;
                top: 0;
                font-size: 0.7em;
            }
            .theme-consulting-classic .slide-table td,
            .theme-consulting-classic .slide-table th {
                font-size: 11px !important;
                padding: 4px 6px !important;
                text-align: left !important;
            }
            /* ヘッダーにほんのりブルーを乗せる */
            .theme-consulting-classic .slide-table th {
                background-color: #f1f5f9 !important; /* 薄いグレーブルー */
                color: var(--primary-color) !important;
                border-bottom: 2px solid var(--primary-color) !important;
            }
            .theme-consulting-classic h2, 
            .theme-consulting-classic h3, 
            .theme-consulting-classic .card-title {
                font-size: 13px !important;
                font-weight: bold;
                text-align: left;
                margin-bottom: 2px !important;
            }
            .theme-consulting-classic .slide-mermaid {
                max-height: 100%;
                overflow: hidden;
            }
            .theme-consulting-classic .slide-mermaid .mermaid-viewer-container {
                height: 100% !important;
                min-height: 0 !important;
                align-items: center;
            }
            .theme-consulting-classic .slide-mermaid svg {
                max-height: 100% !important;
                width: auto !important;
            }
        `}</style>
    </>
);

export const TechStartupDecoration: React.FC = () => (
    <div className="theme-decoration tech-startup-decoration" style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(circle at 100% 0%, rgba(255, 0, 128, 0.1) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(0, 255, 255, 0.1) 0%, transparent 40%)'
    }} />
);

// 新しい動的レイアウト用のテーマトークン
export const themeTokens: Record<string, any> = {
    'modern-indigo': {
        id: 'modern-indigo',
        decoration: ModernIndigoDecoration,
        colors: {
            primary: '#6366f1',
            bg: '#ffffff',
            textMain: '#1e293b'
        }
    },
    'corporate-modern': {
        id: 'corporate-modern',
        decoration: CorporateModernDecoration,
        colors: {
            primary: '#1a365d',
            bg: '#ffffff',
            textMain: '#333333'
        }
    },
    'consulting-classic': {
        id: 'consulting-classic',
        decoration: ConsultingClassicDecoration,
        colors: {
            primary: '#00205B', // 濃紺
            bg: '#ffffff',
            textMain: '#000000',
            text: { body: '#333333' }
        }
    },
    'tech-startup': {
        id: 'tech-startup',
        decoration: TechStartupDecoration,
        colors: {
            primary: '#ff007f', // ネオンピンク
            bg: '#0f172a',      // ダークスレート
            textMain: '#ffffff',
            text: { body: '#f1f5f9' }
        }
    }
};

export const getThemeTokens = (themeId: string) => {
    return themeTokens[themeId] || themeTokens['corporate-modern'];
};
