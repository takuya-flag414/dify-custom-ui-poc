// src/context/AuthContext.jsx
// 認証状態をアプリ全体で共有するContext Provider
// Phase A: Mock Emulation

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/AuthService';

/**
 * AuthContext の型定義（参考用コメント）
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user - 現在のログインユーザー
 * @property {boolean} isAuthenticated - ログイン済みかどうか
 * @property {boolean} isLoading - セッション復元中かどうか
 * @property {string|null} error - 認証エラーメッセージ
 * @property {Function} login - ログイン関数
 * @property {Function} signup - サインアップ関数
 * @property {Function} logout - ログアウト関数
 * @property {Function} clearError - エラークリア関数
 */

const AuthContext = createContext(null);

/**
 * 認証状態を提供するProvider
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isNewUser, setIsNewUser] = useState(false); // ★追加: サインアップ時のみtrue

    // アプリ起動時にセッション復元を試みる
    useEffect(() => {
        const restoreSession = async () => {
            try {
                setIsLoading(true);
                const restoredUser = await authService.restoreSession();
                if (restoredUser) {
                    setUser(restoredUser);
                    console.log('[AuthContext] Session restored:', restoredUser.email);
                } else {
                    console.log('[AuthContext] No active session');
                }
            } catch (err) {
                console.error('[AuthContext] Session restore failed:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    /**
     * ログイン
     * @param {string} email
     * @param {string} password
     */
    const login = useCallback(async (email, password) => {
        try {
            setError(null);
            // setIsLoading(true); // ★修正: ローカルローディングに移行
            setIsNewUser(false);
            const result = await authService.login(email, password);
            setUser(result.user);
            console.log('[AuthContext] Login successful:', result.user.email);
            return result;
        } catch (err) {
            console.error('[AuthContext] Login failed:', err);
            setError(err.message);
            throw err;
        }
    }, []);

    /**
     * サインアップ（新規登録）
     * @param {string} email
     * @param {string} password
     * @param {string} displayName
     * @param {object} securityInfo - セキュリティ情報（姓・名・生年月日・秘密の質問）
     */
    const signup = useCallback(async (email, password, displayName, securityInfo = {}) => {
        try {
            setError(null);
            // setIsLoading(true); // ★修正: ローカルローディングに移行
            const result = await authService.signup(email, password, displayName, securityInfo);
            setUser(result.user);
            setIsNewUser(true); // ★サインアップ時はオンボーディング表示
            console.log('[AuthContext] Signup successful:', result.user.email);
            return result;
        } catch (err) {
            console.error('[AuthContext] Signup failed:', err);
            setError(err.message);
            throw err;
        }
    }, []);

    /**
     * ログアウト
     */
    const logout = useCallback(async () => {
        try {
            setError(null);
            await authService.logout();
            setUser(null);
            console.log('[AuthContext] Logout successful');
        } catch (err) {
            console.error('[AuthContext] Logout failed:', err);
            setError(err.message);
            throw err;
        }
    }, []);

    /**
     * エラーをクリア
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // コンテキスト値をメモ化
    const contextValue = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        isNewUser, // ★追加: サインアップ直後かどうか
        login,
        signup,
        logout,
        clearError,
    }), [user, isLoading, error, isNewUser, login, signup, logout, clearError]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * 認証状態を取得するカスタムフック
 * @returns {AuthContextValue}
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
