// src/components/Chat/WelcomeScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './WelcomeScreen.css';
import { getTimeBasedGreeting } from '../../utils/timeUtils';
import SuggestionCard from './SuggestionCard';
import { SearchIcon, PenToolIcon, FileTextIcon, SparklesIcon } from '../Shared/SystemIcons';

/**
 * ようこそ画面コンポーネント
 * Framer Motionによるスタッガードアニメーション対応
 */

// アニメーション設定
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] }
    }
};

const WelcomeScreen = ({ userName, onSendMessage, onStartTutorial }) => {
    const { greeting, subMessage } = getTimeBasedGreeting(userName);

    const suggestions = [
        {
            id: 'search',
            icon: SearchIcon,
            title: '社内規定・マニュアル検索',
            description: '就業規則や経費精算の手順を検索します',
            prompt: '社内規定から交通費の精算ルールについて教えてください'
        },
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

    return (
        <motion.div
            className="welcome-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="welcome-inner">
                {/* 1. ダイナミックヘッダー */}
                <motion.header className="welcome-header" variants={itemVariants}>
                    <div className="welcome-logo-area">
                        <div className="welcome-logo-badge">AI Partner</div>
                    </div>
                    <h1 className="welcome-title">{greeting}</h1>
                    <p className="welcome-subtitle">{subMessage}</p>
                </motion.header>

                {/* 2. インテリジェント・グリッド */}
                <motion.main className="welcome-grid-section" variants={itemVariants}>
                    <p className="welcome-section-label">おすすめのアクション</p>
                    <div className="welcome-grid">
                        {suggestions.map((item, index) => (
                            <motion.div
                                key={item.id}
                                variants={itemVariants}
                            >
                                <SuggestionCard
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                    delay={0} // Framer Motionでスタッガーするので遅延不要
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.main>

                {/* 3. クイックアクセス */}
                <motion.footer className="welcome-footer-links" variants={itemVariants}>
                    <span>お困りですか？</span>
                    <button
                        className="link-button"
                        onClick={onStartTutorial}
                    >
                        使い方のヒントを見る
                    </button>
                </motion.footer>
            </div>
        </motion.div>
    );
};

export default WelcomeScreen;
