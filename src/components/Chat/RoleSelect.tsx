// src/components/Chat/RoleSelect.tsx
// ロール選択コンポーネント（RBAC対応・DevMode専用）
import React, { useState, useRef, useEffect } from 'react';
import type { RoleCode } from '../../mocks/mockUsers';

/**
 * SVGアイコンのProps型
 */
interface IconProps extends React.SVGProps<SVGSVGElement> {
    width?: string | number;
    height?: string | number;
}

/**
 * ユーザーアイコン（一般ユーザー）
 */
const UserIcon: React.FC<IconProps> = (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

/**
 * シールドアイコン（管理者）
 */
const ShieldIcon: React.FC<IconProps> = (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

/**
 * 目アイコン（閲覧専用）
 */
const EyeIcon: React.FC<IconProps> = (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const ChevronDownIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

/**
 * ロールオプションの型
 */
interface RoleOption {
    value: RoleCode;
    label: string;
    icon: React.FC<IconProps>;
    description: string;
}

/**
 * 正式仕様のロールオプション
 */
const ROLE_OPTIONS: RoleOption[] = [
    { value: 'admin', label: 'Admin', icon: ShieldIcon, description: '管理者' },
    { value: 'general', label: 'General', icon: UserIcon, description: '一般ユーザー' },
    { value: 'viewer', label: 'Viewer', icon: EyeIcon, description: '閲覧専用' },
];

/**
 * RoleSelect のProps型
 */
interface RoleSelectProps {
    currentRole: RoleCode;
    onRoleChange: (role: RoleCode) => void;
}

/**
 * ロール選択コンポーネント
 * DevModeでのみ表示され、デバッグ目的でロールを切り替え可能
 */
const RoleSelect: React.FC<RoleSelectProps> = ({ currentRole, onRoleChange }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = ROLE_OPTIONS.find(opt => opt.value === currentRole) || ROLE_OPTIONS[1];
    const CurrentIcon = currentOption.icon;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value: RoleCode): void => {
        onRoleChange(value);
        setIsOpen(false);
    };

    return (
        <div className="role-select-wrapper" ref={dropdownRef}>
            <button
                className={`role-trigger-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="ロール切り替え（開発用）"
            >
                <div className="role-trigger-icon">
                    <CurrentIcon width="14" height="14" />
                </div>
                <span>Role: {currentOption.label}</span>
                <div className="role-trigger-chevron">
                    <ChevronDownIcon />
                </div>
            </button>

            {isOpen && (
                <div className="role-dropdown-menu">
                    {ROLE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = currentRole === option.value;

                        return (
                            <button
                                key={option.value}
                                className={`role-dropdown-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <div className="item-icon">
                                    <Icon width="16" height="16" />
                                </div>
                                <div className="item-content">
                                    <span className="item-label">{option.label}</span>
                                    <span className="item-description">{option.description}</span>
                                </div>
                                {isSelected && (
                                    <div className="item-check">
                                        <CheckIcon />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RoleSelect;

// 型のエクスポート
export type { RoleCode };
