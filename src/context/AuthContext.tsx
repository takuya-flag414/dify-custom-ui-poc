// src/context/AuthContext.tsx
// 認証状態をアプリ全体で共有するContext Provider
// Phase A: Mock Emulation

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { authService, UserProfile, LoginResult } from '../services/AuthService';

/**
 * AuthContextの値の型定義
 */
export interface AuthContextValue {
    /** 現在のログインユーザー */
    user: UserProfile | null;
    /** ログイン済みかどうか */
    isAuthenticated: boolean;
    /** セッション復元中かどうか */
    isLoading: boolean;
    /** 認証エラーメッセージ */
    error: string | null;
    /** サインアップ直後かどうか */
    isNewUser: boolean;
    /** ログイン関数 */
    login: (email: string, password: string) => Promise<LoginResult>;
    /** サインアップ関数 */
    signup: (email: string, password: string, displayName: string, securityInfo?: SecurityInfo) => Promise<LoginResult>;
    /** ログアウト関数 */
    logout: () => Promise<void>;
    /** エラークリア関数 */
    clearError: () => void;
}

/**
 * セキュリティ情報の型
 */
export interface SecurityInfo {
    lastName?: string;
    firstName?: string;
    birthDate?: string;
    securityQuestion?: string;
    securityAnswer?: string;
}

/**
 * AuthProviderのProps型
 */
interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 認証状態を提供するProvider
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isNewUser, setIsNewUser] = useState<boolean>(false);

    // アプリ起動時にセッション復元を試みる
    useEffect(() => {
        const restoreSession = async (): Promise<void> => {
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
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    /**
     * ログイン
     */
    const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
        try {
            setError(null);
            setIsNewUser(false);
            const result = await authService.login(email, password);
            setUser(result.user);
            console.log('[AuthContext] Login successful:', result.user.email);
            return result;
        } catch (err) {
            console.error('[AuthContext] Login failed:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            throw err;
        }
    }, []);

    /**
     * サインアップ（新規登録）
     */
    const signup = useCallback(async (
        email: string,
        password: string,
        displayName: string,
        securityInfo: SecurityInfo = {}
    ): Promise<LoginResult> => {
        try {
            setError(null);
            const result = await authService.signup(email, password, displayName, securityInfo);
            setUser(result.user);
            setIsNewUser(true);
            console.log('[AuthContext] Signup successful:', result.user.email);
            return result;
        } catch (err) {
            console.error('[AuthContext] Signup failed:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            throw err;
        }
    }, []);

    /**
     * ログアウト
     */
    const logout = useCallback(async (): Promise<void> => {
        try {
            setError(null);
            await authService.logout();
            setUser(null);
            console.log('[AuthContext] Logout successful');
        } catch (err) {
            console.error('[AuthContext] Logout failed:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            throw err;
        }
    }, []);

    /**
     * エラーをクリア
     */
    const clearError = useCallback((): void => {
        setError(null);
    }, []);

    // コンテキスト値をメモ化
    const contextValue = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        isNewUser,
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
 */
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
