// src/components/Artifacts/JsonSlide/slides/ProfileSlide.jsx
// 会社概要・プロジェクト概要スライド: ラベル＋値ペアの定義リスト型レイアウト
// レイアウト崩壊防止: 最大8件, Grid定義リスト, 値のline-clamp, overflow制御
import React from 'react';

// レイアウト崩壊防止のハード制限
const MAX_ENTRIES = 8;

/**
 * ProfileSlide - 会社概要・プロジェクト概要表示
 * @param {Object} content - { title, subtitle, entries: [{ label, value }], footer_text? }
 * @param {boolean} isStatic - アニメーション無効化
 */
const ProfileSlide = ({ content, isStatic = false }) => {
    const { title, subtitle, entries: rawEntries, footer_text } = content || {};

    // 安全なデータ取得 + 制限
    const entries = Array.isArray(rawEntries) ? rawEntries.slice(0, MAX_ENTRIES) : [];

    if (entries.length === 0) {
        return (
            <div className="json-slide-layout json-slide-content">
                <div className="content-slide-header">
                    <h2 className="slide-section-title">{title || '概要'}</h2>
                    <div className="slide-title-underline" />
                </div>
                <div className="content-slide-body">
                    <p className="slide-body-text">概要データがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-profile">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || '概要'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* サブタイトル（組織名やプロジェクト名など） */}
            {subtitle && (
                <p className="profile-subtitle">{subtitle}</p>
            )}

            {/* 定義リスト本体 */}
            <div className="profile-slide-body">
                {entries.map((entry, idx) => (
                    <div key={idx} className="profile-entry">
                        <span className="profile-entry-label">{entry?.label ?? ''}</span>
                        <span className="profile-entry-value">{entry?.value ?? '—'}</span>
                    </div>
                ))}
            </div>

            {/* フッターテキスト（スローガンなど） */}
            {footer_text && (
                <p className="profile-footer">{footer_text}</p>
            )}
        </div>
    );
};

export default ProfileSlide;
