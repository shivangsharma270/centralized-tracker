
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { ProxyConcern } from '../types';
import StatCard from './StatCard';

interface ProxyDashboardProps {
  data: ProxyConcern[];
}

type DateRangeType = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const ProxyDashboard: React.FC<ProxyDashboardProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedConcern, setSelectedConcern] = useState<ProxyConcern | null>(null);

  const parseSheetDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return null;
    
    // Handle DD-MMM-YY
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
    
    // Fallback for other standard formats
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter(item => {
      // 1. Search filter
      const matchesSearch = Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!matchesSearch) return false;

      // 2. Date filter
      const ackDate = parseSheetDate(item['Acknowledgement Date']);
      if (ackDate) {
        if (dateRangeType === 'today' && ackDate.toDateString() !== todayDate.toDateString()) return false;
        if (dateRangeType === '7d') {
          const sevenDaysAgo = new Date(todayDate);
          sevenDaysAgo.setDate(todayDate.getDate() - 7);
          if (ackDate < sevenDaysAgo) return false;
        }
        if (dateRangeType === '30d') {
          const thirtyDaysAgo = new Date(todayDate);
          thirtyDaysAgo.setDate(todayDate.getDate() - 30);
          if (ackDate < thirtyDaysAgo) return false;
        }
        if (dateRangeType === 'this_month') {
          if (ackDate.getMonth() !== todayDate.getMonth() || ackDate.getFullYear() !== todayDate.getFullYear()) return false;
        }
        if (dateRangeType === 'custom') {
          if (startDate) {
            const start = new Date(startDate);
            if (ackDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (ackDate > end) return false;
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
    const introYes = filteredData.filter(d => d['Introduction Found']?.toLowerCase() === 'yes').length;
    const associates = new Set(filteredData.map(d => d['Owner']).filter(Boolean)).size;

    return { total, introYes, associates };
  }, [filteredData]);

  const associateData = useMemo(() => {
    const counts = filteredData.reduce((acc: any, d) => {
      const owner = d['Owner'] || 'Unassigned';
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const statusMix = useMemo(() => {
    const counts = filteredData.reduce((acc: any, d) => {
      const status = d['Status'] || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const introMix = useMemo(() => {
    const counts = filteredData.reduce((acc: any, d) => {
      const key = d['Introduction Found']?.toLowerCase() === 'yes' ? 'Found' : 'Not Found';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const trendData = useMemo(() => {
    const timeline: any = {};
    filteredData.forEach(d => {
      const dateStr = d['Acknowledgement Date'];
      if (dateStr && dateStr !== '-') {
        timeline[dateStr] = (timeline[dateStr] || 0) + 1;
      }
    });
    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count, obj: parseSheetDate(date) }))
      .sort((a, b) => (a.obj?.getTime() || 0) - (b.obj?.getTime() || 0))
      .map(item => ({ date: item.date, count: item.count }));
  }, [filteredData]);

  const renderTableCell = (val: any) => {
    if (!val || val === '-') return <span className="text-slate-300">—</span>;
    if (val.toString().startsWith('http')) {
      return (
        <a href={val} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold" onClick={(e) => e.stopPropagation()}>
          <i className="fas fa-external-link-alt text-[10px]"></i> View
        </a>
      );
    }
    return val;
  };

  const renderPopupBadge = (label: string, value: string, icon: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5 text-[11px] font-black text-slate-700 shadow-sm">
        <i className={`fas ${icon} text-indigo-500 w-4`}></i>
        <span className="truncate">{value || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard label="Proxy Cases" value={stats.total} icon="fa-user-secret" color="bg-indigo-600" />
        <StatCard label="Active Associates" value={stats.associates} icon="fa-id-badge" color="bg-violet-600" />
        <StatCard label="Intro Verified" value={stats.introYes} icon="fa-check-double" color="bg-emerald-500" />
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-slate-200 shadow-sm mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full md:w-auto">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Tracking</h3>
            <p className="text-xl font-black text-slate-800">Identify Cases Between Dates</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <div className="relative w-full sm:w-auto">
                <select 
                  className="w-full pl-6 pr-12 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] sm:text-xs font-black text-slate-700 focus:ring-4 focus:ring-indigo-100 cursor-pointer appearance-none shadow-sm min-w-[200px]"
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
                <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[11px]"></i>
             </div>

             {dateRangeType === 'custom' && (
               <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto animate-in fade-in zoom-in duration-300">
                  <input 
                    type="date" 
                    className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">To</span>
                  <input 
                    type="date" 
                    className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proxy Trend</h3>
            <p className="text-xl font-black text-slate-800">Operational Inflow</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="proxyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#proxyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Verification Ratio</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={introMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {introMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Found' ? '#10b981' : '#f43f5e'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Case Status Analysis</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusMix.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Associates KPIs</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={associateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/40 gap-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-4">
            <span className="w-2 h-10 bg-indigo-500 rounded-full"></span>
            Proxy Cases Registry
          </h2>
          <div className="relative group w-full md:w-[350px]">
            <i className="fas fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search all fields..."
              className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[700px] no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[3500px]">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
              <tr>
                {[
                  "S no.", "Acknowledgement Date", "Owner", "Ticket ID", "Defendant GLID", 
                  "Defendant Mobile", "BS Complaints", "Unresolved BS Complaints", "Complainant GLID", 
                  "Introduction Found", "MM Seller GLID", "MM Date", "Suspected Seller GLID", 
                  "Product", "Dispute Amount", "Complaint Type", "Called Buyers", "Called Seller", 
                  "Case Study Thread", "Document Link", "Additional Mobile, UPI or other details", 
                  "Status", "Reason", "Case Study(RCA) Sheet Link"
                ].map((header) => (
                  <th key={header} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-0">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={24} className="px-6 py-20 text-center text-slate-400 font-bold">
                    No matching records found.
                  </td>
                </tr>
              ) : filteredData.map((d) => (
                <tr key={d.id} onClick={() => setSelectedConcern(d)} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                  <td className="px-6 py-5 text-xs font-black text-slate-300 border-r border-slate-50 group-hover:text-indigo-600">{d['S no.']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-600 border-r border-slate-50">{d['Acknowledgement Date']}</td>
                  <td className="px-6 py-5 border-r border-slate-50">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase border border-indigo-100">{d['Owner']}</span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-mono font-bold text-slate-900 border-r border-slate-50">{d['Ticket ID']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Defendant GLID']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Defendant Mobile']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-900 border-r border-slate-50">{d['BS Complaints']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Unresolved BS Complaints']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Complainant GLID']}</td>
                  <td className="px-6 py-5 text-center border-r border-slate-50">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight ${d['Introduction Found']?.toLowerCase() === 'yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {d['Introduction Found'] || 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['MM Seller GLID']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['MM Date']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Suspected Seller GLID']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Product']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-indigo-600 border-r border-slate-50">{d['Dispute Amount']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Complaint Type']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Called Buyers']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Called Seller']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold border-r border-slate-50 max-w-xs truncate">{d['Case Study Thread']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold border-r border-slate-50">{renderTableCell(d['Document Link'])}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50 max-w-sm truncate">{d['Additional Mobile, UPI or other details']}</td>
                  <td className="px-6 py-5 border-r border-slate-50">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight ${d['Status']?.toLowerCase() === 'solved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {d['Status']}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50 max-w-xs truncate">{d['Reason']}</td>
                  <td className="px-6 py-5 text-[11px] font-bold border-r border-slate-50">{renderTableCell(d['Case Study(RCA) Sheet Link'])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proxy Details Popup */}
      {selectedConcern && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 sm:px-10 py-6 sm:py-8 bg-indigo-600 text-white flex flex-col gap-3 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                    ID: {selectedConcern['Ticket ID'] || 'N/A'}
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${selectedConcern['Status']?.toLowerCase() === 'solved' ? 'bg-emerald-400/20 border-emerald-400 text-emerald-100' : 'bg-amber-400/20 border-amber-400 text-amber-100'}`}>
                    {selectedConcern['Status'] || 'Unknown'}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedConcern(null)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
              <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tight break-words relative z-10">
                Proxy Case: {selectedConcern['Ticket ID'] || 'Investigation Record'}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 relative z-10">Full Case Investigation Record</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white space-y-8">
              {/* Primary Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {renderPopupBadge('Associate Owner', selectedConcern['Owner'], 'fa-user-tie')}
                {renderPopupBadge('Acknowledgement', selectedConcern['Acknowledgement Date'], 'fa-calendar')}
                {renderPopupBadge('Product', selectedConcern['Product'], 'fa-box')}
                {renderPopupBadge('Dispute Amount', selectedConcern['Dispute Amount'], 'fa-indian-rupee-sign')}
              </div>

              {/* Parties Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <i className="fas fa-user-shield text-indigo-500"></i> Defendant Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       {renderPopupBadge('GLID', selectedConcern['Defendant GLID'], 'fa-fingerprint')}
                       {renderPopupBadge('Mobile', selectedConcern['Defendant Mobile'], 'fa-phone')}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <i className="fas fa-user-tag text-indigo-500"></i> Complainant Information
                    </h4>
                    <div className="grid grid-cols-1">
                       {renderPopupBadge('Complainant GLID', selectedConcern['Complainant GLID'], 'fa-id-card')}
                    </div>
                 </div>
              </div>

              {/* Investigation details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                {renderPopupBadge('BS Complaints', selectedConcern['BS Complaints'], 'fa-triangle-exclamation')}
                {renderPopupBadge('Unresolved BS', selectedConcern['Unresolved BS Complaints'], 'fa-hourglass-half')}
                {renderPopupBadge('Intro Found', selectedConcern['Introduction Found'], 'fa-magnifying-glass-location')}
              </div>

              {/* MM Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                {renderPopupBadge('MM Seller GLID', selectedConcern['MM Seller GLID'], 'fa-shop')}
                {renderPopupBadge('MM Date', selectedConcern['MM Date'], 'fa-calendar-day')}
                {renderPopupBadge('Suspected Seller', selectedConcern['Suspected Seller GLID'], 'fa-user-secret')}
              </div>

              {/* Narrative / Context */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason / Verdict</label>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-bold italic leading-relaxed shadow-inner">
                        {selectedConcern['Reason'] || 'No reason provided.'}
                      </div>
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Additional Details</label>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-medium leading-relaxed">
                        {selectedConcern['Additional Mobile, UPI or other details'] || 'None recorded.'}
                      </div>
                   </div>
                </div>
              </div>

              {/* External Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Case Thread</label>
                    {renderTableCell(selectedConcern['Case Study Thread'])}
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Link</label>
                    {renderTableCell(selectedConcern['Document Link'])}
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RCA Link</label>
                    {renderTableCell(selectedConcern['Case Study(RCA) Sheet Link'])}
                 </div>
              </div>
            </div>
            
            <div className="px-6 sm:px-10 py-6 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedConcern(null)} 
                className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
              >
                Close Case Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyDashboard;
