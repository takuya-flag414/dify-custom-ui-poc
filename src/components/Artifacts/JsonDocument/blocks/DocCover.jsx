import React from 'react';

import { createCoverViewModel } from '../../../../utils/document/coverViewModel';

/**
 * DocCover
 * ドキュメントの表紙を表示するコンポーネントです。
 * 中央揃え・水平罫線の王道ビジネス報告書スタイルを再現します。
 */
const DocCover = ({ block }) => {
    const vm = createCoverViewModel(block?.meta);

    return (
        <div className="doc-cover">
            {/* 表紙本文領域 (中央揃えレイアウト) */}
            <div className="cover-inner">
                {/* 組織名 (右寄せ) */}
                {vm.org && (
                    <div className="cover-header">
                        <span className="cover-org">{vm.org}</span>
                    </div>
                )}

                {/* 中央：タイトルブロック */}
                <div className="cover-title-block">
                    {/* 上境界仕切り線 (グレー細線) */}
                    <div className="cover-title-top-border"></div>

                    {/* 年度 & 分類ラベル */}
                    {vm.badgeText && (
                        <div className="cover-meta-badge">
                            {vm.badgeText}
                        </div>
                    )}

                    {/* メインタイトル */}
                    <h1 className="cover-title">{vm.title}</h1>

                    {/* サブタイトル */}
                    {vm.subtitle && <p className="cover-subtitle">{vm.subtitle}</p>}

                    {/* 下境界仕切り線 (テーマカラー太線) */}
                    <div className="cover-title-bottom-border"></div>
                </div>

                {/* 下部：メタ情報テーブル（発行日・発行者） */}
                {vm.hasFooter && (
                    <div className="cover-footer-block">
                        <table className="cover-meta-table">
                            <tbody>
                                {vm.date && (
                                    <tr>
                                        <th>発行日：</th>
                                        <td>{vm.date}</td>
                                    </tr>
                                )}
                                {vm.author && (
                                    <tr>
                                        <th>発行者：</th>
                                        <td>{vm.author}</td>
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
