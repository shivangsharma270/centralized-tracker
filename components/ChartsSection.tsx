
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Concern } from '../types';

interface ChartsSectionProps {
  concerns: Concern[];
  activeTab: 'All' | 'Social Media' | 'Board' | 'Other';
  setActiveTab: (tab: 'All' | 'Social Media' | 'Board' | 'Other') => void;
}

const COLORS = ['#1a73e8', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4', '#64748b'];

const ChartsSection: React.FC<ChartsSectionProps> = ({ concerns, activeTab, setActiveTab }) => {
  const parseSheetDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0]);
    const monthStr = parts[1];
    const year = 2000 + parseInt(parts[2]);
    const month = new Date(`${monthStr} 1, 2000`).getMonth();
    return new Date(year, month, day);
  };

  const statusData = useMemo(() => {
    const counts = concerns.reduce((acc: any, c) => {
      const status = c['Ticket Status'] || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [concerns]);

  const trendData = useMemo(() => {
    const dates: any = {};
    concerns.forEach(c => {
      const dateStr = c['Acknowledgement Date'];
      if (dateStr) {
        dates[dateStr] = (dates[dateStr] || 0) + 1;
      }
    });
    return Object.entries(dates)
      .map(([date, count]) => ({ date, count, obj: parseSheetDate(date) }))
      .sort((a, b) => (a.obj?.getTime() || 0) - (b.obj?.getTime() || 0))
      .map(item => ({ date: item.date, count: item.count }));
  }, [concerns]);

  const tatData = useMemo(() => {
    const buckets = [
      { name: '0-5 Days', count: 0 },
      { name: '6-10 Days', count: 0 },
      { name: '11-20 Days', count: 0 },
      { name: '21+ Days', count: 0 },
    ];
    concerns.forEach(c => {
      const tat = parseInt(c['TAT'] || '0');
      if (tat <= 5) buckets[0].count++;
      else if (tat <= 10) buckets[1].count++;
      else if (tat <= 20) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  }, [concerns]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      {/* Trend Chart with Filter Tabs */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Intake Analytics</h3>
            <p className="text-xl font-black text-slate-800">Trend Analysis Over Time</p>
          </div>
          
          {/* Chart-Specific Filter Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            {(['All', 'Social Media', 'Board', 'Other'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-white text-[#1a73e8] shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
              />
              <Area type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Smaller Pie & Bar Charts */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Escalation Status</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={8}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Turnaround Performance</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tatData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="count" fill="#1a73e8" radius={[8, 8, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
