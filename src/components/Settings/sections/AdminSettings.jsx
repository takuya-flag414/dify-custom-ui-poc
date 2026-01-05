// src/components/Settings/sections/AdminSettings.jsx
import React from 'react';
import { BarChart2, Users, Coins, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow, MacStatsGrid, MacStatsItem } from './MacSettingsComponents';
import './SettingsCommon.css';
import './AdminSettings.css';

const AdminSettings = () => {
  // Mock Data
  const stats = [
    { label: 'Total Tokens (30d)', value: '1,240,500', icon: Coins },
    { label: 'Active Users', value: '42', icon: Users },
    { label: 'Avg. Response', value: '1.2s', icon: Activity },
  ];

  return (
    <div className="settings-container">

      {/* === Section: System Status === */}
      <MacSettingsSection title="System Status">
        <MacSettingsRow
          icon={CheckCircle2}
          label="All Systems Operational"
          description="Last checked: Just now"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontSize: '12px', fontWeight: '500' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></div>
            Healthy
          </div>
        </MacSettingsRow>

        {/* KPI Grid Row */}
        <MacStatsGrid>
          {stats.map((stat, idx) => (
            <MacStatsItem
              key={idx}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </MacStatsGrid>
      </MacSettingsSection>

      {/* === Section: Usage Metrics === */}
      <MacSettingsSection title="Token Usage History">
        {/* Custom Content Row for Chart */}
        <div className="mac-settings-custom-content">
          <div className="admin-chart-container">
            <div className="admin-chart-bars">
              {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                <div key={i} className="admin-bar-wrapper">
                  <div
                    className="admin-bar"
                    style={{ height: `${h}%` }}
                    data-value={`${h * 1000}`}
                  ></div>
                  <span className="admin-bar-label">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MacSettingsSection>

      {/* === Section: Alerts (Example) === */}
      <MacSettingsSection title="System Alerts">
        <MacSettingsRow
          icon={AlertCircle}
          label="API Rate Limit Warning"
          description="2024-01-04 14:20:00 - OpenAI API"
          danger
          isLast
        >
          <button className="settings-btn secondary">Dismiss</button>
        </MacSettingsRow>
      </MacSettingsSection>

    </div>
  );
};

export default AdminSettings;