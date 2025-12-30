
import React, { useState, useEffect, useMemo } from 'react';
import { fetchSheetData } from './utils/csvParser';
import { generateConcernSummary } from './services/geminiService';
import { Concern, AISummary } from './types';
import StatCard from './components/StatCard';
import ChartsSection from './components/ChartsSection';

type DateRangeType = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom';
type MainTabType = 'SocialMedia' | 'Proxy' | 'Legal' | 'Important';

const App: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('SocialMedia');
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date Filtering State
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Tab/Source Filter (Inside Social Media Dashboard)
  const [activeSourceFilter, setActiveSourceFilter] = useState<'All' | 'Social Media' | 'Board' | 'Other'>('All');
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);

  const loadData = async () => {
    setRefreshing(true);
    const { concerns: data, headers: cols } = await fetchSheetData();
    setConcerns(data);
    setHeaders(cols);
    setLastSynced(new Date());
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleGenerateSummary = async () => {
    if (concerns.length === 0) return;
    setSummaryLoading(true);
    const summary = await generateConcernSummary(concerns);
    setAiSummary(summary);
    setSummaryLoading(false);
  };

  const filteredConcerns = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = concerns.filter(c => {
      // Search logic
      const searchableString = Object.values(c).join(' ').toLowerCase();
      const matchesSearch = searchableString.includes(searchQuery.toLowerCase());
      
      // Source filter logic (Specific to the Social Media Dashboard view)
      const sourceRaw = (c['Source'] || '').toLowerCase();
      let matchesSource = true;
      if (activeSourceFilter === 'Social Media') {
        matchesSource = sourceRaw.includes('social media');
      } else if (activeSourceFilter === 'Board') {
        matchesSource = sourceRaw.includes('board') && !sourceRaw.includes('social media');
      } else if (activeSourceFilter === 'Other') {
        matchesSource = !sourceRaw.includes('social media') && !sourceRaw.includes('board');
      }
      
      // Date logic
      let matchesDate = true;
      const ackDate = parseSheetDate(c['Acknowledgement Date']);
      
      if (ackDate) {
        if (dateRangeType === 'today') {
          matchesDate = ackDate.getTime() === today.getTime();
        } else if (dateRangeType === '7d') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          matchesDate = ackDate >= sevenDaysAgo;
        } else if (dateRangeType === '30d') {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          matchesDate = ackDate >= thirtyDaysAgo;
        } else if (dateRangeType === 'this_month') {
          matchesDate = ackDate.getMonth() === today.getMonth() && ackDate.getFullYear() === today.getFullYear();
        } else if (dateRangeType === 'custom') {
          if (startDate) {
            const start = new Date(startDate);
            if (ackDate < start) matchesDate = false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (ackDate > end) matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesSource && matchesDate;
    });

    return filtered.sort((a, b) => {
      const s1Val = a['S no.']?.toString().replace(/[^0-9]/g, '') || '0';
      const s2Val = b['S no.']?.toString().replace(/[^0-9]/g, '') || '0';
      const s1 = parseInt(s1Val, 10);
      const s2 = parseInt(s2Val, 10);
      return s1 - s2;
    });
  }, [concerns, searchQuery, activeSourceFilter, dateRangeType, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filteredConcerns.length;
    const closed = filteredConcerns.filter(c => c['Ticket Status'] === 'Closed').length;
    const wip = filteredConcerns.filter(c => c['Ticket Status'] === 'WIP').length;
    return { total, closed, wip };
  }, [filteredConcerns]);

  const renderBadge = (value: string, type: 'status' | 'source' | 'bs' | 'proxy') => {
    if (!value || value === '-') return <span className="text-slate-300 text-xs">—</span>;
    let base = "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight whitespace-nowrap ";
    if (type === 'status') {
      if (value === 'Closed') return <span className={base + "bg-[#c6efce] text-[#006100]"}>{value}</span>;
      if (value === 'WIP') return <span className={base + "bg-[#ffeb9c] text-[#9c5700]"}>{value}</span>;
    } else if (type === 'source') {
      if (value.toLowerCase().includes('social media')) return <span className={base + "bg-[#f8d7da] text-[#721c24]"}>{value}</span>;
      if (value.toLowerCase().includes('board')) return <span className={base + "bg-[#fff3cd] text-[#856404]"}>{value}</span>;
      if (value.toLowerCase().includes('da/dg')) return <span className={base + "bg-[#d1ecf1] text-[#0c5460]"}>{value}</span>;
    } else if (type === 'bs') {
      if (value === 'BS') return <span className={base + "bg-[#9c0006] text-white"}>{value}</span>;
      if (value === 'Activation') return <span className={base + "bg-[#c6efce] text-[#006100]"}>{value}</span>;
      if (value === 'Paid BS') return <span className={base + "bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb]"}>Paid BS</span>;
      if (value === 'Free BS') return <span className={base + "bg-[#d4edda] text-[#155724]"}>Free BS</span>;
    } else if (type === 'proxy') {
      if (value === 'Yes') return <span className={base + "bg-[#ffc107] text-[#856404]"}>PROXY: YES</span>;
      if (value === 'No') return <span className={base + "bg-slate-100 text-slate-500"}>NO</span>;
    }
    return <span className={base + "bg-slate-100 text-slate-600 border border-slate-200"}>{value}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Tracker Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] pb-20">
      <header className="bg-[#0f172a] border-b border-white/10 shadow-2xl sticky top-0 z-50 py-4 lg:py-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:h-24 items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1a73e8] to-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <i className="fas fa-shield-halved text-xl sm:text-2xl"></i>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight">Centralized Tracker: Buyer's Help Team</h1>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mt-1">Operational Intelligence Dashboard</p>
            </div>
          </div>

          <nav className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 w-full lg:w-auto overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center gap-1 min-w-max px-2 lg:px-0">
              <button 
                onClick={() => setActiveMainTab('SocialMedia')}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 ${activeMainTab === 'SocialMedia' ? 'bg-[#1a73e8] text-white shadow-lg shadow-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <i className="fas fa-chart-line text-[12px] sm:text-[14px]"></i>
                Social Media
              </button>
              <button 
                onClick={() => setActiveMainTab('Proxy')}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 ${activeMainTab === 'Proxy' ? 'bg-[#1a73e8] text-white shadow-lg shadow-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <i className="fas fa-user-shield text-[12px] sm:text-[14px]"></i>
                Proxy
              </button>
              <button 
                onClick={() => setActiveMainTab('Legal')}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 ${activeMainTab === 'Legal' ? 'bg-[#1a73e8] text-white shadow-lg shadow-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <i className="fas fa-gavel text-[12px] sm:text-[14px]"></i>
                Legal
              </button>
              <button 
                onClick={() => setActiveMainTab('Important')}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 ${activeMainTab === 'Important' ? 'bg-[#1a73e8] text-white shadow-lg shadow-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <i className="fas fa-thumbtack text-[12px] sm:text-[14px]"></i>
                Threads
              </button>
            </div>
          </nav>

          <div className="flex items-center justify-between w-full lg:w-auto lg:gap-5">
             <div className="flex flex-col items-start lg:items-end">
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Connection</p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <p className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">Connected</p>
                </div>
             </div>
            <button 
              onClick={loadData}
              disabled={refreshing}
              className={`flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-xl border-2 border-[#1a73e8] text-[#1a73e8] font-black uppercase tracking-widest text-[9px] sm:text-[11px] transition-all bg-transparent ${refreshing ? 'opacity-50' : 'hover:bg-[#1a73e8] hover:text-white shadow-lg shadow-blue-500/10'}`}
            >
              <i className={`fas fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
              {refreshing ? '...' : 'Sync'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {activeMainTab === 'SocialMedia' ? (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-200 mb-8 sm:mb-10 flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-10">
               <div className="flex flex-col gap-2 sm:gap-3 w-full md:w-auto">
                 <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Period Selection</label>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative w-full sm:w-auto">
                      <i className="fas fa-calendar-day absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
                      <select 
                        className="w-full pl-14 pr-12 py-3 sm:py-4 bg-slate-50 border-none rounded-2xl text-[11px] sm:text-xs font-black text-slate-700 focus:ring-4 focus:ring-blue-50 cursor-pointer appearance-none shadow-sm min-w-[200px] transition-all"
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
                          className="flex-1 sm:flex-none bg-slate-50 border-none rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-[11px] sm:text-xs font-black text-slate-600 focus:ring-4 focus:ring-blue-50 shadow-sm"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase shrink-0">To</span>
                        <input 
                          type="date" 
                          className="flex-1 sm:flex-none bg-slate-50 border-none rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-[11px] sm:text-xs font-black text-slate-600 focus:ring-4 focus:ring-blue-50 shadow-sm"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    )}
                 </div>
               </div>

               <div className="h-16 w-px bg-slate-100 hidden md:block"></div>

               <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                  <StatCard label="Total Received" value={stats.total} icon="fa-database" color="bg-slate-900" />
                  <StatCard label="Resolved" value={stats.closed} icon="fa-circle-check" color="bg-[#10b981]" />
                  <StatCard label="WIP Cases" value={stats.wip} icon="fa-hourglass-half" color="bg-[#f59e0b]" />
               </div>
            </div>

            <ChartsSection 
              concerns={filteredConcerns} 
              activeTab={activeSourceFilter} 
              setActiveTab={setActiveSourceFilter} 
            />

            <div className="mt-10 sm:mt-14 flex flex-col xl:flex-row gap-8 sm:gap-12 items-start">
              <div className="flex-1 w-full space-y-8 sm:space-y-10">
                <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
                  <div className="px-6 sm:px-12 py-8 sm:py-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 bg-slate-50/40">
                    <div className="w-full md:w-auto">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3 sm:gap-5">
                        <span className="w-2 sm:w-2.5 h-8 sm:h-10 bg-[#1a73e8] rounded-full shadow-lg shadow-blue-500/20"></span>
                        Escalations List
                      </h2>
                      <p className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 sm:mt-2 ml-5 sm:ml-7">{activeSourceFilter} Filter Active</p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="relative group w-full md:w-[350px]">
                        <i className="fas fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a73e8] transition-colors z-10"></i>
                        <input 
                          type="text" 
                          placeholder="Search records..."
                          className="w-full pl-16 pr-8 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] sm:text-[13px] font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all shadow-sm outline-none"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] sm:max-h-[700px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="sticky top-0 z-20 bg-[#f8fafc] shadow-sm">
                        <tr>
                          <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-24">S#</th>
                          <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Mail Thread / Context</th>
                          <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Ticket Id</th>
                          <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                          <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">TAT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredConcerns.map((c) => (
                          <tr key={c.id} onClick={() => setSelectedConcern(c)} className="group hover:bg-blue-50/40 cursor-pointer transition-all duration-300">
                            <td className="px-6 sm:px-10 py-6 sm:py-10 text-center text-[11px] sm:text-[12px] font-black text-slate-300 group-hover:text-[#1a73e8]">{c['S no.']}</td>
                            <td className="px-6 sm:px-10 py-6 sm:py-10 max-w-lg lg:max-w-2xl">
                              <div className="flex flex-col gap-3 sm:gap-4">
                                 <h4 className="text-[14px] sm:text-[16px] font-black text-slate-800 line-clamp-2 group-hover:text-[#1a73e8] leading-tight transition-colors">{c['Mail Thread']}</h4>
                                 <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                                    {renderBadge(c['BS/Activation'], 'bs')}
                                    {renderBadge(c['Proxy'], 'proxy')}
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg"><i className="fas fa-clock-rotate-left text-slate-300"></i> {c['Acknowledgement Date']}</span>
                                 </div>
                              </div>
                            </td>
                            <td className="px-6 sm:px-10 py-6 sm:py-10 text-center"><span className="text-[10px] sm:text-[11px] font-mono font-black text-slate-600 bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200/50 group-hover:bg-white">{c['Ticket Id'] || 'N/A'}</span></td>
                            <td className="px-6 sm:px-10 py-6 sm:py-10 text-center">{renderBadge(c['Ticket Status'], 'status')}</td>
                            <td className="px-6 sm:px-10 py-6 sm:py-10 text-center">
                               <div className={`text-[11px] sm:text-[12px] font-black inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-sm border transition-all ${Number(c['TAT']) > 15 ? 'bg-rose-50 text-rose-600 border-rose-100 scale-110' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                 {c['TAT'] || '0'}d
                               </div>
                            </td>
                          </tr>
                        ))}
                        {filteredConcerns.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 sm:px-10 py-16 sm:py-20 text-center">
                               <div className="flex flex-col items-center gap-4 text-slate-400">
                                 <i className="fas fa-inbox text-3xl sm:text-4xl opacity-20"></i>
                                 <p className="font-black uppercase tracking-widest text-[9px] sm:text-[11px]">No matching records found</p>
                               </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <aside className="w-full xl:w-[400px] space-y-10 xl:sticky xl:top-28">
                 <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                   <h3 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4 flex items-center gap-4 sm:gap-5">
                     <i className="fas fa-microchip text-blue-400"></i>
                     AI Analyst
                   </h3>
                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 sm:mb-10 border-b border-white/5 pb-4 sm:pb-6">Audit Intelligence</p>
                   {aiSummary ? (
                     <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-700">
                        <div>
                          <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 sm:mb-4">Situational Overview</h4>
                          <p className="text-sm sm:text-base leading-relaxed font-bold text-slate-200">{aiSummary.overview}</p>
                        </div>
                        <button onClick={handleGenerateSummary} className="w-full py-4 sm:py-5 bg-[#1a73e8] text-white rounded-[1.25rem] sm:rounded-[1.5rem] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                          <i className="fas fa-rotate"></i>
                          Recalculate AI
                        </button>
                     </div>
                   ) : (
                     <div className="py-10 sm:py-14 text-center">
                        <p className="text-base sm:text-lg text-slate-300 mb-8 sm:mb-12 font-bold max-w-xs mx-auto">Deep analyze {filteredConcerns.length} audited threads for operational patterns.</p>
                        <button onClick={handleGenerateSummary} disabled={summaryLoading} className="w-full py-4 sm:py-6 bg-white text-[#0f172a] rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.05] disabled:opacity-50 transition-all duration-300">
                          {summaryLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-bolt-lightning text-amber-500"></i>}
                          {summaryLoading ? '...' : 'Activate AI'}
                        </button>
                     </div>
                   )}
                 </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center animate-in fade-in zoom-in duration-700">
             <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 sm:mb-8 text-slate-300 border border-slate-200">
                <i className="fas fa-compass-drafting text-4xl sm:text-5xl"></i>
             </div>
             <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 sm:mb-3 tracking-tight">Module Inactive</h2>
             <p className="text-sm sm:text-base text-slate-500 font-bold max-w-md leading-relaxed px-4">
                The <span className="text-[#1a73e8]">{activeMainTab === 'Proxy' ? 'Proxy Control' : activeMainTab === 'Legal' ? 'Legal Compliance' : 'Thread Priority'}</span> dashboard is currently under structural provision.
             </p>
          </div>
        )}
      </main>

      {selectedConcern && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 sm:px-10 py-6 sm:py-8 bg-[#1a73e8] text-white flex flex-col gap-4 sm:gap-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                   <div className="bg-white/20 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-white/10">
                     ID: {selectedConcern['Ticket Id'] || 'PENDING'}
                   </div>
                   {renderBadge(selectedConcern['Ticket Status'], 'status')}
                </div>
                <button 
                  onClick={() => setSelectedConcern(null)} 
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <i className="fas fa-times text-lg sm:text-xl"></i>
                </button>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight break-words relative z-10">
                {selectedConcern['Mail Thread']}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mb-8 sm:mb-10">
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 block">Source</label>
                    <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                      {renderBadge(selectedConcern['Source'], 'source')}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 block">Date Received</label>
                    <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 sm:gap-4 text-[13px] sm:text-sm font-black text-slate-700 shadow-sm">
                      <i className="fas fa-calendar-check text-[#1a73e8]"></i>
                      {selectedConcern['Acknowledgement Date']}
                    </div>
                  </div>
                </div>
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 block">Status</label>
                    <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                      {renderBadge(selectedConcern['Ticket Status'], 'status')}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 block">Audit TAT</label>
                    <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 sm:gap-4 text-[13px] sm:text-sm font-black text-slate-700 shadow-sm">
                      <i className="fas fa-hourglass-start text-[#1a73e8]"></i>
                      {selectedConcern['TAT'] || '0'} Days
                    </div>
                  </div>
                </div>
              </div>
              <div>
                 <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 block">Resolution Insights</label>
                 <div className="p-6 sm:p-8 bg-slate-50 rounded-[1.5rem] sm:rounded-[2.5rem] text-slate-700 font-bold italic leading-relaxed border border-slate-200 shadow-inner">
                    <p className="text-base sm:text-lg">
                      {selectedConcern['Closing Comment'] && selectedConcern['Closing Comment'] !== '-' 
                        ? selectedConcern['Closing Comment'] 
                        : "Detailed resolution intelligence is pending for this thread."}
                    </p>
                 </div>
              </div>
            </div>
            <div className="px-6 sm:px-10 py-6 sm:py-8 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setSelectedConcern(null)} 
                className="w-full sm:w-auto bg-slate-900 text-white px-8 sm:px-12 py-3.5 sm:py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] shadow-xl hover:bg-black transition-all hover:scale-105 active:scale-95"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
