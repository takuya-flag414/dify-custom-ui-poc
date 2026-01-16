// src/components/Message/SmartActionGroup.tsx
import React from 'react';
import { motion, Transition, Variants } from 'framer-motion';
import {
    Database,
    Globe,
    FileText,
    MessageCircleQuestion,
    Search,
    Sparkles,
    ExternalLink,
    RefreshCw,
    LucideIcon
} from 'lucide-react';
import './SmartActionGroup.css';

/**
 * Smart Action の型
 */
export interface SmartAction {
    type: 'retry_mode' | 'suggested_question' | 'web_search' | 'deep_dive' | 'navigate' | string;
    label: string;
    icon?: string;
    payload?: unknown;
}

/**
 * SmartActionGroup のProps型
 */
interface SmartActionGroupProps {
    actions?: SmartAction[];
    onActionSelect?: (action: SmartAction) => void;
    disabled?: boolean;
}

// Spring Physics (DESIGN_RULE準拠)
const SPRING_CONFIG: Transition = {
    type: "spring",
    stiffness: 170,
    damping: 26,
    mass: 1
};

// ラベルのアニメーション
const labelVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { ...SPRING_CONFIG, delay: 0 }
    }
};

// コンテナのアニメーション (staggerChildren)
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.15
        }
    }
};

// 各アイテムのアニメーション
const itemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 10,
        scale: 0.9
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: SPRING_CONFIG
    }
};

// アイコン名からLucideコンポーネントへのマッピング
const ICON_MAP: Record<string, LucideIcon> = {
    'database': Database,
    'globe': Globe,
    'file-text': FileText,
    'message-circle-question': MessageCircleQuestion,
    'search': Search,
    'sparkles': Sparkles,
    'external-link': ExternalLink,
    'refresh-cw': RefreshCw
};

// デフォルトアイコン（typeに基づく）
const TYPE_DEFAULT_ICONS: Record<string, LucideIcon> = {
    'retry_mode': Database,
    'suggested_question': MessageCircleQuestion,
    'web_search': Globe,
    'deep_dive': Sparkles,
    'navigate': ExternalLink
};

/**
 * アイコン名または type から適切なアイコンコンポーネントを取得
 */
const getIconComponent = (iconName: string | undefined, type: string): LucideIcon => {
    if (iconName && ICON_MAP[iconName]) {
        return ICON_MAP[iconName];
    }
    return TYPE_DEFAULT_ICONS[type] || MessageCircleQuestion;
};

/**
 * Smart Actions コンポーネント
 */
const SmartActionGroup: React.FC<SmartActionGroupProps> = ({ actions, onActionSelect, disabled = false }) => {
    if (!actions || actions.length === 0) {
        return null;
    }

    const handleClick = (action: SmartAction): void => {
        if (disabled) return;
        onActionSelect?.(action);
    };

    return (
        <div className="smart-actions-container">
            <motion.div
                className="smart-actions-header"
                variants={labelVariants}
                initial="hidden"
                animate="visible"
            >
                <Sparkles size={14} className="smart-actions-header-icon" />
                <span className="smart-actions-header-label">AIからの提案</span>
            </motion.div>

            <motion.div
                className="smart-action-group"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {actions.map((action, index) => {
                    const IconComponent = getIconComponent(action.icon, action.type);

                    return (
                        <motion.button
                            key={`${action.type}-${index}`}
                            className={`smart-action-btn ${disabled ? 'disabled' : ''}`}
                            variants={itemVariants}
                            whileHover={!disabled ? { scale: 1.02 } : undefined}
                            whileTap={!disabled ? { scale: 0.95 } : undefined}
                            onClick={() => handleClick(action)}
                            disabled={disabled}
                            title={action.label}
                        >
                            <IconComponent size={14} className="smart-action-icon" />
                            <span className="smart-action-label">{action.label}</span>
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default SmartActionGroup;
