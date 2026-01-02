
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Concern, ProxyConcern, LegalConcern, ImportantThread, GlobalSummary } from '../types.ts';
import StatCard from './StatCard.tsx';
import { generateGlobalExecutiveSummary } from '../services/geminiService.ts';

interface AISummaryDashboardProps {
  social: Concern[];
  proxy: ProxyConcern[];
  legal: LegalConcern[];
  important: ImportantThread[];
  loading: boolean;
}

type DateRangeType = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom';

const COLORS = ['#1a73e8', '#6366f1', '#334155', '#f59e0b'];

const AISummaryDashboard: React.FC<AISummaryDashboardProps> = ({ social, proxy, legal, important, loading }) => {
  const [globalAiSummary, setGlobalAiSummary] = useState<GlobalSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Date Filtering State
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return null;
    
    // Handle DD-MMM-YY or DD-MM-YYYY formats
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const yearRaw = parts[2];
      const year = yearRaw.length === 2 ? 2000 + parseInt(yearRaw) : parseInt(yearRaw);
      
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const monthIndex = isNaN(parseInt(monthStr)) 
        ? monthNames.indexOf(monthStr.toLowerCase().substring(0, 3))
        : parseInt(monthStr) - 1;
      
      if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIndex, day);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filterByDate = (items: any[], dateKey: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return items.filter(item => {
      const itemDate = parseDate(item[dateKey]);
      if (!itemDate) return dateRangeType === 'all';

      if (dateRangeType === 'today') return itemDate.toDateString() === today.toDateString();
      if (dateRangeType === '7d') {
        const diff = today.getTime() - itemDate.getTime();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      }
      if (dateRangeType === '30d') {
        const diff = today.getTime() - itemDate.getTime();
        return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
      }
      if (dateRangeType === 'this_month') {
        return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      }
      if (dateRangeType === 'custom') {
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
        return true;
      }
      return true;
    });
  };

  const filteredSocial = useMemo(() => filterByDate(social, 'Acknowledgement Date'), [social, dateRangeType, startDate, endDate]);
  const filteredProxy = useMemo(() => filterByDate(proxy, 'Acknowledgement Date'), [proxy, dateRangeType, startDate, endDate]);
  const filteredLegal = useMemo(() => filterByDate(legal, 'Worked Date'), [legal, dateRangeType, startDate, endDate]);
  const filteredImportant = useMemo(() => filterByDate(important, 'Start Date'), [important, dateRangeType, startDate, endDate]);

  const stats = useMemo(() => {
    const totalItems = filteredSocial.length + filteredProxy.length + filteredLegal.length + filteredImportant.length;
    
    const socialClosed = filteredSocial.filter(c => c['Ticket Status'] === 'Closed').length;
    const proxySolved = filteredProxy.filter(p => p['Status']?.toLowerCase() === 'solved').length;
    const legalDone = filteredLegal.filter(l => ['closed', 'resolved', 'done', 'solved'].includes(l['Thread Status']?.toLowerCase() || '')).length;
    const importantDone = filteredImportant.filter(i => ['closed', 'resolved', 'done', 'completed'].includes(i['Status']?.toLowerCase() || '')).length;
    
    const totalClosed = socialClosed + proxySolved + legalDone + importantDone;
    const globalResRate = totalItems > 0 ? Math.round((totalClosed / totalItems) * 100) : 0;

    return { totalItems, globalResRate, totalClosed };
  }, [filteredSocial, filteredProxy, filteredLegal, filteredImportant]);

  const volumeDistribution = useMemo(() => [
    { name: 'Social', value: filteredSocial.length },
    { name: 'Proxy', value: filteredProxy.length },
    { name: 'Legal', value: filteredLegal.length },
    { name: 'Important', value: filteredImportant.length },
  ], [filteredSocial, filteredProxy, filteredLegal, filteredImportant]);

  const resolutionComparison = useMemo(() => [
    { 
      name: 'Social', 
      Resolved: filteredSocial.filter(c => c['Ticket Status'] === 'Closed').length,
      WIP: filteredSocial.filter(c => c['Ticket Status'] === 'WIP').length
    },
    { 
      name: 'Proxy', 
      Resolved: filteredProxy.filter(p => p['Status']?.toLowerCase() === 'solved').length,
      WIP: filteredProxy.filter(p => p['Status']?.toLowerCase() !== 'solved').length
    },
    { 
      name: 'Legal', 
      Resolved: filteredLegal.filter(l => ['closed', 'resolved', 'done', 'solved'].includes(l['Thread Status']?.toLowerCase() || '')).length,
      WIP: filteredLegal.filter(l => !['closed', 'resolved', 'done', 'solved'].includes(l['Thread Status']?.toLowerCase() || '')).length
    },
    { 
      name: 'Important', 
      Resolved: filteredImportant.filter(i => ['closed', 'resolved', 'done', 'completed'].includes(i['Status']?.toLowerCase() || '')).length,
      WIP: filteredImportant.filter(i => !['closed', 'resolved', 'done', 'completed'].includes(i['Status']?.toLowerCase() || '')).length
    },
  ], [filteredSocial, filteredProxy, filteredLegal, filteredImportant]);

  const handleGlobalSummary = async () => {
    setAiLoading(true);
    // Pass the filtered data to the AI for a context-aware summary
    const res = await generateGlobalExecutiveSummary(filteredSocial, filteredProxy, filteredLegal, filteredImportant);
    if (res) setGlobalAiSummary(res);
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <i className="fas fa-microchip animate-spin text-4xl mb-4 text-blue-500"></i>
        <p className="text-xs font-black uppercase tracking-widest animate-pulse">Aggregating Global Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Inflow Threads" value={stats.totalItems} icon="fa-layer-group" color="bg-slate-900" />
        <StatCard label="Resolved Actions" value={stats.totalClosed} icon="fa-check-circle" color="bg-emerald-500" />
        <StatCard label="Operational Health" value={`${stats.globalResRate}%`} icon="fa-heart-pulse" color="bg-blue-500" />
      </div>

      {/* Unified Global Date Filter Bar */}
      <div className="bg-white p-6 sm:px-10 sm:py-8 rounded-[2rem] border border-slate-200 shadow-sm mb-10 flex flex-col xl:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full md:w-auto">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Filter Context</h3>
          <p className="text-lg font-black text-slate-800">Analyze Period: <span className="text-blue-600">{dateRangeType.replace('_', ' ').toUpperCase()}</span></p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
           <div className="relative w-full sm:w-auto">
              <select 
                className="w-full sm:w-auto pl-6 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-blue-100 appearance-none shadow-sm min-w-[200px]"
                value={dateRangeType}
                onChange={(e) => {
                    setDateRangeType(e.target.value as DateRangeType);
                    setGlobalAiSummary(null); // Clear summary when filter changes to encourage re-analysis
                }}
              >
                <option value="all">Lifetime History</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">Current Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <i className="fas fa-calendar-alt absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
           </div>

           {dateRangeType === 'custom' && (
             <div className="flex items-center gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-right-4">
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black outline-none focus:ring-2 focus:ring-blue-200" />
               <span className="text-slate-300 font-bold uppercase text-[9px]">To</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black outline-none focus:ring-2 focus:ring-blue-200" />
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        {/* Left: Charts */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Cross-Module Volume Matrix</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#1a73e8" radius={[8, 8, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Execution Efficiency Index</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolutionComparison}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold'}} />
                    <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="WIP" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Right: AI Executive Panel */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <h3 className="text-2xl font-black mb-2 flex items-center gap-4">
              <i className="fas fa-brain text-blue-400"></i>
              Executive AI Briefing
            </h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 border-b border-white/5 pb-4">Consolidated Intelligence Output</p>
            
            {globalAiSummary ? (
               <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context Status:</span>
                     <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg ${
                       globalAiSummary.statusColor === 'green' ? 'bg-emerald-500/20 text-emerald-400' : 
                       globalAiSummary.statusColor === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                     }`}>
                       {globalAiSummary.statusColor.toUpperCase()} ALERT
                     </span>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Executive Summary</h4>
                     <p className="text-sm font-bold leading-relaxed text-slate-200">{globalAiSummary.executiveSummary}</p>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Critical Action Items</h4>
                     {globalAiSummary.keyPriorities.map((p, i) => (
                       <div key={i} className="flex gap-3 items-start bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="w-5 h-5 flex items-center justify-center bg-blue-500 text-[10px] font-black rounded-lg shrink-0">{i+1}</span>
                          <p className="text-[11px] font-bold text-slate-300">{p}</p>
                       </div>
                     ))}
                  </div>

                  <button onClick={handleGlobalSummary} className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/10">
                    Refresh Global Analysis
                  </button>
               </div>
            ) : (
               <div className="py-20 text-center">
                  <p className="text-slate-400 font-bold mb-10 max-w-[200px] mx-auto text-sm">Analyze {stats.totalItems} filtered records across all modules.</p>
                  <button 
                    onClick={handleGlobalSummary}
                    disabled={aiLoading || stats.totalItems === 0}
                    className="w-full py-5 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {aiLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-bolt text-amber-500 mr-2"></i>}
                    {stats.totalItems === 0 ? 'No Data in Range' : 'Generate Executive Brief'}
                  </button>
               </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Resource Intensity Mix</h3>
             <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={volumeDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="value">
                      {volumeDistribution.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISummaryDashboard;
