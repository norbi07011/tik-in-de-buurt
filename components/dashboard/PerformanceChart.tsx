import React from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Generate mock data for the last 30 days
const generateMockData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            profile_views: Math.floor(Math.random() * 100) + 50,
            ad_clicks: Math.floor(Math.random() * 50) + 20,
            new_stars: Math.floor(Math.random() * 10) + 1,
        });
    }
    return data;
};

const chartData = generateMockData();

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    const { t } = useTranslation();
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/70 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <p className="label font-bold text-white">{`${label}`}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${t(pld.dataKey)}: ${pld.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


const PerformanceChart: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="glass-card-style p-6 h-80">
            <h2 className="text-xl font-bold text-white">{t('performance_overview')}</h2>
            <p className="text-sm text-gray-400 mb-4">{t('last_30_days')}</p>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                >
                    <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00FFC2" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#00FFC2" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ bottom: 0 }} formatter={(value) => t(value)} />
                    <Area type="monotone" dataKey="profile_views" stroke="#00FFC2" fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="ad_clicks" stroke="#8884d8" fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PerformanceChart;
