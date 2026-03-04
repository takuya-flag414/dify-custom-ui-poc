// src/routes/SettingsOverlay.jsx
// 設定画面をオーバーレイモーダルとして表示するルートコンポーネント
// 現在のチャット画面の上にポータルとして浮かぶ

import { useParams, useNavigate } from 'react-router-dom';
import SettingsArea from '../components/Settings/SettingsArea';

const SettingsOverlay = ({
    currentUser,
    settings,
    onUpdateSettings,
    mockMode,
    handleMockModeChange,
    onOpenApiConfig,
    handleResetOnboarding,
    logout,
}) => {
    const { section } = useParams();
    const navigate = useNavigate();

    const handleClose = () => {
        // 設定画面を閉じた時にチャットに戻る
        navigate('/chat', { replace: true });
    };

    return (
        <SettingsArea
            currentUser={currentUser}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            mockMode={mockMode}
            setMockMode={handleMockModeChange}
            onOpenApiConfig={onOpenApiConfig}
            onResetOnboarding={handleResetOnboarding}
            onLogout={() => {
                logout();
                handleClose();
            }}
            isModal={true}
            onClose={handleClose}
            initialSection={section}
        />
    );
};

export default SettingsOverlay;
