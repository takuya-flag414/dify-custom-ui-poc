// src/components/Artifacts/JsonSlide/slides/SectionSlide.jsx
// セクション区切りスライド: コーポレートカラーが支配するプロフェッショナルデザイン
import React from 'react';
import { motion } from 'framer-motion';

/**
 * SectionSlide - セクション区切り表示
 * @param {Object} content - { title, subtitle, section_number }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const SectionSlide = ({ content, isStatic = false }) => {
    const { title, subtitle, section_number } = content || {};

    const containerVariants = {
        initial: { opacity: 0 },
        animate: { 
            opacity: 1,
            transition: { duration: 0.6, when: "beforeChildren" }
        }
    };

    const contentVariants = {
        initial: { opacity: 0, y: 30 },
        animate: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] }
        }
    };

    const watermarkVariants = {
        initial: { opacity: 0, scale: 0.9 },
        animate: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 1.2, ease: "easeOut" }
        }
    };

    return (
        <motion.div 
            className="json-slide-layout json-slide-section corporate-style"
            {...(!isStatic && {
                variants: containerVariants,
                initial: "initial",
                animate: "animate"
            })}
        >
            {/* 背景の透かし文字 (セクション番号) */}
            <motion.div 
                className="section-watermark"
                {...(!isStatic && { variants: watermarkVariants })}
            >
                {section_number || ''}
            </motion.div>

            <motion.div
                className="section-corporate-content"
                {...(!isStatic && { variants: contentVariants })}
            >
                {/* アクセントライン */}
                <div className="section-corporate-line" />

                {/* ラベル */}
                <div className="section-corporate-label">
                    Section {section_number || ''}
                </div>

                {/* セクションタイトル */}
                <h2 className="section-corporate-title">
                    {title || 'Next Section'}
                </h2>

                {/* サブタイトル */}
                {subtitle && (
                    <p className="section-corporate-subtitle">{subtitle}</p>
                )}
            </motion.div>
        </motion.div>
    );
};

export default SectionSlide;
