// src/context/AuthContext.tsx
// 認証状態をアプリ全体で共有するContext Provider
// Phase A: Mock Emulation - RBAC対応

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { authService, UserProfile, LoginResult, PermissionCode, ResolvedUserRole, RoleCode } from '../services/AuthService';
import { IS_DEV_MODE } from '../config/devMode';

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
 * AuthContextの値の型定義（RBAC対応）
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
    /** 開発者モードが有効かどうか */
    isDevMode: boolean;
    /** ログイン関数 */
    login: (email: string, password: string) => Promise<LoginResult>;
    /** サインアップ関数 */
    signup: (email: string, password: string, displayName: string, securityInfo?: SecurityInfo) => Promise<LoginResult>;
    /** ログアウト関数 */
    logout: () => Promise<void>;
    /** エラークリア関数 */
    clearError: () => void;
    /** 権限チェック関数（RBAC） */
    hasPermission: (permCode: PermissionCode) => boolean;
    /** ユーザーのロール一覧を取得 */
    getUserRoles: () => ResolvedUserRole[];
    /** 【DevMode専用】ロール切り替え */
    switchRole: (roleCode: RoleCode) => Promise<void>;
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

    /**
     * 権限チェック（RBAC）
     * ユーザーが指定された権限を持っているかを判定
     */
    const hasPermission = useCallback((permCode: PermissionCode): boolean => {
        if (!user) return false;
        return user.permissions.includes(permCode);
    }, [user]);

    /**
     * ユーザーのロール一覧を取得
     */
    const getUserRoles = useCallback((): ResolvedUserRole[] => {
        if (!user) return [];
        return user.roles;
    }, [user]);

    /**
     * 【DevMode専用】ロール切り替え
     */
    const switchRole = useCallback(async (roleCode: RoleCode): Promise<void> => {
        if (!IS_DEV_MODE) return;
        if (!user) return;

        try {
            const updatedUser = await authService.switchRoleDebug(user, roleCode);
            setUser(updatedUser);
            console.log('[AuthContext] Role switched to:', roleCode);
        } catch (err) {
            console.error('[AuthContext] Role switch failed:', err);
        }
    }, [user]);

    // コンテキスト値をメモ化
    const contextValue = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        isNewUser,
        isDevMode: IS_DEV_MODE,
        login,
        signup,
        logout,
        clearError,
        hasPermission,
        getUserRoles,
        switchRole,
    }), [user, isLoading, error, isNewUser, login, signup, logout, clearError, hasPermission, getUserRoles, switchRole]);

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

// 型のre-export
export type { PermissionCode, ResolvedUserRole };
