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
        console.log('🔍 [SystemLogs] Starting fetchLogsAndCleanup...');
        setLoading(true);
        setError('');
        try {
            console.log('🔍 [SystemLogs] Connecting to Firestore...');
            const logsRef = collection(db, 'audit_logs');

            // 1. Fetch Logs
            console.log('🔍 [SystemLogs] Executing query...');
            const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100)); // Get latest 100
            const snap = await getDocs(q);
            console.log('🔍 [SystemLogs] Query completed. Found', snap.docs.length, 'documents');

            const fetchedLogs = snap.docs.map(doc => {
                const data = doc.data();
                console.log('🔍 [SystemLogs] Processing doc:', doc.id, {
                    action: data.action,
                    userId: data.userId,
                    timestamp: data.timestamp?.toDate(),
                    details: data.details
                });
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.timestamp?.toDate() || new Date()
                };
            });

            // 本登録完了ログをフィルタリングして確認
            const accountVerifiedLogs = fetchedLogs.filter(log => log.action === 'ACCOUNT_VERIFIED');
            console.log('🔍 [SystemLogs] Found', accountVerifiedLogs.length, 'ACCOUNT_VERIFIED logs:', accountVerifiedLogs);


            // 2. Lazy cleanup (delete older than 30 days)
            lazyCleanup();
            
        } catch (err) {
            console.error('❌ [SystemLogs] Failed to fetch logs:', err);
            console.error('❌ [SystemLogs] Error details:', {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            setError('ログの読み込みに失敗しました。権限設定等をご確認ください。');
        } finally {
            console.log('🔍 [SystemLogs] fetchLogsAndCleanup completed');
            setLoading(false);
        }
    };

    const lazyCleanup = async () => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const oldTimestamp = Timestamp.fromDate(thirtyDaysAgo);

            const logsRef = collection(db, 'audit_logs');
            // Fetch old documents
            const cleanupQuery = query(logsRef, where('timestamp', '<', oldTimestamp), limit(100));
            const oldSnap = await getDocs(cleanupQuery);
            
            if (!oldSnap.empty) {
                setCleaning(true);
                const batch = writeBatch(db);
                oldSnap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
                console.log(`[Audit] Deleted ${oldSnap.size} logs older than 30 days.`);
                setCleaning(false);
            }
        } catch (e) {
            console.error('Lazy cleanup failed', e);
            setCleaning(false);
        }
    };

    const formatAction = (action) => {
        switch(action) {
            case 'LOGIN_SUCCESS': return 'ログイン成功';
            case 'LOGIN_FAILED': return 'ログイン失敗';
            case 'LOGOUT': return 'ログアウト';
            case 'PASSWORD_RESET_REQUEST': return 'パスワードリセット要求';
            case 'ACCOUNT_CREATED_PROVISIONAL': return '仮登録完了(セルフ)';
            case 'ACCOUNT_VERIFIED': return '本登録完了';
            case 'ACCOUNT_DELETED': return 'アカウント削除';
            case 'ADMIN_CREATED_USER': return 'アカウント発行完了(管理者)';
            default: return action;
        }
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
                                <th>日時</th>
                                <th>アクション</th>
                                <th>対象者</th>
                                <th>セッションID</th>
                                <th>詳細・備考</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="log-time">{formatDate(log.createdAt)}</td>
                                    <td><span className={`action-badge ${log.action || ''}`}>{formatAction(log.action)}</span></td>
                                    <td>{log.email || '-'}</td>
                                    <td className="session-id">{log.session_id ? log.session_id.substring(0, 12) + '...' : '-'}</td>
                                    <td className="log-details">
                                        {log.details && Object.keys(log.details).length > 0 
                                            ? JSON.stringify(log.details) 
                                            : '-'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="logs-footer">
                * システム負荷軽減のため、最新100件を表示しています。30日以上経過したログは自動的に順次削除されます。
            </div>
        </div>
    );
};

export default SystemLogsScreen;
