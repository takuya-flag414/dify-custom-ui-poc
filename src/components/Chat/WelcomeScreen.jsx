// src/components/Chat/WelcomeScreen.jsx
import React from 'react';
import './WelcomeScreen.css';
import { getTimeBasedGreeting } from '../../utils/timeUtils';
import SuggestionCard from './SuggestionCard';
import { SearchIcon, PenToolIcon, FileTextIcon, SparklesIcon } from '../Shared/SystemIcons';

/**
 * ようこそ画面コンポーネント
 * アクションカードは一時的に表示専用モード
 */
const WelcomeScreen = ({ userName, onSendMessage, onStartTutorial }) => { // onStartTutorialを受け取る
    const { greeting, subMessage } = getTimeBasedGreeting(userName);

    const suggestions = [
        {
            id: 'search',
            icon: SearchIcon,
            title: '社内規定・マニュアル検索',
            description: '就業規則や経費精算の手順を検索します',
            prompt: '社内規定から交通費の精算ルールについて教えてください'
        },
        // ... (他の定義はそのまま)
        {
            id: 'draft',
            icon: PenToolIcon,
            title: 'メール・文書作成',
            description: '状況に応じたビジネスメールの下書きを作成',
            prompt: '取引先へのお礼メールの文案を作成してください'
        },
        {
            id: 'summary',
            icon: FileTextIcon,
            title: '議事録・資料の要約',
            description: '長いテキストや資料のポイントを抽出',
            prompt: '以下のテキストを要約して、重要なポイントを箇条書きにしてください：\n'
        },
        {
            id: 'idea',
            icon: SparklesIcon,
            title: 'アイデア出し・壁打ち',
            description: '企画案のブラッシュアップや改善案の提案',
            prompt: '業務効率化のための新しいアイデアを3つ提案してください'
        },
    ];

    /* // 一時的に無効化
    const handleSuggestionClick = (prompt) => {
        onSendMessage(prompt, []);
    }; 
    */

    return (
        <div className="welcome-container">
            <div className="welcome-inner">
                {/* 1. ダイナミックヘッダー */}
                <header className="welcome-header">
                    <div className="welcome-logo-area">
                        <div className="welcome-logo-badge">AI Partner</div>
                    </div>
                    <h1 className="welcome-title">{greeting}</h1>
                    <p className="welcome-subtitle">{subMessage}</p>
                </header>

                {/* 2. インテリジェント・グリッド（表示専用） */}
                <main className="welcome-grid-section">
                    <p className="welcome-section-label">おすすめのアクション</p>
                    <div className="welcome-grid">
                        {suggestions.map((item, index) => (
                            <SuggestionCard
                                key={item.id}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                // onClickを渡さないことで、自動的に「表示専用（div）」になります
                                // onClick={() => handleSuggestionClick(item.prompt)} 
                                delay={index * 100}
                            />
                        ))}
                    </div>
                </main>

                {/* 3. クイックアクセス */}
                <footer className="welcome-footer-links">
                    <span>お困りですか？</span>
                    <button
                        className="link-button"
                        onClick={onStartTutorial} // ガイドツアーを起動
                    >
                        使い方のヒントを見る
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WelcomeScreen;