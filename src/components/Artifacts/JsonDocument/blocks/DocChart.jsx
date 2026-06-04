import React from 'react';
import { 
    BarChart, Bar, 
    LineChart, Line, 
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer 
} from 'recharts';

/**
 * DocChart
 * A4ドキュメント内にグラフを表示するコンポーネントです。
 */
const DocChart = ({ block }) => {
    const { chart_type = 'bar', data = [], title, height = 240 } = block;

    // 印刷物に適したコンサバティブなカラーパレット（ダークネイビー + グレー階調）
    const COLORS = ['#003366', '#333333', '#666666', '#999999', '#cccccc', '#1a1a1a'];

    const renderChart = () => {
        if (!data || data.length === 0) {
            return <div style={{ padding: '20px', color: '#999', textAlign: 'center' }}>データがありません</div>;
        }

        switch (chart_type) {
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#333' }} />
                        <YAxis fontSize={10} tick={{ fill: '#333' }} />
                        <Tooltip />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#555' }} />
                        <Line type="monotone" dataKey="value" stroke="#003366" strokeWidth={2} dot={{ r: 4, fill: '#003366' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="#fff"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#555' }}/>
                    </PieChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#333' }} />
                        <YAxis fontSize={10} tick={{ fill: '#333' }} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Legend iconType="rect" wrapperStyle={{ fontSize: '11px', color: '#555' }} />
                        <Bar dataKey="value" fill="#003366" radius={[2, 2, 0, 0]} />
                    </BarChart>
                );
        }
    };

    return (
        <div className="doc-chart-container" style={{ 
            margin: '24px auto', 
            padding: '16px 0', 
            maxWidth: '560px',
            backgroundColor: 'transparent', 
            borderTop: '1px solid #000',
            borderBottom: '1px solid #000'
        }}>
            {title && <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '10pt', 
                fontFamily: 'var(--doc-font-sans)',
                textAlign: 'center', 
                color: '#333' 
            }}>{title}</h4>}
            <div style={{ width: '100%', height: `${height}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DocChart;
