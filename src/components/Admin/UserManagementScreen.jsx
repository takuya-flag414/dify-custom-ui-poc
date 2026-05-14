// src/components/Admin/UserManagementScreen.jsx
import React, { useState, useRef } from 'react';
import { ShieldCheck, Eye, EyeOff, Copy, Check, Users, Upload, AlertCircle, FileText, Download } from 'lucide-react';
import { authService } from '../../services/AuthService';
import { MOCK_DEPARTMENTS } from '../../mocks/mockUsers';
import './UserManagementScreen.css';

const UserManagementScreen = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    emailPrefix: '',
    password: '',
    employeeCode: '',
    departmentId: '',
    roleId: 'role_general'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [selectedDomain, setSelectedDomain] = useState('@iflag.co.jp');
  const allowedDomains = ['@iflag.co.jp', '@epark.co.jp'];

  // --- Bulk (CSV) State ---
  const [activeTab, setActiveTab] = useState('single');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [bulkError, setBulkError] = useState('');
  const [bulkStatus, setBulkStatus] = useState('idle'); // idle, ready, processing, completed
  const [bulkProgress, setBulkProgress] = useState(0);

  // パスワードをランダム生成する（8文字、英大小文字＋数字＋特殊文字）
  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!/[A-Z]/.test(newPassword)) newPassword = newPassword.replace(/.$/, 'A');
    if (!/[0-9]/.test(newPassword)) newPassword = newPassword.replace(/^./, '1');
    if (!/[!@#$*]/.test(newPassword)) newPassword = newPassword.replace(/(..)$/, '!');
    return newPassword;
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return { rows: [], errors: ['データ行がありません。'] };
    
    const rows = [];
    const errors = [];
    
    // ヘッダーは無視して2行目から読み込む
    for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cells.length < 2 && !cells[0]) continue;
        
        let displayName = cells[0] || '';
        let emailPrefix = cells[1] || '';
        let rowPassword = cells[2] || '';
        let employeeCode = cells[3] || '';
        let deptId = cells[4] || '';
        let roleRaw = cells[5] || 'general';
        
        if (!displayName || !emailPrefix) {
            errors.push(`行 ${i + 1}: 氏名またはメールアドレスが空欄です。`);
            continue;
        }
        
        if (!rowPassword) {
            rowPassword = generateRandomPassword();
        }
        
        let roleId = 'role_general';
        if (roleRaw.toLowerCase() === 'admin' || roleRaw === '管理者') {
            roleId = 'role_admin';
        }
        
        rows.push({
            rowNum: i + 1,
            displayName,
            emailPrefix,
            password: rowPassword,
            employeeCode,
            departmentId: deptId ? parseInt(deptId, 10) : null,
            roleId,
            status: 'pending'
        });
    }
    return { rows, errors };
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleFile = (file) => {
    if (!file.name.endsWith('.csv')) {
        setBulkError('CSV形式のファイルを選択してください。');
        setParsedRows([]);
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const { rows, errors } = parseCSV(text);
        if (errors.length > 0) {
            setBulkError(errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...他' : ''));
            setParsedRows([]);
            setBulkStatus('idle');
        } else if (rows.length > 0) {
            setBulkError('');
            setParsedRows(rows);
            setBulkStatus('ready');
        } else {
            setBulkError('有効なデータ行が見つかりませんでした。');
            setParsedRows([]);
            setBulkStatus('idle');
        }
    };
    reader.readAsText(file);
  };

  const processBulkRows = async () => {
    setBulkStatus('processing');
    setBulkProgress(0);
    
    const newResults = [];
    
    for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const fullEmail = `${row.emailPrefix}${selectedDomain}`;
        
        try {
            await authService.adminCreateUser(
                fullEmail,
                row.password,
                row.displayName,
                row.roleId,
                row.departmentId,
                row.employeeCode,
                {}
            );
            newResults.push({ ...row, fullEmail, status: 'success' });
        } catch (err) {
            newResults.push({ ...row, fullEmail, status: 'error', errorMessage: err.message });
        }
        
        setBulkProgress(i + 1);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setBulkStatus('completed');
    setParsedRows(newResults);
  };

  const downloadTemplate = (e) => {
    e.preventDefault();
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + "氏名,メールプレフィックス,初期パスワード(空欄で自動生成),社員番号,部署ID(1:商品企画 2:営業 3:マーケ 4:その他 5:カスタマー),権限(general または admin)\n山田 太郎,yamada,,123456,1,general\nシステム 管理,admin_sys,,654321,2,admin";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "account_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    const fullEmail = `${formData.emailPrefix}${selectedDomain}`;

    try {
      await authService.adminCreateUser(
        fullEmail,
        formData.password,
        formData.displayName,
        formData.roleId,
        formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        formData.employeeCode,
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
      employeeCode: '',
      departmentId: '',
      roleId: 'role_general'
    });
    setSuccessData(null);
    setShowPassword(false);
  };

  return (
    <div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          <Users size={16} /> 個別作成
        </button>
        <button 
          className={`admin-tab ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <FileText size={16} /> 一括作成 (CSV)
        </button>
      </div>

      <div className="admin-content-grid">
        <div className="admin-card">
          {/* 共通ドメイン設定 */}
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '12px', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>作成対象ドメイン:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="admin-select"
              style={{ width: 'auto', minWidth: '160px', margin: 0 }}
              disabled={loading || bulkStatus === 'processing'}
            >
              {allowedDomains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>※CSV一括作成時もこのドメインが適用されます</span>
          </div>

          {activeTab === 'single' ? (
            <>
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
                  <span className="domain-suffix">{selectedDomain}</span>
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
                <label>社員番号</label>
                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleChange}
                  placeholder="例: 123456"
                  className="admin-input"
                  disabled={loading}
                />
              </div>
<div className="form-group">
                <label>部署</label>
                <select 
                  name="departmentId" 
                  value={formData.departmentId} 
                  onChange={handleChange}
                  className="admin-select"
                  disabled={loading}
                >
                  <option value="">部署を選択してください</option>
                  {MOCK_DEPARTMENTS.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
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
            </>
          ) : (
            // Bulk Tab Content
            <div>
              <h2>CSVで一括作成</h2>
              {bulkStatus === 'idle' && (
                <>
                  <a href="#" className="download-link" onClick={downloadTemplate}>
                    <Download size={14} /> テンプレートCSVをダウンロード
                  </a>
                  {bulkError && <div className="admin-error-box" style={{ whiteSpace: 'pre-wrap' }}>{bulkError}</div>}
                  <div 
                    className={`csv-drop-area ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="csv-icon-wrapper">
                      <Upload size={24} />
                    </div>
                    <div className="csv-drop-text">CSVファイルをドラッグ＆ドロップ</div>
                    <div className="csv-drop-subtext">またはクリックしてファイルを選択してください。</div>
                    <input 
                      type="file" 
                      accept=".csv" 
                      ref={fileInputRef} 
                      className="csv-file-input"
                      onChange={handleFileChange}
                    />
                  </div>
                </>
              )}

              {bulkStatus === 'ready' && (
                <div>
                  <div className="success-result-box" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', marginBottom: '20px' }}>
                    <div className="success-header" style={{ color: 'var(--text-primary)' }}>
                      <FileText size={20} />
                      読み込み完了: {parsedRows.length} 件のアカウントを作成します
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                      「一括作成を開始する」ボタンを押すと、自動的に作成処理が始まります。
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button className="admin-primary-btn" onClick={processBulkRows} style={{ marginTop: 0 }}>
                      <Users size={18} /> 一括作成を開始する
                    </button>
                    <button className="secondary-action-btn" onClick={() => setBulkStatus('idle')}>
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              {bulkStatus === 'processing' && (
                <div className="bulk-progress-container">
                  <div className="progress-header">
                    <span>アカウント作成中...</span>
                    <span>{bulkProgress} / {parsedRows.length}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(bulkProgress / parsedRows.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {bulkStatus === 'completed' && (
                <div>
                  <div className="success-result-box">
                    <div className="success-header">
                      <Check size={20} />
                      一括作成処理が完了しました
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '0' }}>
                      作成に成功したアカウントと、失敗したアカウントの結果をご確認ください。<br/>
                      （パスワードが空白だった場合は以下の表に自動生成されたパスワードが表示されています）
                    </p>
                  </div>

                  <div className="bulk-results-area">
                    <h3 className="bulk-results-title">処理結果レポート</h3>
                    <div className="results-table-wrapper">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>行</th>
                            <th>ステータス</th>
                            <th>氏名</th>
                            <th>メールアドレス</th>
                            <th>パスワード</th>
                            <th>詳細</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.rowNum}</td>
                              <td>
                                {row.status === 'success' ? (
                                  <span className="status-badge success"><Check size={12}/> 成功</span>
                                ) : (
                                  <span className="status-badge error"><AlertCircle size={12}/> 失敗</span>
                                )}
                              </td>
                              <td>{row.displayName}</td>
                              <td>{row.fullEmail || row.emailPrefix}</td>
                              <td style={{ fontFamily: 'monospace' }}>{row.status === 'success' ? row.password : '-'}</td>
                              <td style={{ color: row.status === 'error' ? '#ef4444' : 'inherit' }}>
                                {row.status === 'error' ? row.errorMessage : '作成完了'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button className="secondary-action-btn" onClick={() => {
                    setBulkStatus('idle');
                    setParsedRows([]);
                  }}>
                    別のCSVファイルを登録する
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementScreen;
