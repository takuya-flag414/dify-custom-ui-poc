import React from 'react';

/**
 * DocCover
 * ドキュメントの表紙を表示するコンポーネントです。
 * 中央揃え・水平罫線の王道ビジネス報告書スタイルを再現します。
 */
const DocCover = ({ block }) => {
    const { meta } = block || {};
    const { 
        title, 
        subtitle, 
        author, 
        date, 
        org = 'SEIHOKU INDUSTRIES', 
        label = 'MONTHLY REPORT', 
        year = '2026',
        
        // 将来のビジネスレター用追加項目 (分割代入で受けるが、JSXには含めない)
        recipient,
        senderDetails,
        refNo,
        salutation,
        complimentaryClose
    } = meta || {};

    return (
        <div className="doc-cover">
            {/* 表紙本文領域 (中央揃えレイアウト) */}
            <div className="cover-inner">
                {/* 組織名 (右寄せ) */}
                <div className="cover-header">
                    <span className="cover-org">{org}</span>
                </div>

                {/* 中央：タイトルブロック */}
                <div className="cover-title-block">
                    {/* 上境界仕切り線 (グレー細線) */}
                    <div className="cover-title-top-border"></div>

                    {/* 年度 & 分類ラベル */}
                    <div className="cover-meta-badge">
                        {year} / {label}
                    </div>

                    {/* メインタイトル */}
                    <h1 className="cover-title">{title || '無題のドキュメント'}</h1>

                    {/* サブタイトル */}
                    {subtitle && <p className="cover-subtitle">{subtitle}</p>}

                    {/* 下境界仕切り線 (テーマカラー太線) */}
                    <div className="cover-title-bottom-border"></div>
                </div>

                {/* 下部：メタ情報テーブル（発行日・発行者） */}
                {(date || author) && (
                    <div className="cover-footer-block">
                        <table className="cover-meta-table">
                            <tbody>
                                {date && (
                                    <tr>
                                        <th>発行日：</th>
                                        <td>{date}</td>
                                    </tr>
                                )}
                                {author && (
                                    <tr>
                                        <th>発行者：</th>
                                        <td>{author}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocCover;
