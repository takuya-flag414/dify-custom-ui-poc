// src/components/Auth/VerifyEmailPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import './Auth.css';

const VerifyEmailPage = () => {
    const { verifyEmailCode } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // URLからoobCodeを取得
                const urlParams = new URLSearchParams(window.location.search);
                const oobCode = urlParams.get('oobCode');

                if (!oobCode) {
                    setStatus('error');
                    setMessage('認証コードが見つかりません。URLが正しいか確認してください。');
                    return;
                }

                // メール認証を実行
                await verifyEmailCode(oobCode);

                setStatus('success');
                setMessage('メール認証が完了しました！ログイン画面に移動します...');

                // 3秒後にログイン画面にリダイレクト
                setTimeout(() => {
                    navigate('/login');
                }, 3000);

            } catch (error) {
                console.error('Email verification failed:', error);
                setStatus('error');
                setMessage(error.message || 'メール認証に失敗しました。');
            }
        };

        verifyEmail();
    }, [verifyEmailCode, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>メール認証</h1>
                    <p>メールアドレスの確認を行っています...</p>
                </div>

                <div className="auth-body">
                    <div className="verification-status">
                        {status === 'loading' && (
                            <div className="status-loading">
                                <Loader className="animate-spin" size={48} />
                                <p>認証処理中...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="status-success">
                                <CheckCircle size={48} color="#10b981" />
                                <p>{message}</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="status-error">
                                <XCircle size={48} color="#ef4444" />
                                <p>{message}</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/login')}
                                >
                                    ログイン画面に戻る
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;