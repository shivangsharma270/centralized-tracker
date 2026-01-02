
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { ImportantThread } from '../types.ts';
import StatCard from './StatCard.tsx';

interface ImportantThreadsDashboardProps {
  data: ImportantThread[];
}

type DateRangeType = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom';

const COLORS = ['#1a73e8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const ImportantThreadsDashboard: React.FC<ImportantThreadsDashboardProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showOverdueModal, setShowOverdueModal] = useState(false);

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
      if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) return new Date(year, monthIndex, day);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const teams = useMemo(() => {
    const set = new Set(data.map(d => d['Team']).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [data]);

  const owners = useMemo(() => {
    const set = new Set(data.map(d => d['Owner']).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [data]);

  const statuses = useMemo(() => {
    const set = new Set(data.map(d => d['Status']).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [data]);

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!matchesSearch) return false;

      if (teamFilter !== 'All' && item['Team'] !== teamFilter) return false;
      if (ownerFilter !== 'All' && item['Owner'] !== ownerFilter) return false;
      if (statusFilter !== 'All' && item['Status'] !== statusFilter) return false;

      const dateToUse = item['Start Date'];
      const started = parseSheetDate(dateToUse);
      if (started) {
        if (dateRangeType === 'today' && started.toDateString() !== todayDate.toDateString()) return false;
        if (dateRangeType === '7d') {
          const sevenDaysAgo = new Date(todayDate);
          sevenDaysAgo.setDate(todayDate.getDate() - 7);
          if (started < sevenDaysAgo) return false;
        }
        if (dateRangeType === '30d') {
          const thirtyDaysAgo = new Date(todayDate);
          thirtyDaysAgo.setDate(todayDate.getDate() - 30);
          if (started < thirtyDaysAgo) return false;
        }
        if (dateRangeType === 'this_month') {
          if (started.getMonth() !== todayDate.getMonth() || started.getFullYear() !== todayDate.getFullYear()) return false;
        }
        if (dateRangeType === 'custom') {
          if (startDate && started < new Date(startDate)) return false;
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (started > end) return false;
          }
        }
      } else if (dateRangeType !== 'all') {
        return false;
      }

      return true;
    });
  }, [data, searchQuery, teamFilter, ownerFilter, statusFilter, dateRangeType, startDate, endDate]);

  const overdueItems = useMemo(() => {
    const now = new Date();
    return filteredData.filter(d => {
      const edd = parseSheetDate(d['EDD - Closure']);
      const isClosed = ['closed', 'resolved', 'done', 'completed'].includes(d['Status']?.toLowerCase() || '');
      return edd && edd < now && !isClosed;
    });
  }, [filteredData]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const closed = filteredData.filter(d => ['closed', 'resolved', 'done', 'completed'].includes(d['Status']?.toLowerCase() || '')).length;
    const wip = filteredData.filter(d => ['wip', 'in progress', 'working'].includes(d['Status']?.toLowerCase() || '')).length;
    const overdue = overdueItems.length;

    return { total, closed, wip, overdue };
  }, [filteredData, overdueItems]);

  const teamData = useMemo(() => {
    const counts = filteredData.reduce((acc: any, d) => {
      const team = d['Team'] || 'Unknown';
      acc[team] = (acc[team] || 0) + 1;
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

  const renderBadge = (value: string, type: 'status' | 'team') => {
    if (!value || value === '-') return <span className="text-slate-300">—</span>;
    let base = "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight whitespace-nowrap ";
    if (type === 'status') {
      const s = value.toLowerCase();
      if (['closed', 'resolved', 'done', 'completed'].includes(s)) return <span className={base + "bg-emerald-100 text-emerald-700"}>{value}</span>;
      if (['wip', 'in progress', 'working'].includes(s)) return <span className={base + "bg-amber-100 text-amber-700"}>{value}</span>;
      if (['pending', 'to do'].includes(s)) return <span className={base + "bg-blue-100 text-blue-700"}>{value}</span>;
    } else if (type === 'team') {
      return <span className={base + "bg-slate-100 text-slate-600 border border-slate-200"}>{value}</span>;
    }
    return <span className={base + "bg-slate-50 text-slate-500"}>{value}</span>;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Priority Threads" value={stats.total} icon="fa-thumbtack" color="bg-[#1a73e8]" />
        <StatCard label="Resolved Tasks" value={stats.closed} icon="fa-check-double" color="bg-emerald-500" />
        <StatCard label="In Progress" value={stats.wip} icon="fa-spinner" color="bg-amber-500" />
        <div 
          onClick={() => stats.overdue > 0 && setShowOverdueModal(true)} 
          className={stats.overdue > 0 ? 'cursor-pointer transform hover:scale-[1.02] transition-all' : ''}
        >
          <StatCard label="Overdue Items" value={stats.overdue} icon="fa-triangle-exclamation" color="bg-rose-500" />
          {stats.overdue > 0 && (
            <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center mt-[-15px] animate-pulse">
              Click to View Details
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm mb-10">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Search</h3>
            <div className="relative group">
              <i className="fas fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a73e8] transition-colors"></i>
              <input 
                type="text" 
                placeholder="Search subjects, tasks..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 xl:col-span-3">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Filter</h3>
              <select 
                className="w-full pl-6 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Owner Filter</h3>
              <select 
                className="w-full pl-6 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
              >
                {owners.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Filter</h3>
              <select 
                className="w-full pl-6 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="xl:col-span-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeline Range</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                className="flex-1 pl-6 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm"
                value={dateRangeType}
                onChange={(e) => setDateRangeType(e.target.value as DateRangeType)}
              >
                <option value="all">Any Start Date</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Load Distribution by Team</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} width={100} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#1a73e8" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Thread Status Mix</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusMix} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusMix.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/40">
           <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-4">
                <span className="w-2 h-10 bg-[#1a73e8] rounded-full"></span>
                Actionable Threads Registry
              </h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-6">{filteredData.length} Priority Threads Synchronized</p>
           </div>
        </div>

        <div className="overflow-x-auto max-h-[800px] no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
              <tr>
                {[
                  "S. No.", "Threads Subject", "Tasks to be done", "Start Date", 
                  "Team", "Owner", "Status", "EDD - Closure", "Remarks"
                ].map((header) => (
                  <th key={header} className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-0">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                       <i className="fas fa-search-minus text-6xl"></i>
                       <p className="text-sm font-black uppercase tracking-widest">No matching threads in priority scope</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.map((d) => {
                const eddDate = parseSheetDate(d['EDD - Closure']);
                const isOverdue = eddDate && eddDate < new Date() && !['closed', 'resolved', 'done', 'completed'].includes(d['Status']?.toLowerCase() || '');

                return (
                  <tr key={d.id} className={`hover:bg-blue-50/30 transition-colors group ${isOverdue ? 'bg-rose-50/20' : ''}`}>
                    <td className="px-6 py-5 text-[11px] font-black text-slate-300 group-hover:text-blue-600 text-center border-r border-slate-50">{d['S. No.']}</td>
                    <td className="px-6 py-5 border-r border-slate-50 max-w-sm">
                       <p className="text-[13px] font-black text-slate-800 leading-tight line-clamp-2">{d['Threads Subject']}</p>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-50 max-w-md">
                       <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic line-clamp-3">{d['Tasks to be done']}</p>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-500 border-r border-slate-50">{d['Start Date']}</td>
                    <td className="px-6 py-5 border-r border-slate-50">{renderBadge(d['Team'], 'team')}</td>
                    <td className="px-6 py-5 border-r border-slate-50">
                       <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                             {d['Owner']?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-black text-slate-700">{d['Owner']}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-50">{renderBadge(d['Status'], 'status')}</td>
                    <td className="px-6 py-5 border-r border-slate-50">
                       <div className="flex flex-col">
                          <span className={`text-[11px] font-black ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>{d['EDD - Closure']}</span>
                          {isOverdue && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Overdue</span>}
                       </div>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                       <p className="text-[11px] font-medium text-slate-500 line-clamp-2">{d['Remarks'] || '—'}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue Items Modal */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#f8fafc] rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="px-8 sm:px-12 py-8 bg-rose-600 text-white flex flex-col gap-3 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <i className="fas fa-triangle-exclamation text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Overdue Priority Threads</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-200">Critical Attention Required • {overdueItems.length} Items</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowOverdueModal(false)} 
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {overdueItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-200 transition-all group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 group-hover:bg-rose-100 transition-colors"></div>
                    
                    <div className="relative z-10 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase">S. No: {item['S. No.']}</span>
                        <span className="text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                           <i className="fas fa-clock"></i> OVERDUE
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-black text-slate-900 mb-3 leading-tight line-clamp-2">{item['Threads Subject']}</h4>
                      
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tasks Pending</label>
                          <p className="text-[11px] font-bold text-slate-600 italic line-clamp-3 leading-relaxed">{item['Tasks to be done']}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">EDD Closure</label>
                              <span className="text-[11px] font-black text-rose-600">{item['EDD - Closure']}</span>
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Owner</label>
                              <span className="text-[11px] font-black text-slate-700">{item['Owner']}</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-auto">
                       <div className="flex justify-between items-center">
                          {renderBadge(item['Team'], 'team')}
                          {renderBadge(item['Status'], 'status')}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-12 py-8 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button 
                onClick={() => setShowOverdueModal(false)} 
                className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95"
              >
                Close Overdue Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportantThreadsDashboard;
