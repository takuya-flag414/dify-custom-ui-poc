// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/ProfileSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ProfileSlide - コーポレート・プロフィールスライド
 * @param {Object} content - { name, role, bio, image_url, highlights, annotations }
 */
const ProfileSlide = ({ content, isStatic = false }) => {
    const { 
        name = '氏名', 
        role = '役職 / 専門分野', 
        bio = '経歴や略歴をここに入力してください。', 
        image_url, 
        highlights = [],
        annotations = []
    } = content || {};

    return (
        <div className="json-slide-layout profile-slide corporate-style">
            <div className="profile-corporate-container">
                
                {/* 左側：ビジュアル */}
                <motion.div 
                    className="profile-corporate-visual"
                    {...(!isStatic && {
                        initial: { opacity: 0, x: -30 },
                        animate: { opacity: 1, x: 0 },
                        transition: { duration: 0.6 }
                    })}
                >
                    <div className="profile-image-frame">
                        {image_url ? (
                            <img src={image_url} alt={name} className="profile-image-main" />
                        ) : (
                            <div className="profile-image-placeholder">
                                <span>No Image</span>
                            </div>
                        )}
                        <div className="profile-accent-bg" />
                    </div>
                </motion.div>

                {/* 右側：情報 */}
                <div className="profile-corporate-info">
                    {/* 名前と役職 */}
                    <motion.div 
                        className="profile-name-group"
                        {...(!isStatic && {
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.2, duration: 0.5 }
                        })}
                    >
                        <h2 className="profile-name">{name}</h2>
                        <p className="profile-role">{role}</p>
                    </motion.div>

                    {/* 略歴 */}
                    <motion.div 
                        className="profile-bio-text"
                        {...(!isStatic && {
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            transition: { delay: 0.4, duration: 0.5 }
                        })}
                    >
                        {bio}
                    </motion.div>

                    {/* 強調実績 */}
                    {highlights.length > 0 && (
                        <motion.div 
                            className="profile-highlights-area"
                            {...(!isStatic && {
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 0.5, duration: 0.5 }
                            })}
                        >
                            <h3 className="profile-highlights-title">Key Expertise & Achievements</h3>
                            <ul className="corporate-bullet-list">
                                {highlights.map((item, idx) => (
                                    <li key={idx} className="corporate-bullet-item">
                                        <div className="corporate-bullet-icon" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* 注釈エリア (最下部) */}
                    {annotations.length > 0 && (
                        <motion.div 
                            className="kpi-corporate-annotations"
                            style={{ marginTop: 'auto', paddingTop: '1cqi' }}
                            {...(!isStatic && {
                                initial: { opacity: 0 },
                                animate: { opacity: 1 },
                                transition: { delay: 0.7, duration: 0.5 }
                            })}
                        >
                            {annotations.map((note, idx) => (
                                <div key={idx}>{note}</div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSlide;
