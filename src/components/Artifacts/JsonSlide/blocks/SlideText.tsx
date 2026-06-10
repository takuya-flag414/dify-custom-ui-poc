import React from 'react';
import SlideMarkdown from '../MarkdownRenderer';

// JSモジュールであるSlideMarkdownをTypeScriptがstringと誤認識するのを防ぐキャスト
const Markdown: any = SlideMarkdown;

export type TextVariant = 'key_message' | 'title' | 'section_header' | 'card_title' | 'body_large' | 'body' | 'caption' | 'label';

interface Props {
    content: string;
    heading_level?: 1 | 2 | 3;
    isInsideContainer?: boolean;
    variant?: TextVariant;
}

export const SlideText: React.FC<Props> = ({ content, heading_level, isInsideContainer, variant }) => {
    // 階級（バリアント）の自動推論
    let resolvedVariant: TextVariant = variant || 'body';
    
    // variantが明示されていない場合のフォールバックロジック
    if (!variant) {
        if (isInsideContainer) {
            // カード等のコンテナ内では自動的に解説文（caption）サイズに下げる
            resolvedVariant = 'caption';
        } else if (heading_level === 1) {
            resolvedVariant = 'section_header';
        } else if (heading_level === 2) {
            resolvedVariant = 'card_title';
        } else if (heading_level === 3) {
            resolvedVariant = 'body_large';
        }
    }

    // クラス名の生成（例: 'text-variant-caption'）
    const variantClass = `text-variant-${resolvedVariant.replace(/_/g, '-')}`;

    // アクセシビリティ・セマンティクスのためにタグ自体はh1~h3を維持しつつ、見た目はvariantに完全に委ねる
    if (heading_level === 1) {
        return (
            <h1 className={`slide-block slide-text slide-heading-1 ${variantClass}`}>
                <Markdown content={content} inline />
            </h1>
        );
    }
    if (heading_level === 2) {
        return (
            <h2 className={`slide-block slide-text slide-heading-2 ${variantClass}`}>
                <Markdown content={content} inline />
            </h2>
        );
    }
    if (heading_level === 3) {
        return (
            <h3 className={`slide-block slide-text slide-heading-3 ${variantClass}`}>
                <Markdown content={content} inline />
            </h3>
        );
    }
    return (
        <p className={`slide-block slide-text ${variantClass}`}>
            <Markdown content={content} inline />
        </p>
    );
};

