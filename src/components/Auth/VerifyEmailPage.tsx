import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * メール認証リンククリック後の処理ページ
 * oobCodeをURLから取得してメール認証コードの検証を実行
 */
const VerifyEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifyEmailCode } = useAuth();
    const [message, setMessage] = useState<string>('認証中...');
    const [isProcessing, setIsProcessing] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Firebase標準の検証コードパラメータ (oobCode) を取得
                const oobCode = searchParams.get('oobCode');
                if (!oobCode) {
                    setMessage('無効な認証リンクです');
                    setHasError(true);
                    setIsProcessing(false);
                    return;
                }

                // メール認証コードを実行
                await verifyEmailCode(oobCode);
                
                setMessage('メール認証が完了しました！ログイン画面へ移動します...');
                setIsProcessing(false);
                
                // メール認証のみでログイン自体は別途必要なので、ログイン画面へ遷移
                setTimeout(() => navigate('/'), 2000);
            } catch (error) {
                console.error('[VerifyEmailPage] Email verification failed:', error);
                const errorMessage = error instanceof Error ? error.message : '認証に失敗しました';
                setMessage(`エラー: ${errorMessage}`);
                setHasError(true);
                setIsProcessing(false);
            }
        };

        verifyEmail();
    }, [searchParams, verifyEmailCode, navigate]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px',
            }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>
                    メール認証
                </h2>
                
                {isProcessing ? (
                    <div>
                        <div style={{
                            display: 'inline-block',
                            width: '40px',
                            height: '40px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #0066cc',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '20px',
                        }}></div>
                        <style>
                            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                        </style>
                    </div>
                ) : null}
                
                <p style={{
                    color: isProcessing ? '#666' : '#333',
                    fontSize: '16px',
                    lineHeight: '1.5',
                }}>
                    {message}
                </p>
                
                {!isProcessing && !hasError && (
                    <p style={{
                        color: '#999',
                        fontSize: '14px',
                        marginTop: '20px',
                    }}>
                        数秒後に自動的にログイン画面にジャンプします...
                    </p>
                )}
                {!isProcessing && hasError && (
                    <p style={{
                        color: '#999',
                        fontSize: '14px',
                        marginTop: '20px',
                    }}>
                        エラーが発生しました。ログイン画面に戻るか、再度リンクを確認してください。
                    </p>
                )}
                {!isProcessing && hasError && (
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            marginTop: '16px',
                            padding: '10px 16px',
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ログイン画面へ戻る
                    </button>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
