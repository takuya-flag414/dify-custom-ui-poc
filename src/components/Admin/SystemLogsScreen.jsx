import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp, writeBatch } from 'firebase/firestore';
import { Activity } from 'lucide-react';
import './SystemLogsScreen.css';

const SystemLogsScreen = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cleaning, setCleaning] = useState(false);

    useEffect(() => {
        fetchLogsAndCleanup();
    }, []);

    const fetchLogsAndCleanup = async () => {
        setLoading(true);
        setError('');
        try {
            const logsRef = collection(db, 'audit_logs');
            
            // 1. Fetch Logs
            const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100)); // Get latest 100
            const snap = await getDocs(q);
            const fetchedLogs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().timestamp?.toDate() || new Date()
            }));
            setLogs(fetchedLogs);

            // 2. Lazy cleanup (delete older than 30 days)
            lazyCleanup();
            
        } catch (err) {
            console.error('Failed to fetch logs:', err);
            setError('ログの読み込みに失敗しました。権限設定等をご確認ください。');
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
            case 'LOGOUT': return 'ログアウト';
            case 'PASSWORD_RESET_REQUEST': return 'パスワードリセット要求';
            case 'ACCOUNT_CREATED': return 'アカウント作成完了(セルフ)';
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
                                <th>詳細・備考</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="log-time">{formatDate(log.createdAt)}</td>
                                    <td><span className={`action-badge ${log.action || ''}`}>{formatAction(log.action)}</span></td>
                                    <td>{log.email || '-'}</td>
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
