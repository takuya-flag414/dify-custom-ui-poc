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
    if (viewType === 'daily') {
      setTimeRange(30);
    } else if (viewType === 'monthly') {
      setTimeRange(365);
    }
  }, [viewType]);

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

    if (viewType === 'daily') {
      for (let i = timeRange - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        map.set(dateStr, { date: dateStr, cost: 0, tokens: 0, prompt_tokens: 0, completion_tokens: 0, count: 0 });
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
      if (viewType === 'daily') {
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
      if (viewType === 'daily') {
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
            <span className="selector-label">表示単位:</span>
            <select className="view-select" value={viewType} onChange={(e) => setViewType(e.target.value)}>
              <option value="daily">日別 (過去30日)</option>
              <option value="monthly">月別 (過去12ヶ月)</option>
            </select>
          </div>
          <div className="view-selector">
            <span className="selector-label">分析対象:</span>
            <select className="view-select" value={analysisTarget} onChange={(e) => setAnalysisTarget(e.target.value)}>
              <option value="all">会社全体</option>
              {deptList.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
              <option value="none">所属なし</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="no-data-alert" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
          <Icons.AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 概要カード */}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 600 }}>
                          {item.tokens.toLocaleString()}
                          <Icons.ChevronDown 
                            size={12} 
                            style={{ 
                              opacity: 0.5, 
                              transform: activeTokenKey === item.id ? 'rotate(180deg)' : 'rotate(0)',
                              transition: 'transform 0.2s ease'
                            }} 
                          />
                        </div>
                        
                        {activeTokenKey === item.id && (
                          <div className="token-mini-breakdown">
                            <span className="token-label-in">In: {item.prompt_tokens.toLocaleString()}</span>
                            <span className="token-label-out">Out: {item.completion_tokens.toLocaleString()}</span>
                          </div>
                        )}
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
