import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp, writeBatch } from 'firebase/firestore';
import { Activity } from 'lucide-react';
import './SystemLogsScreen.css';

// Firebase接続テスト
const testFirebaseConnection = async () => {
    try {
        console.log('Testing Firebase connection...');
        const testRef = collection(db, 'audit_logs');
        const testQuery = query(testRef, limit(1));
        await getDocs(testQuery);
        console.log('Firebase connection successful');
        return true;
    } catch (error) {
        console.error('Firebase connection failed:', error);
        return false;
    }
};

// ブラウザコンソールから直接ログを確認できる関数をグローバルに公開
if (typeof window !== 'undefined') {
    window.checkAccountVerifiedLogs = async () => {
        try {
            console.log('🔍 [Direct Check] Checking ACCOUNT_VERIFIED logs...');
            const logsRef = collection(db, 'audit_logs');
            const q = query(
                logsRef,
                where('action', '==', 'ACCOUNT_VERIFIED'),
                orderBy('timestamp', 'desc'),
                limit(10)
            );
            const snap = await getDocs(q);
            const logs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            console.log('✅ [Direct Check] Found ACCOUNT_VERIFIED logs:', logs);
            return logs;
        } catch (error) {
            console.error('❌ [Direct Check] Error:', error);
            return [];
        }
    };

    window.checkAllAuditLogs = async () => {
        try {
            console.log('🔍 [Direct Check] Checking all audit logs...');
            const logsRef = collection(db, 'audit_logs');
            const q = query(logsRef, orderBy('timestamp', 'desc'), limit(20));
            const snap = await getDocs(q);
            const logs = snap.docs.map(doc => ({
                id: doc.id,
                action: doc.data().action,
                userId: doc.data().userId,
                timestamp: doc.data().timestamp?.toDate(),
                details: doc.data().details
            }));
            console.table(logs);
            return logs;
        } catch (error) {
            console.error('❌ [Direct Check] Error:', error);
            return [];
        }
    };

    console.log('🔧 [SystemLogs] Direct check functions available:');
    console.log('   - window.checkAccountVerifiedLogs() - Check ACCOUNT_VERIFIED logs');
    console.log('   - window.checkAllAuditLogs() - Check all audit logs');
}

const SystemLogsScreen = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cleaning, setCleaning] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState(null); // 展開中の行ID

    useEffect(() => {
        console.log('SystemLogsScreen useEffect triggered');
        testFirebaseConnection().then(success => {
            if (success) {
                fetchLogsAndCleanup();
            } else {
                setError('Firebase接続に失敗しました。ネットワーク接続をご確認ください。');
                setLoading(false);
            }
        });
    }, []);

    const fetchLogsAndCleanup = async () => {
        setLoading(true);
        setError('');
        try {
            const logsRef = collection(db, 'audit_logs');
            const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
            const snap = await getDocs(q);

            const fetchedLogs = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.timestamp?.toDate() || new Date()
                };
            });

            setLogs(fetchedLogs);
            lazyCleanup();
        } catch (err) {
            console.error('❌ [SystemLogs] Failed to fetch logs:', err);
            setError('ログの読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const lazyCleanup = async () => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const oldTimestamp = Timestamp.fromDate(thirtyDaysAgo);

            const logsRef = collection(db, 'audit_logs');
            const cleanupQuery = query(logsRef, where('timestamp', '<', oldTimestamp), limit(100));
            const oldSnap = await getDocs(cleanupQuery);

            if (!oldSnap.empty) {
                setCleaning(true);
                const batch = writeBatch(db);
                oldSnap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
                setCleaning(false);
            }
        } catch (e) {
            console.error('Lazy cleanup failed', e);
            setCleaning(false);
        }
    };

    const toggleRow = (id) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    const formatAction = (action) => {
        switch (action) {
            case 'LOGIN_SUCCESS': return 'ログイン成功';
            case 'LOGIN_FAILED': return 'ログイン失敗';
            case 'LOGOUT': return 'ログアウト';
            case 'PASSWORD_RESET_REQUEST':
            case 'PASSWORD_RESET_REQUESTED': return 'パスワードリセット要求';
            case 'PASSWORD_RESET_FAILED': return 'パスワードリセット失敗';
            case 'PASSWORD_CHANGED_INITIAL': return '初期パスワード変更';
            case 'PASSWORD_CHANGE_FAILED': return 'パスワード変更失敗';
            case 'ACCOUNT_CREATED_PROVISIONAL': return '仮登録完了(セルフ)';
            case 'ACCOUNT_VERIFIED': return '本登録完了';
            case 'ACCOUNT_DELETED': return 'アカウント削除';
            case 'ADMIN_CREATED_USER': return 'アカウント発行完了(管理者)';
            case 'EMAIL_SENT_SUCCESS':
            case 'EMAIL_DELIVERED_SUCCESS': return 'メール送信成功';
            case 'EMAIL_SENT_FAILED':
            case 'EMAIL_DELIVERED_FAILED': return 'メール送信失敗';
            case 'ACCOUNT_CREATE_FAILED': return 'アカウント作成失敗';
            case 'EMAIL_VERIFIED_SUCCESS': return 'メール認証完了';
            case 'ACCOUNT_VERIFIED_SIGNIN': return '認証済ログイン';
            case 'ACCOUNT_SIGNIN_UNVERIFIED': return '未認証ログイン';
            default: return action;
        }
    };

    const formatEmail = (email) => {
        if (!email) return '-';
        if (!email.includes('@') && email.length > 30) {
            return '退職者 (削除済みユーザー)';
        }
        return email;
    };

    const formatDate = (date) => {
        if (!date) return '-';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}/${m}/${d} ${h}:${min}`;
    };

    return (
        <div className="system-logs-container">
            <div className="logs-header">
                <h2><Activity size={20} /> システムログ (監査証跡)</h2>
                {cleaning && <span className="cleaning-badge">古いログをバックグラウンドで整理中...</span>}
            </div>

            {error && <div className="admin-error-box">{error}</div>}

            <div className="logs-table-wrapper">
                {loading ? (
                    <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>読み込み中...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>記録されたログはありません。</div>
                ) : (
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th style={{ width: '140px' }}>日時</th>
                                <th style={{ width: '180px' }}>アクション</th>
                                <th style={{ width: '220px' }}>対象者</th>
                                <th>詳細・備考</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <React.Fragment key={log.id}>
                                    <tr
                                        className={`log-row ${expandedLogId === log.id ? 'expanded' : ''}`}
                                        onClick={() => toggleRow(log.id)}
                                    >
                                        <td className="expand-icon">
                                            {expandedLogId === log.id ? '▼' : '▶'}
                                        </td>
                                        <td className="log-time">{formatDate(log.createdAt)}</td>
                                        <td><span className={`action-badge ${log.action || ''}`}>{formatAction(log.action)}</span></td>
                                        <td>{formatEmail(log.email)}</td>
                                        <td className="log-summary">
                                            {log.details && Object.keys(log.details).length > 0
                                                ? JSON.stringify(log.details)
                                                : '-'
                                            }
                                        </td>
                                    </tr>
                                    {expandedLogId === log.id && (
                                        <tr className="detail-row">
                                            <td colSpan={5}>
                                                <div className="detail-expanded-content">
                                                    <div className="detail-grid">
                                                        {/* 基本情報 */}
                                                        <div className="detail-item">
                                                            <label>システムUID</label>
                                                            <code>{log.user_id || 'N/A'}</code>
                                                        </div>
                                                        <div className="detail-item">
                                                            <label>セッションID</label>
                                                            <code>{log.session_id || 'N/A'}</code>
                                                        </div>
                                                        <div className="detail-item">
                                                            <label>アプリ/アクセス元 (Project ID)</label>
                                                            <code>{log.project_id || 'N/A'}</code>
                                                        </div>

                                                        {/* Detailsの中身をパースして主要なものを表示 */}
                                                        {log.details && Object.entries(log.details).map(([key, value]) => {
                                                            // すでに表示したものはスキップ
                                                            if (['user_id', 'session_id'].includes(key)) return null;

                                                            // 表示ラベルの変換
                                                            let label = key;
                                                            let className = "";
                                                            if (key === 'error_code') { label = 'エラーコード'; className = "text-error"; }
                                                            else if (key === 'error_message') { label = 'エラー詳細'; className = "text-error"; }
                                                            else if (key === 'reason') { label = '失敗理由'; className = "text-error"; }
                                                            else if (key === 'type') label = '操作タイプ';
                                                            else if (key === 'role' || key === 'roleId' || key === 'roles') label = '割り当てロール';
                                                            else if (key === 'status') label = 'ステータス';
                                                            else if (key === 'displayName') label = '表示名';
                                                            else if (key === 'userAgent') label = 'アクセス環境 (UA)';
                                                            else if (key === 'method') label = 'ログイン方法';
                                                            else if (key === 'language') label = 'ブラウザ言語';
                                                            else if (key === 'deletedAt') label = '削除日時';
                                                            else if (key === 'oobCode') label = '認証コード(一部)';
                                                            else if (key === 'departmentId') label = '部署ID';
                                                            else if (key === 'appSource') label = 'アクセス元アプリ';
                                                            else if (key === 'hostname') label = 'アクセス元ドメイン';

                                                            // 値が長すぎる場合や未復号データの処理
                                                            let displayValue = value;
                                                            if (key === 'displayName' && typeof value === 'string' && value.length > 30) {
                                                                displayValue = '退職者 (削除済みユーザー)';
                                                            } else {
                                                                displayValue = (typeof value === 'string' && value.length > 100)
                                                                    ? value.substring(0, 100) + '...'
                                                                    : String(value);
                                                            }

                                                            return (
                                                                <div className={`detail-item ${key === 'userAgent' ? 'full-width' : ''}`} key={key}>
                                                                    <label>{label}</label>
                                                                    <span className={className}>{displayValue}</span>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* 全データ (JSON) */}
                                                        <div className="detail-item full-width">
                                                            <label>生データ (JSON形式)</label>
                                                            <pre className="json-pre">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="logs-footer">
                * リストの行をクリックすると、その場ですぐに詳細データを確認できます。
            </div>
        </div>
    );
};

export default SystemLogsScreen;
