// src/components/Admin/UserManagementScreen.jsx
import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Copy, Check, Users } from 'lucide-react';
import { authService } from '../../services/AuthService';
import './UserManagementScreen.css';

const UserManagementScreen = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    emailPrefix: '',
    password: '',
    roleId: 'role_general'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const domain = '@iflag.co.jp';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.displayName || !formData.emailPrefix || !formData.password) {
      setError('すべての必須項目を入力してください。');
      return;
    }

    setLoading(true);
    setError('');

    const fullEmail = `${formData.emailPrefix}${domain}`;

    try {
      await authService.adminCreateUser(
        fullEmail,
        formData.password,
        formData.displayName,
        formData.roleId,
        null, // departmentId
        {}    // securityInfo
      );

      setSuccessData({
        email: fullEmail,
        password: formData.password
      });

    } catch (err) {
      setError(err.message || 'アカウント作成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData) return;
    const copyText = `【社内システムアカウント情報】\nURL: ${window.location.origin}\nメールアドレス: ${successData.email}\n初期パスワード: ${successData.password}`;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetForm = () => {
    setFormData({
      displayName: '',
      emailPrefix: '',
      password: '',
      roleId: 'role_general'
    });
    setSuccessData(null);
    setShowPassword(false);
  };

  return (
    <div className="admin-management-container">
      <div className="admin-header">
        <h1><ShieldCheck size={28} style={{ color: 'var(--accent-primary)' }}/> ユーザー管理</h1>
        <p>新しい社員用のアカウントを発行します。作成されたアカウントはメール認証が不要です。</p>
      </div>

      <div className="admin-content-grid">
        <div className="admin-card">
          <h2>アカウント発行</h2>
          
          {error && <div className="admin-error-box">{error}</div>}

          {successData ? (
            <div className="success-result-box">
              <div className="success-header">
                <Check size={20} />
                アカウント作成が完了しました
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                対象ユーザーへ以下の情報を共有してください。
              </p>
              
              <div className="credentials-container">
                <div className="credential-row">
                  <span className="credential-label">メールアドレス:</span>
                  <span className="credential-value">{successData.email}</span>
                </div>
                <div className="credential-row">
                  <span className="credential-label">パスワード:</span>
                  <span className="credential-value">{successData.password}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                <button 
                  className="admin-primary-btn" 
                  onClick={handleCopyCredentials}
                  style={{ marginTop: 0 }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'コピーしました' : '情報をコピーする'}
                </button>
                <button className="secondary-action-btn" onClick={handleResetForm}>
                  別のアカウントを作成
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>氏名（表示名）<span className="required-mark">*</span></label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="例: 山田 太郎"
                  className="admin-input"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>メールアドレス<span className="required-mark">*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    name="emailPrefix"
                    value={formData.emailPrefix}
                    onChange={handleChange}
                    placeholder="yamada"
                    className="admin-input"
                    disabled={loading}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{domain}</span>
                </div>
              </div>

              <div className="form-group">
                <label>初期パスワード<span className="required-mark">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="最低6文字以上"
                    className="admin-input"
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="icon-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>ロール（権限）</label>
                <select 
                  name="roleId" 
                  value={formData.roleId} 
                  onChange={handleChange}
                  className="admin-select"
                  disabled={loading}
                >
                  <option value="role_general">一般権限 (role_general)</option>
                  <option value="role_admin">管理者権限 (role_admin)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="admin-primary-btn"
                disabled={loading}
              >
                {loading ? '作成中...' : <React.Fragment><Users size={18} /> アカウントを発行する</React.Fragment>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementScreen;
