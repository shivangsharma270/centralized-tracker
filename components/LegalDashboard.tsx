
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { LegalConcern } from '../types.ts';
import StatCard from './StatCard.tsx';

interface LegalDashboardProps {
  data: LegalConcern[];
}

type DateRangeType = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom';

const COLORS = ['#334155', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const LegalDashboard: React.FC<LegalDashboardProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const parseSheetDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return null;
    
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const yearRaw = parts[2];
      const year = yearRaw.length === 2 ? 2000 + parseInt(yearRaw) : parseInt(yearRaw);
      
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const monthIndex = monthNames.indexOf(monthStr.toLowerCase().substring(0, 3));
      
      if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIndex, day);
      }
    }
    
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!matchesSearch) return false;

      // Primary filter date
      const dateToUse = item['Worked Date'];
      const workedDate = parseSheetDate(dateToUse);
      
      if (workedDate) {
        if (dateRangeType === 'today' && workedDate.toDateString() !== todayDate.toDateString()) return false;
        if (dateRangeType === '7d') {
          const sevenDaysAgo = new Date(todayDate);
          sevenDaysAgo.setDate(todayDate.getDate() - 7);
          if (workedDate < sevenDaysAgo) return false;
        }
        if (dateRangeType === '30d') {
          const thirtyDaysAgo = new Date(todayDate);
          thirtyDaysAgo.setDate(todayDate.getDate() - 30);
          if (workedDate < thirtyDaysAgo) return false;
        }
        if (dateRangeType === 'this_month') {
          if (workedDate.getMonth() !== todayDate.getMonth() || workedDate.getFullYear() !== todayDate.getFullYear()) return false;
        }
        if (dateRangeType === 'custom') {
          if (startDate) {
            const start = new Date(startDate);
            if (workedDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (workedDate > end) return false;
          }
        }
      } else if (dateRangeType !== 'all') {
        return false;
      }

      return true;
    });
  }, [data, searchQuery, dateRangeType, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const closed = filteredData.filter(d => 
      ['closed', 'resolved', 'done', 'solved'].includes(d['Thread Status']?.toLowerCase() || '')
    ).length;
    const wip = filteredData.filter(d => 
      ['wip', 'in progress', 'pending', 'working'].includes(d['Thread Status']?.toLowerCase() || '')
    ).length;
    
    const validTats = filteredData
      .map(d => parseFloat(d['TAT BS Conflilct'] || '0'))
      .filter(t => !isNaN(t) && t >= 0);
    const avgTat = validTats.length > 0 ? (validTats.reduce((a, b) => a + b, 0) / validTats.length).toFixed(1) : '0';

    return { total, closed, wip, avgTat };
  }, [filteredData]);

  const typeData = useMemo(() => {
    const counts = filteredData.reduce((acc: any, d) => {
      const type = d['Type'] || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  }, [filteredData]);

  const trendData = useMemo(() => {
    const timeline: any = {};
    filteredData.forEach(d => {
      const dateStr = d['Worked Date'];
      if (dateStr && dateStr !== '-') {
        timeline[dateStr] = (timeline[dateStr] || 0) + 1;
      }
    });
    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count, obj: parseSheetDate(date) }))
      .sort((a, b) => (a.obj?.getTime() || 0) - (b.obj?.getTime() || 0))
      .map(item => ({ date: item.date, count: item.count }));
  }, [filteredData]);

  const renderStatusBadge = (status: string) => {
    if (!status || status === '-') return <span className="text-slate-300">—</span>;
    const s = status.toLowerCase();
    let base = "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight whitespace-nowrap ";
    if (['closed', 'resolved', 'done', 'solved'].includes(s)) return <span className={base + "bg-emerald-100 text-emerald-700"}>Closed</span>;
    if (['wip', 'in progress', 'pending', 'working'].includes(s)) return <span className={base + "bg-amber-100 text-amber-700"}>WIP</span>;
    return <span className={base + "bg-slate-100 text-slate-500"}>{status}</span>;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Threads" value={stats.total} icon="fa-gavel" color="bg-slate-800" />
        <StatCard label="Resolved" value={stats.closed} icon="fa-check-circle" color="bg-emerald-500" />
        <StatCard label="WIP" value={stats.wip} icon="fa-clock" color="bg-amber-500" />
        <StatCard label="Avg TAT (Days)" value={`${stats.avgTat}d`} icon="fa-stopwatch" color="bg-indigo-500" />
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-slate-200 shadow-sm mb-10 flex flex-col xl:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full md:w-auto">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Selection</h3>
          <p className="text-xl font-black text-slate-800">Operational Inflow Analytics</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
           <div className="relative w-full sm:w-auto">
              <select 
                className="w-full sm:w-auto pl-6 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-slate-100 appearance-none shadow-sm min-w-[200px]"
                value={dateRangeType}
                onChange={(e) => setDateRangeType(e.target.value as DateRangeType)}
              >
                <option value="all">Full History</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">Current Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <i className="fas fa-calendar absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
           </div>

           {dateRangeType === 'custom' && (
             <div className="flex items-center gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-right-4">
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black outline-none focus:ring-2 focus:ring-slate-200" />
               <span className="text-slate-300 font-bold uppercase text-[9px]">To</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black outline-none focus:ring-2 focus:ring-slate-200" />
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inflow Timeline</h3>
              <p className="text-lg font-black text-slate-800">Thread Volume Analysis</p>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-[10px] font-black text-slate-500 uppercase">Worked Date</div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="legalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#334155" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#334155" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{fontSize: '11px', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="count" stroke="#334155" strokeWidth={3} fillOpacity={1} fill="url(#legalGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Type Concentration</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {typeData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/40 gap-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-4">
            <span className="w-2 h-10 bg-slate-800 rounded-full"></span>
            Legal Compliance Log
          </h2>
          <div className="relative group w-full md:w-[350px]">
            <i className="fas fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Search Subject or HOD..."
              className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[700px] no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <thead className="sticky top-0 z-20 bg-[#f8fafc] shadow-sm">
              <tr>
                {[
                  "Worked Date", "HOD Name", "Type", "Intimation Date BS Conflict/PWIM Team", 
                  "Reply By (Date) BS Conflict Team", "TAT BS Conflilct", "Subject", "Thread Status"
                ].map((header) => (
                  <th key={header} className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-0">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <i className="fas fa-folder-open text-5xl"></i>
                      <p className="font-black uppercase text-xs tracking-widest">No matching records found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Worked Date']}</td>
                  <td className="px-6 py-5 text-[11px] font-black text-slate-900 border-r border-slate-50 group-hover:text-slate-700 transition-colors">{d['HOD Name']}</td>
                  <td className="px-6 py-5 border-r border-slate-50">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{d['Type']}</span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Intimation Date BS Conflict/PWIM Team']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Reply By (Date) BS Conflict Team']}</td>
                  <td className="px-6 py-5 text-center border-r border-slate-50">
                    <div className={`w-12 h-12 inline-flex items-center justify-center rounded-2xl font-black text-[11px] border shadow-sm transition-all ${parseFloat(d['TAT BS Conflilct']) > 5 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                       {d['TAT BS Conflilct'] || '0'}d
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[13px] font-bold text-slate-800 border-r border-slate-50 max-w-lg">
                    <p className="line-clamp-2 leading-relaxed">{d['Subject']}</p>
                  </td>
                  <td className="px-6 py-5">{renderStatusBadge(d['Thread Status'])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-10 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredData.length} of {data.length} total entries</p>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase">System Active</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDashboard;
