// src/components/Admin/UsageAnalysisScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  Cpu, 
  Zap, 
  Clock, 
  BarChart3, 
  PieChart as PieChartIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { aiAnalyticsService } from '../../services/AiAnalyticsService';
import './UsageAnalysisScreen.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const UsageAnalysisScreen = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // 過去30日間

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiAnalyticsService.getAiUsageStats(timeRange);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch usage stats:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  // --- データ集計ロジック ---

  // 1. 日別集計 (コストとトークン)
  const dailyData = useMemo(() => {
    const map = new Map();
    // 過去 N 日間の空データを作成
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      map.set(dateStr, { 
        date: dateStr, 
        cost: 0, 
        tokens: 0, 
        prompt_tokens: 0, 
        completion_tokens: 0, 
        count: 0 
      });
    }

    logs.forEach(log => {
      const d = new Date(log.timestamp);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
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
  }, [logs, timeRange]);

  // 2. モデル別シェア
  const modelData = useMemo(() => {
    const map = new Map();
    logs.forEach(log => {
      const model = log.model || 'Unknown';
      map.set(model, (map.get(model) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // 3. アーキテクチャ別シェア
  const archData = useMemo(() => {
    const map = new Map();
    logs.forEach(log => {
      const arch = log.architecture || 'CHAT';
      map.set(arch, (map.get(arch) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // 4. レスポンス統計
  const avgStats = useMemo(() => {
    if (logs.length === 0) return { latency: 0, ttft: 0, costPerMsg: 0 };
    const sum = logs.reduce((acc, log) => ({
      latency: acc.latency + (log.latency_ms || 0),
      ttft: acc.ttft + (log.ttft_ms || 0),
      cost: acc.cost + (log.estimated_cost_jpy || 0)
    }), { latency: 0, ttft: 0, cost: 0 });

    return {
      latency: Math.round(sum.latency / logs.length),
      ttft: Math.round(sum.ttft / logs.length),
      costPerMsg: Math.round((sum.cost / logs.length) * 100) / 100,
      totalCost: Math.round(sum.cost)
    };
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}{entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="admin-screen-loading">
        <RefreshCw className="spinner" />
        <p>分析データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="usage-analysis-container">
      {/* 概要カード */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">期間内合計コスト</span>
          <div className="stat-value">
            <TrendingUp size={18} style={{ color: '#10b981', marginRight: '8px' }} />
            {avgStats.totalCost?.toLocaleString()}
            <span className="stat-unit">円</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">平均レスポンス時間</span>
          <div className="stat-value">
            <Clock size={18} style={{ color: '#6366f1', marginRight: '8px' }} />
            {(avgStats.latency / 1000).toFixed(2)}
            <span className="stat-unit">秒</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">平均TTFT (初動)</span>
          <div className="stat-value">
            <Zap size={18} style={{ color: '#f59e0b', marginRight: '8px' }} />
            {avgStats.ttft?.toLocaleString()}
            <span className="stat-unit">ms</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">メッセージ単価平均</span>
          <div className="stat-value">
            <BarChart3 size={18} style={{ color: '#8b5cf6', marginRight: '8px' }} />
            {avgStats.costPerMsg}
            <span className="stat-unit">円/回</span>
          </div>
        </div>
      </div>

      <div className="charts-container">
        {/* コスト推移 */}
        <div className="chart-box full-width">
          <h3 className="chart-title">
            <TrendingUp size={18} /> コスト推移 (日別)
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  name="コスト" 
                  unit="円" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* モデル別シェア */}
        <div className="chart-box">
          <h3 className="chart-title">
            <Cpu size={18} /> モデル別利用シェア
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* アーキテクチャ別シェア */}
        <div className="chart-box">
          <h3 className="chart-title">
            <PieChartIcon size={18} /> 機能別利用シェア
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={archData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {archData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* トークン消費推移 */}
        <div className="chart-box full-width">
          <h3 className="chart-title">
            <Zap size={18} /> トークン消費量推移
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="prompt_tokens" name="入力 (Prompt)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="completion_tokens" name="出力 (Completion)" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {logs.length === 0 && !isLoading && (
        <div className="no-data-alert">
          <AlertCircle size={20} />
          <span>選択された期間内に利用データが見つかりませんでした。</span>
        </div>
      )}
    </div>
  );
};

export default UsageAnalysisScreen;
