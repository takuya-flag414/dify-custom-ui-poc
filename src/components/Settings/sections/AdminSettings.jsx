// src/components/Settings/sections/AdminSettings.jsx
import React from 'react';
import { BarChart2, Users, Coins, Activity, CheckCircle2 } from 'lucide-react';
import './SettingsComponents.css';

const AdminSettings = () => {
  // Mock Data
  const stats = [
    { label: 'Total Tokens (30d)', value: '1,240,500', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Active Users', value: '42', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Avg. Response Time', value: '1.2s', icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title flex items-center gap-2">
            <BarChart2 size={18} className="text-[var(--color-primary)]"/>
            ダッシュボード (Mock)
          </h3>
          <p className="settings-card-description">
            システム利用状況と健全性をモニタリングします。
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-[var(--color-border)] flex items-center gap-4 hover:bg-[var(--color-bg-body)] transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-sub)]">{stat.label}</p>
                <p className="text-lg font-bold text-[var(--color-text-main)]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Graph (Placeholder) */}
      <div className="settings-card">
         <div className="settings-card-header mb-4">
            <h4 className="text-sm font-bold text-[var(--color-text-main)]">トークン消費推移</h4>
         </div>
         {/* CSSのみで簡易的なグラフ表現 */}
         <div className="h-40 flex items-end justify-between gap-2 px-2">
            {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                <div key={i} className="w-full bg-blue-100 rounded-t-sm relative group">
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600"
                        style={{ height: `${h}%` }}
                    ></div>
                    {/* Tooltipish */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        {h * 1000} tokens
                    </div>
                </div>
            ))}
         </div>
         <div className="flex justify-between mt-2 text-xs text-[var(--color-text-sub)]">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
         </div>
      </div>

      {/* System Health */}
      <div className="settings-card">
         <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-500" />
            <div>
                <p className="text-sm font-bold text-[var(--color-text-main)]">All Systems Operational</p>
                <p className="text-xs text-[var(--color-text-sub)]">Last checked: Just now</p>
            </div>
         </div>
      </div>

    </div>
  );
};

export default AdminSettings;