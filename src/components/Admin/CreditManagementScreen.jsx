import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Check, Search, Zap, Star, Award } from 'lucide-react';
import { creditApi } from '../../api/creditApi';
import { authService } from '../../services/AuthService';
import { auth } from '../../lib/firebase';
import './CreditManagementScreen.css';

const CreditManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bonusAmount, setBonusAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Global Settings State
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [globalLimits, setGlobalLimits] = useState({ 1: 1000, 2: 5000, 3: 10000 });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await creditApi.adminGetUserCreditsList();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setError('ユーザーリストの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const getAdminInfo = () => {
    try {
      if (auth && auth.currentUser) {
        return { 
          uid: auth.currentUser.uid, 
          email: auth.currentUser.email || 'unknown@example.com' 
        };
      }
      const sessionStr = localStorage.getItem('mock_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        return { uid: session.uid, email: session.email };
      }
    } catch (e) {}
    // Fallback if auth is not available
    return { uid: 'unknown_admin', email: 'admin@example.com' };
  };

  const handleTierChange = async (userId, newTier) => {
    try {
      const adminInfo = getAdminInfo();
      const targetUser = users.find(u => u.user_id === userId);
      const oldTier = targetUser?.tier || 1;

      // Optimistic Update
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, tier: newTier } : u));
      
      await creditApi.updateUserTier(adminInfo.uid, userId, parseInt(newTier, 10));

      // Audit Log
      await authService.logAuditAction('TIER_CHANGED', targetUser?.email || 'unknown', userId, {
        adminId: adminInfo.uid,
        adminEmail: adminInfo.email,
        oldTier: oldTier,
        newTier: parseInt(newTier, 10)
      });

      // Reload to get updated balance if needed, or rely on optimistic update
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Tierの更新に失敗しました');
    }
  };

  const openBonusModal = (user) => {
    setSelectedUser(user);
    setBonusAmount('');
    setIsBonusModalOpen(true);
  };

  const handleAdjustBonus = async () => {
    if (!selectedUser || !bonusAmount || isNaN(bonusAmount)) return;
    
    try {
      setIsSubmitting(true);
      const adminInfo = getAdminInfo();
      const amount = parseInt(bonusAmount, 10);

      await creditApi.grantBonusCredit(adminInfo.uid, selectedUser.user_id, amount);
      
      // Audit Log
      await authService.logAuditAction('CREDIT_BONUS_ADJUSTED', selectedUser.email, selectedUser.user_id, {
        adminId: adminInfo.uid,
        adminEmail: adminInfo.email,
        amount: amount,
        oldBalance: selectedUser.credit_balance,
        newBalance: selectedUser.credit_balance + amount
      });

      // Close and refresh
      setIsBonusModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('ボーナス調整に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGlobalSettings = async () => {
    try {
      setIsSavingSettings(true);
      const adminInfo = getAdminInfo();
      
      const tiersConfig = {
        "1": { limit: globalLimits[1] },
        "2": { limit: globalLimits[2] },
        "3": { limit: globalLimits[3] }
      };

      await creditApi.updateSystemSettings(adminInfo.uid, tiersConfig);
      alert('全体設定を保存しました。次回のクレジットリセット時から適用されます。');
      setIsGlobalSettingsOpen(false);
    } catch (err) {
      console.error(err);
      alert('全体設定の保存に失敗しました');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '未リセット';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>ユーザーデータを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="credit-management-container">
      <div className="credit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="credit-header-left">
          <h2>
            <CreditCard size={24} style={{ marginRight: '8px' }} />
            クレジット管理
          </h2>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="名前やメールアドレスで検索..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 10px 10px 36px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button 
          onClick={() => setIsGlobalSettingsOpen(true)}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.9rem'
          }}
        >
          全体設定 (Tier枠)
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

      <div className="credit-table-container">
        <table className="credit-table">
          <thead>
            <tr>
              <th>ユーザー</th>
              <th>現在のTier</th>
              <th>クレジット残高</th>
              <th>前回リセット日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.user_id}>
                <td>
                  <div className="user-cell">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </td>
                <td>
                  <select 
                    className="tier-select" 
                    value={user.tier} 
                    onChange={(e) => handleTierChange(user.user_id, e.target.value)}
                  >
                    <option value="1">Tier 1 (ライト枠)</option>
                    <option value="2">Tier 2 (スタンダード枠)</option>
                    <option value="3">Tier 3 (プロ枠)</option>
                  </select>
                </td>
                <td>
                  <span className="balance-text">{user.credit_balance.toLocaleString()} CR</span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(user.last_reset_time)}
                  </span>
                </td>
                <td>
                  <button className="action-btn" onClick={() => openBonusModal(user)}>
                    <Plus size={16} /> ボーナス調整
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                  ユーザーが見つかりません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isGlobalSettingsOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>全体設定 (Tier基本枠)</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                各Tierの毎週リセット時の上限クレジット数を一括で設定します。
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.2)', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0.01) 100%)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                        <Zap size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>Tier 1</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ライト枠</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      className="modal-input" 
                      value={globalLimits[1]}
                      onChange={(e) => setGlobalLimits({...globalLimits, 1: parseInt(e.target.value) || 0})}
                      step="1000"
                      style={{ paddingRight: '40px', background: 'var(--bg-primary)', border: '1px solid rgba(14, 165, 233, 0.3)' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-tertiary)', pointerEvents: 'none', fontWeight: 500 }}>CR</span>
                  </div>
                </div>
                
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.01) 100%)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                        <Star size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>Tier 2</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>スタンダード枠</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      className="modal-input" 
                      value={globalLimits[2]}
                      onChange={(e) => setGlobalLimits({...globalLimits, 2: parseInt(e.target.value) || 0})}
                      step="1000"
                      style={{ paddingRight: '40px', background: 'var(--bg-primary)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-tertiary)', pointerEvents: 'none', fontWeight: 500 }}>CR</span>
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                        <Award size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>Tier 3</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>プロ枠</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      className="modal-input" 
                      value={globalLimits[3]}
                      onChange={(e) => setGlobalLimits({...globalLimits, 3: parseInt(e.target.value) || 0})}
                      step="1000"
                      style={{ paddingRight: '40px', background: 'var(--bg-primary)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-tertiary)', pointerEvents: 'none', fontWeight: 500 }}>CR</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setIsGlobalSettingsOpen(false)}>キャンセル</button>
              <button className="confirm-btn" onClick={handleSaveGlobalSettings} disabled={isSavingSettings}>
                {isSavingSettings ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBonusModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Plus size={20} style={{ color: 'var(--accent-primary)' }} />
                ボーナスの調整（付与 / 没収）
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                <strong>{selectedUser?.name}</strong> さんのクレジット残高を調整します。<br/>
                付与する場合はプラスの値を、没収する場合はマイナスの値を入力してください。
              </p>
              <input 
                type="number" 
                className="modal-input" 
                placeholder="例: 1000 または -1000" 
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                step="1000"
                autoFocus
              />
              
              <details style={{ marginTop: '12px' }}>
                <summary style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--accent-primary)', 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  display: 'inline-block',
                  userSelect: 'none'
                }}>
                  💡 調整額の目安を表示
                </summary>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  background: 'rgba(99, 102, 241, 0.05)', 
                  border: '1px solid rgba(99, 102, 241, 0.1)', 
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <strong>1,000クレジット</strong> は、日本語で約 <strong>1,000文字分</strong> のやり取り（標準的な質問・回答で約1〜2回分）に相当します。<br/>
                  ※マイナスを入力して計算結果が0を下回った場合、残高は0で止まります。
                </div>
              </details>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setIsBonusModalOpen(false)}>キャンセル</button>
              <button className="confirm-btn" onClick={handleAdjustBonus} disabled={isSubmitting}>
                {isSubmitting ? '処理中...' : '調整を実行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagementScreen;