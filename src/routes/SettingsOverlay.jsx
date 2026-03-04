// src/routes/SettingsOverlay.jsx
// 設定画面をオーバーレイモーダルとして表示するルートコンポーネント
// 現在のチャット画面の上にポータルとして浮かぶ

import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();

    const handleClose = () => {
        // ★ backgroundLocation があればそこに戻る（チャット画面の位置を復元）
        const backgroundLocation = location.state?.backgroundLocation;
        if (backgroundLocation) {
            navigate(backgroundLocation.pathname, { replace: true });
        } else {
            navigate('/chat', { replace: true });
        }
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
