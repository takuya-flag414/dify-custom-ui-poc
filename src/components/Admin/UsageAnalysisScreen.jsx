// src/components/Admin/UsageAnalysisScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import * as Recharts from 'recharts';
import * as Icons from 'lucide-react';
import { aiAnalyticsService } from '../../services/AiAnalyticsService';
import './UsageAnalysisScreen.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const UsageAnalysisScreen = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('daily'); // 'daily', 'monthly'
  const [timeRange, setTimeRange] = useState(30); // 過去N日間
  const [selectedPeriod, setSelectedPeriod] = useState(null); // フィルタリング用の特定期間
  const [analysisTarget, setAnalysisTarget] = useState('all'); // 'all', 'none', or deptId
  const [mappings, setMappings] = useState({ userMap: {}, deptMap: {} });
  const [activeTokenKey, setActiveTokenKey] = useState(null); // トークン詳細表示中の行キー
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  
  // 選択中の年月 (初期値: 今月)
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const [exportOptions, setExportOptions] = useState({
    type: 'user', // 'user', 'dept', 'specific_dept', 'raw'
    specificDeptId: '',
    range: 30, // days or 'YYYY-MM'
    selectedMonth: new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  });

  // マッピングデータの取得 (ユーザー名・部署名)
  useEffect(() => {
    let isMounted = true;
    const fetchMappings = async () => {
      try {
        const data = await aiAnalyticsService.getAnalysisMappings();
        if (isMounted && data) {
          setMappings(data);
        }
      } catch (err) {
        console.error('Failed to fetch mappings:', err);
      }
    };
    fetchMappings();
    return () => { isMounted = false; };
  }, []);

  // 表示単位が変更されたら取得期間を調整し、フィルタをリセット
  useEffect(() => {
    setSelectedPeriod(null);
    // viewType は 'specific_month' 固定で運用するようにシンプル化
    setViewType('specific_month');
    const monthStr = `${currentYearMonth.year}-${currentYearMonth.month.toString().padStart(2, '0')}`;
    setTimeRange(monthStr);
  }, [currentYearMonth]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiAnalyticsService.getAiUsageStats(timeRange);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch usage stats:', err);
      setError('データの取得に失敗しました。詳細: ' + (err.message || '不明なエラー'));
    } finally {
      setIsLoading(false);
    }
  };

  const executeExport = (type, dataToExport) => {
    let csvContent = "\uFEFF"; // BOM
    let fileName = "";
    const userMap = mappings?.userMap || {};
    const deptMap = mappings?.deptMap || {};

    // フィルターの適用
    let filtered = dataToExport;
    if (type === 'specific_dept' && exportOptions.specificDeptId) {
      filtered = dataToExport.filter(log => {
        const profile = userMap[log.user_id];
        return profile?.departmentId?.toString() === exportOptions.specificDeptId;
      });
    }

    if (type === 'user' || type === 'specific_dept') {
      const label = type === 'specific_dept' ? `dept_${exportOptions.specificDeptId}` : 'user';
      fileName = `ai_usage_${label}_${new Date().toISOString().slice(0,10)}.csv`;
      csvContent += "ユーザーID,氏名,部署,利用回数,入力トークン,出力トークン,総トークン,推定コスト(円)\n";
      
      const userStats = {};
      filtered.forEach(log => {
        if (!userStats[log.user_id]) {
          const profile = userMap[log.user_id];
          userStats[log.user_id] = {
            name: profile?.name || 'Unknown',
            dept: profile?.departmentId ? (deptMap[profile.departmentId] || 'Unknown') : '未設定',
            count: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            tokens: 0,
            cost: 0
          };
        }
        userStats[log.user_id].count++;
        userStats[log.user_id].prompt_tokens += (log.prompt_tokens || 0);
        userStats[log.user_id].completion_tokens += (log.completion_tokens || 0);
        userStats[log.user_id].tokens += (log.total_tokens || 0);
        userStats[log.user_id].cost += (log.estimated_cost_jpy || 0);
      });

      Object.entries(userStats).forEach(([uid, s]) => {
        csvContent += `"${uid}","${s.name}","${s.dept}",${s.count},${s.prompt_tokens},${s.completion_tokens},${s.tokens},${s.cost.toFixed(2)}\n`;
      });

    } else if (type === 'dept') {
      fileName = `ai_usage_by_dept_${new Date().toISOString().slice(0,10)}.csv`;
      csvContent += "部署ID,部署名,利用回数,入力トークン,出力トークン,総トークン,推定コスト(円),ユニークユーザー数\n";

      const deptStats = {};
      filtered.forEach(log => {
        const profile = userMap[log.user_id];
        const dId = profile?.departmentId || 'none';
        if (!deptStats[dId]) {
          deptStats[dId] = {
            name: dId === 'none' ? '未設定' : (deptMap[dId] || 'Unknown'),
            count: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            tokens: 0,
            cost: 0,
            users: new Set()
          };
        }
        deptStats[dId].count++;
        deptStats[dId].prompt_tokens += (log.prompt_tokens || 0);
        deptStats[dId].completion_tokens += (log.completion_tokens || 0);
        deptStats[dId].tokens += (log.total_tokens || 0);
        deptStats[dId].cost += (log.estimated_cost_jpy || 0);
        deptStats[dId].users.add(log.user_id);
      });

      Object.entries(deptStats).forEach(([id, s]) => {
        csvContent += `"${id}","${s.name}",${s.count},${s.prompt_tokens},${s.completion_tokens},${s.tokens},${s.cost.toFixed(2)},${s.users.size}\n`;
      });
    } else if (type === 'raw') {
      fileName = `ai_usage_details_${new Date().toISOString().slice(0,10)}.csv`;
      csvContent += "日時,ユーザーID,氏名,部署,モデル,入力トークン,出力トークン,総トークン,推定コスト(円)\n";
      
      filtered.forEach(log => {
        try {
          const profile = userMap[log.user_id];
          const name = profile?.name || 'Unknown';
          const dept = profile?.departmentId ? (deptMap[profile.departmentId] || 'Unknown') : '未設定';
          
          let dateStr = '';
          if (log.timestamp) {
            const d = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
            dateStr = d.toLocaleString('ja-JP');
          }

          csvContent += `"${dateStr}","${log.user_id}","${name}","${dept}","${log.model || ''}",${log.prompt_tokens || 0},${log.completion_tokens || 0},${log.total_tokens || 0},${(log.estimated_cost_jpy || 0).toFixed(2)}\n`;
        } catch (err) {
          console.error('Row export error:', err);
        }
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const handleRunExport = async () => {
    let rangeValue = exportOptions.range;
    if (rangeValue === 'custom_month') {
      rangeValue = exportOptions.selectedMonth; // 'YYYY-MM'
    }

    if (rangeValue !== timeRange || typeof rangeValue === 'string') {
      setIsLoading(true);
      try {
        const data = await aiAnalyticsService.getAiUsageStats(rangeValue);
        executeExport(exportOptions.type, data);
      } catch (err) {
        setError('エクスポート用のデータ取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    } else {
      executeExport(exportOptions.type, logs);
    }
  };

  const handleMonthSelect = (m) => {
    setCurrentYearMonth({ year: pickerYear, month: m });
    setShowMonthPicker(false);
  };

  const navigateMonth = (direction) => {
    let { year, month } = currentYearMonth;
    month += direction;
    if (month > 12) { year++; month = 1; }
    if (month < 1) { year--; month = 12; }
    setCurrentYearMonth({ year, month });
  };

  const getMonthName = (m) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[m - 1];
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  // --- データ集計ロジック ---

  const targetFilteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    if (analysisTarget === 'all') return logs;
    
    const userMap = mappings?.userMap || {};
    return logs.filter(log => {
      const profile = userMap[log.user_id];
      const deptId = profile?.departmentId?.toString();
      if (analysisTarget === 'none') return !deptId;
      return deptId === analysisTarget;
    });
  }, [logs, analysisTarget, mappings]);

  const aggregatedData = useMemo(() => {
    const map = new Map();
    const now = new Date();

    if (viewType === 'daily' || viewType === 'specific_month') {
      if (viewType === 'specific_month' && typeof timeRange === 'string') {
        const [year, month] = timeRange.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
          const dateStr = `${month}/${i}`;
          map.set(dateStr, { date: dateStr, cost: 0, tokens: 0, prompt_tokens: 0, completion_tokens: 0, count: 0 });
        }
      } else {
        const days = Number(timeRange) || 30;
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
          map.set(dateStr, { date: dateStr, cost: 0, tokens: 0, prompt_tokens: 0, completion_tokens: 0, count: 0 });
        }
      }
    } else if (viewType === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}`;
        map.set(dateStr, { date: dateStr, cost: 0, tokens: 0, prompt_tokens: 0, completion_tokens: 0, count: 0 });
      }
    }

    targetFilteredLogs.forEach(log => {
      const d = new Date(log.timestamp);
      let dateStr = '';
      if (viewType === 'daily' || viewType === 'specific_month') {
        dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      } else if (viewType === 'monthly') {
        dateStr = `${d.getFullYear()}/${d.getMonth() + 1}`;
      }

      if (map.has(dateStr)) {
        const current = map.get(dateStr);
        map.set(dateStr, {
          ...current,
          cost: Math.round((current.cost + (log.estimated_cost_jpy || 0)) * 100) / 100,
          tokens: current.tokens + (log.total_tokens || 0),
          prompt_tokens: current.prompt_tokens + (log.prompt_tokens || 0),
          completion_tokens: current.completion_tokens + (log.completion_tokens || 0),
          count: current.count + 1
        });
      }
    });
    return Array.from(map.values());
  }, [targetFilteredLogs, viewType, timeRange]);

  const filteredLogs = useMemo(() => {
    if (!selectedPeriod) return targetFilteredLogs;
    return targetFilteredLogs.filter(log => {
      const d = new Date(log.timestamp);
      let dateStr = '';
      if (viewType === 'daily' || viewType === 'specific_month') {
        dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      } else if (viewType === 'monthly') {
        dateStr = `${d.getFullYear()}/${d.getMonth() + 1}`;
      }
      return dateStr === selectedPeriod;
    });
  }, [targetFilteredLogs, selectedPeriod, viewType]);

  const modelData = useMemo(() => {
    const map = new Map();
    filteredLogs.forEach(log => {
      const model = log.model || 'Unknown';
      map.set(model, (map.get(model) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  const archData = useMemo(() => {
    const map = new Map();
    filteredLogs.forEach(log => {
      const arch = log.architecture || 'CHAT';
      map.set(arch, (map.get(arch) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  const rankingData = useMemo(() => {
    const map = new Map();
    const userMap = mappings?.userMap || {};
    const deptMap = mappings?.deptMap || {};

    filteredLogs.forEach(log => {
      let key = '';
      let name = '';
      let subText = '';

      if (analysisTarget === 'all') {
        const profile = userMap[log.user_id];
        const deptId = profile?.departmentId?.toString() || 'none';
        key = deptId;
        name = deptMap[deptId] || (deptId === 'none' ? '所属なし' : 'Unknown');
        subText = '部署';
      } else {
        key = log.user_id;
        const profile = userMap[key];
        name = profile ? profile.name : (log.email || 'Unknown User');
        const deptId = profile?.departmentId?.toString();
        const deptName = deptId && deptMap[deptId] ? deptMap[deptId] : '未設定';
        subText = deptName;
      }

      const current = map.get(key) || { 
        id: key, // キーを保持
        name, 
        subText, 
        cost: 0, 
        tokens: 0, 
        prompt_tokens: 0, 
        completion_tokens: 0, 
        count: 0 
      };
      map.set(key, {
        ...current,
        cost: current.cost + (log.estimated_cost_jpy || 0),
        tokens: current.tokens + (log.total_tokens || 0),
        prompt_tokens: current.prompt_tokens + (log.prompt_tokens || 0),
        completion_tokens: current.completion_tokens + (log.completion_tokens || 0),
        count: current.count + 1
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map(item => ({
        ...item,
        cost: Math.round(item.cost * 100) / 100
      }));
  }, [filteredLogs, analysisTarget, mappings]);

  const avgStats = useMemo(() => {
    if (targetFilteredLogs.length === 0) return { latency: 0, ttft: 0, costPerMsg: 0, totalCost: 0 };
    const sum = targetFilteredLogs.reduce((acc, log) => ({
      latency: acc.latency + (log.latency_ms || 0),
      ttft: acc.ttft + (log.ttft_ms || 0),
      cost: acc.cost + (log.estimated_cost_jpy || 0)
    }), { latency: 0, ttft: 0, cost: 0 });

    return {
      latency: Math.round(sum.latency / targetFilteredLogs.length),
      ttft: Math.round(sum.ttft / targetFilteredLogs.length),
      costPerMsg: Math.round((sum.cost / targetFilteredLogs.length) * 100) / 100,
      totalCost: Math.round(sum.cost)
    };
  }, [targetFilteredLogs]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {(entry.value || 0).toLocaleString()}{entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 部署リスト
  const deptList = useMemo(() => {
    if (!mappings?.deptMap) return [];
    return Object.entries(mappings.deptMap).map(([id, name]) => ({ id, name }));
  }, [mappings]);

  // ローディング表示
  if (isLoading && logs.length === 0) {
    return (
      <div className="admin-screen-loading">
        <Icons.RefreshCw className="spinner" />
        <p>分析データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="usage-analysis-container">
      {/* フィルターヘッダー */}
      <div className="analysis-header">
        <div className="header-left">
          <h2 className="screen-title">AI利用分析</h2>
          <p className="screen-subtitle">トークン使用量とコストの統計</p>
        </div>
        <div className="header-controls">
          {selectedPeriod && (
            <button className="reset-filter-btn" onClick={() => setSelectedPeriod(null)}>
              <Icons.RefreshCw size={14} /> 全期間を表示
            </button>
          )}
          <div className="view-selector">
            <span className="selector-label">分析対象:</span>
            <select className="view-select" value={analysisTarget} onChange={(e) => setAnalysisTarget(e.target.value)}>
              <option value="all">会社全体</option>
              {deptList.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* 画像ベースの月セレクター */}
          <div className="month-picker-container">
            <div className="month-nav-btn-group">
              <button className="nav-arrow-btn" onClick={() => navigateMonth(-1)}>
                <Icons.ChevronLeft size={16} />
              </button>
              
              <div className="month-picker-trigger" onClick={() => {
                setPickerYear(currentYearMonth.year);
                setShowMonthPicker(!showMonthPicker);
              }}>
                {getMonthName(currentYearMonth.month)} {currentYearMonth.year}
              </div>

              <button className="nav-arrow-btn" onClick={() => navigateMonth(1)}>
                <Icons.ChevronRight size={16} />
              </button>
            </div>

            {showMonthPicker && (
              <>
                <div className="popover-backdrop" onClick={() => setShowMonthPicker(false)} />
                <div className="month-picker-popover">
                  <div className="popover-header">
                    <button onClick={() => setPickerYear(pickerYear - 1)}><Icons.ChevronLeft size={16} /></button>
                    <span className="year-display">{pickerYear}</span>
                    <button onClick={() => setPickerYear(pickerYear + 1)}><Icons.ChevronRight size={16} /></button>
                  </div>
                  <div className="month-grid">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <button 
                        key={m}
                        className={`month-cell ${currentYearMonth.year === pickerYear && currentYearMonth.month === m ? 'selected' : ''}`}
                        onClick={() => handleMonthSelect(m)}
                      >
                        {getMonthName(m)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="no-data-alert" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
          <Icons.AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 概要カードヘッダー */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <Icons.Activity size={20} /> 利用統計
        </h3>
        <div className="export-dropdown">
          <button 
            className="export-btn"
            onClick={() => setShowExportModal(true)}
          >
            <Icons.Download size={14} /> データ出力
          </button>
        </div>
      </div>

      {/* エクスポートモーダル */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content export-modal">
            <div className="modal-header">
              <h3><Icons.Download size={20} /> データエクスポート</h3>
              <button className="close-btn" onClick={() => setShowExportModal(false)}>
                <Icons.X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="export-option-group">
                <label className="option-label">Data Type (出力の種類)</label>
                <div className="option-select-wrapper">
                  <select 
                    value={exportOptions.type} 
                    onChange={(e) => setExportOptions({...exportOptions, type: e.target.value})}
                    className="admin-select"
                  >
                    <option value="user">ユーザー別集計</option>
                    <option value="dept">部署別集計 (全体)</option>
                    <option value="specific_dept">特定の部署を指定</option>
                    <option value="raw">詳細ログ出力 (全件)</option>
                  </select>
                </div>
                
                {exportOptions.type === 'specific_dept' && (
                  <div className="sub-option-select" style={{ marginTop: '12px' }}>
                    <select 
                      value={exportOptions.specificDeptId} 
                      onChange={(e) => setExportOptions({...exportOptions, specificDeptId: e.target.value})}
                      className="admin-select"
                    >
                      <option value="">部署を選択してください</option>
                      {deptList.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="export-option-group">
                <label className="option-label">Data Range (期間)</label>
                <div className="option-select-wrapper">
                  <select 
                    value={exportOptions.range} 
                    onChange={(e) => setExportOptions({...exportOptions, range: e.target.value === 'custom_month' ? 'custom_month' : parseInt(e.target.value)})}
                    className="admin-select"
                  >
                    <option value={7}>直近 7日間</option>
                    <option value={30}>直近 30日間</option>
                    <option value={90}>直近 90日間</option>
                    <option value={365}>過去 12ヶ月 (1年間)</option>
                    <option value="custom_month">特定の月を指定</option>
                  </select>
                </div>

                {exportOptions.range === 'custom_month' && (
                  <div className="sub-option-select" style={{ marginTop: '12px' }}>
                    <input 
                      type="month" 
                      value={exportOptions.selectedMonth}
                      onChange={(e) => setExportOptions({...exportOptions, selectedMonth: e.target.value})}
                      className="admin-select"
                    />
                  </div>
                )}
              </div>

              <div className="export-hint">
                <Icons.Info size={14} />
                <span>選択した条件で集計を行い、CSVファイルを生成します。</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowExportModal(false)}>キャンセル</button>
              <button className="run-export-btn" onClick={handleRunExport} disabled={isLoading}>
                {isLoading ? <Icons.RefreshCw className="spinner" size={16} /> : <Icons.Download size={16} />}
                ダウンロード実行
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">期間内合計コスト</span>
          <div className="stat-value">
            <Icons.TrendingUp size={18} style={{ color: '#10b981', marginRight: '8px' }} />
            {avgStats.totalCost?.toLocaleString() || 0}
            <span className="stat-unit">円</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">平均レスポンス時間</span>
          <div className="stat-value">
            <Icons.Clock size={18} style={{ color: '#6366f1', marginRight: '8px' }} />
            {(avgStats.latency / 1000).toFixed(2)}
            <span className="stat-unit">秒</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">平均TTFT (初動)</span>
          <div className="stat-value">
            <Icons.Zap size={18} style={{ color: '#f59e0b', marginRight: '8px' }} />
            {avgStats.ttft?.toLocaleString() || 0}
            <span className="stat-unit">ms</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">メッセージ単価平均</span>
          <div className="stat-value">
            <Icons.BarChart3 size={18} style={{ color: '#8b5cf6', marginRight: '8px' }} />
            {avgStats.costPerMsg || 0}
            <span className="stat-unit">円/回</span>
          </div>
        </div>
      </div>

      <div className="charts-container">
        {/* コスト推移 */}
        <div className="chart-box full-width">
          <h3 className="chart-title">
            <Icons.TrendingUp size={18} /> コスト推移 ({viewType === 'daily' ? '日別' : '月別'})
            {selectedPeriod && <span className="filter-badge">選択中: {selectedPeriod}</span>}
          </h3>
          <div className="chart-wrapper">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.AreaChart 
                data={aggregatedData} 
                onClick={(state) => state && state.activeLabel && setSelectedPeriod(state.activeLabel)}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Recharts.CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Recharts.XAxis dataKey="date" />
                <Recharts.YAxis />
                <Recharts.Tooltip content={<CustomTooltip />} />
                <Recharts.Area 
                  type="monotone" 
                  dataKey="cost" 
                  name="コスト" 
                  unit="円" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                  strokeWidth={3}
                />
              </Recharts.AreaChart>
            </Recharts.ResponsiveContainer>
          </div>
        </div>

        {/* モデル別シェア */}
        <div className="chart-box">
          <h3 className="chart-title">
            <Icons.Cpu size={18} /> モデル別利用シェア
          </h3>
          <div className="chart-wrapper">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.PieChart>
                <Recharts.Pie
                  data={modelData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {modelData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Recharts.Pie>
                <Recharts.Tooltip />
                <Recharts.Legend />
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
          </div>
        </div>

        {/* 機能別シェア */}
        <div className="chart-box">
          <h3 className="chart-title">
            <Icons.PieChart size={18} /> 機能別利用シェア
          </h3>
          <div className="chart-wrapper">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.PieChart>
                <Recharts.Pie
                  data={archData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {archData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Recharts.Pie>
                <Recharts.Tooltip />
                <Recharts.Legend />
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
          </div>
        </div>

        {/* トークン推移 */}
        <div className="chart-box full-width">
          <h3 className="chart-title">
            <Icons.Zap size={18} /> トークン消費量推移 ({viewType === 'daily' ? '日別' : '月別'})
            {selectedPeriod && <span className="filter-badge">選択中: {selectedPeriod}</span>}
          </h3>
          <div className="chart-wrapper">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.BarChart 
                data={aggregatedData}
                onClick={(state) => state && state.activeLabel && setSelectedPeriod(state.activeLabel)}
                style={{ cursor: 'pointer' }}
              >
                <Recharts.CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Recharts.XAxis dataKey="date" />
                <Recharts.YAxis />
                <Recharts.Tooltip content={<CustomTooltip />} />
                <Recharts.Legend />
                <Recharts.Bar dataKey="prompt_tokens" name="入力" stackId="a" fill="#10b981" />
                <Recharts.Bar dataKey="completion_tokens" name="出力" stackId="a" fill="#3b82f6" />
              </Recharts.BarChart>
            </Recharts.ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ランキング */}
      <div className="ranking-section">
        <h3 className="section-title">
          <Icons.Users size={20} /> 
          {analysisTarget === 'all' ? '部署別 利用ランキング' : 'ユーザー別ランキング'}
        </h3>
        <div className="ranking-grid">
          <div className="ranking-card">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>順位</th>
                  <th>名前</th>
                  {analysisTarget !== 'all' && <th>部署</th>}
                  <th className="text-right">コスト (円)</th>
                  <th className="text-right">トークン量</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    {analysisTarget !== 'all' && <td>{item.subText}</td>}
                    <td className="text-right" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {item.cost.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <div 
                        className={`token-inline-container ${activeTokenKey === item.id ? 'is-active' : ''}`}
                        onClick={() => setActiveTokenKey(activeTokenKey === item.id ? null : item.id)}
                        style={{ cursor: 'pointer', padding: '4px 0' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600, position: 'relative' }}>
                          <span style={{ minWidth: '60px', textAlign: 'right' }}>{item.tokens.toLocaleString()}</span>
                          <Icons.ChevronRight 
                            size={14} 
                            style={{ 
                              opacity: 0.5, 
                              transform: activeTokenKey === item.id ? 'rotate(180deg)' : 'rotate(0)',
                              transition: 'transform 0.2s ease',
                              marginLeft: '8px'
                            }} 
                          />
                          {activeTokenKey === item.id && (
                            <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px', marginLeft: '12px', whiteSpace: 'nowrap', zIndex: 10 }}>
                              <span className="token-label-in" style={{ fontSize: '0.8rem', padding: '2px 6px' }}>In: {item.prompt_tokens.toLocaleString()}</span>
                              <span className="token-label-out" style={{ fontSize: '0.8rem', padding: '2px 6px' }}>Out: {item.completion_tokens.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageAnalysisScreen;
