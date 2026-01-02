
import React, { useState, useEffect, useMemo } from 'react';
import { fetchSheetData, GIDS } from './utils/csvParser.ts';
import { HARDCODED_ASSOCIATES } from './associates.ts';
import { Concern, ProxyConcern, LegalConcern, ImportantThread, MainTabType, User } from './types.ts';
import StatCard from './components/StatCard.tsx';
import ChartsSection from './components/ChartsSection.tsx';
import ProxyDashboard from './components/ProxyDashboard.tsx';
import LegalDashboard from './components/LegalDashboard.tsx';
import ImportantThreadsDashboard from './components/ImportantThreadsDashboard.tsx';
import AISummaryDashboard from './components/AISummaryDashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import Login from './components/Login.tsx';

const encode = (str: string) => btoa(str);
const decode = (str: string) => atob(str);

const ADMIN_CREDENTIALS = {
  empId: "113816",
  password: "123456789"
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('GlobalSummary');
  
  const [socialConcerns, setSocialConcerns] = useState<Concern[]>([]);
  const [proxyConcerns, setProxyConcerns] = useState<ProxyConcern[]>([]);
  const [legalConcerns, setLegalConcerns] = useState<LegalConcern[]>([]);
  const [importantThreads, setImportantThreads] = useState<ImportantThread[]>([]);
  
  const [socialLoading, setSocialLoading] = useState(false);
  const [proxyLoading, setProxyLoading] = useState(false);
  const [legalLoading, setLegalLoading] = useState(false);
  const [importantLoading, setImportantLoading] = useState(false);
  
  const [socialError, setSocialError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [activeSourceFilter, setActiveSourceFilter] = useState<'All' | 'Social Media' | 'Board' | 'Other'>('All');
  const [selectedSocialConcern, setSelectedSocialConcern] = useState<Concern | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('dashly_session');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('dashly_session');
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && !currentUser.permissions.includes(activeMainTab)) {
      setActiveMainTab(currentUser.permissions[0] || 'GlobalSummary');
    }
  }, [currentUser, activeMainTab]);

  useEffect(() => {
    if (currentUser) loadAllData();
  }, [currentUser]);

  const handleLogin = (empId: string, pass: string) => {
    // 1. Hardcoded Admin check
    if (empId === ADMIN_CREDENTIALS.empId && pass === ADMIN_CREDENTIALS.password) {
      const admin: User = {
        empId,
        passwordHash: encode(pass),
        name: "Super Admin",
        role: 'admin',
        permissions: ['GlobalSummary', 'SocialMedia', 'Proxy', 'Legal', 'Important', 'AdminPanel']
      };
      setCurrentUser(admin);
      localStorage.setItem('dashly_session', JSON.stringify(admin));
      return true;
    }
    
    // 2. Hardcoded Associates check (Persistence in App Code)
    const hcMatch = HARDCODED_ASSOCIATES.find(a => a.empId === empId && decode(a.passwordHash) === pass);
    if (hcMatch) {
      setCurrentUser(hcMatch);
      localStorage.setItem('dashly_session', JSON.stringify(hcMatch));
      return true;
    }

    // 3. Local Browser Associates check
    const localAssociates: User[] = JSON.parse(localStorage.getItem('dashly_associates') || '[]');
    const localMatch = localAssociates.find(a => a.empId === empId && decode(a.passwordHash) === pass);
    if (localMatch) {
      setCurrentUser(localMatch);
      localStorage.setItem('dashly_session', JSON.stringify(localMatch));
      return true;
    }
    
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dashly_session');
  };

  const loadAllData = async () => {
    setRefreshing(true);
    await Promise.all([loadSocialData(), loadProxyData(), loadLegalData(), loadImportantThreads()]);
    setRefreshing(false);
  };

  const loadSocialData = async () => {
    setSocialLoading(true);
    setSocialError(null);
    try {
      const res = await fetchSheetData<Concern>(GIDS.SOCIAL_MEDIA);
      setSocialConcerns(res.data);
    } catch (err: any) { setSocialError(err.message); }
    finally { setSocialLoading(false); }
  };

  const loadProxyData = async () => {
    setProxyLoading(true);
    try {
      const res = await fetchSheetData<ProxyConcern>(GIDS.PROXY_CASES);
      setProxyConcerns(res.data);
    } catch (err) {} finally { setProxyLoading(false); }
  };

  const loadLegalData = async () => {
    setLegalLoading(true);
    try {
      const res = await fetchSheetData<LegalConcern>(GIDS.LEGAL);
      setLegalConcerns(res.data);
    } catch (err) {} finally { setLegalLoading(false); }
  };

  const loadImportantThreads = async () => {
    setImportantLoading(true);
    try {
      const res = await fetchSheetData<ImportantThread>(GIDS.IMPORTANT_THREADS);
      setImportantThreads(res.data);
    } catch (err) {} finally { setImportantLoading(false); }
  };

  const handleSync = () => {
    if (activeMainTab === 'GlobalSummary') loadAllData();
    else if (activeMainTab === 'SocialMedia') loadSocialData();
    else if (activeMainTab === 'Proxy') loadProxyData();
    else if (activeMainTab === 'Legal') loadLegalData();
    else if (activeMainTab === 'Important') loadImportantThreads();
  };

  const filteredSocialConcerns = useMemo(() => {
    return socialConcerns.filter(c => {
      const searchableString = Object.values(c).join(' ').toLowerCase();
      if (socialSearchQuery && !searchableString.includes(socialSearchQuery.toLowerCase())) return false;
      const sourceRaw = (c['Source'] || '').toLowerCase();
      if (activeSourceFilter === 'Social Media' && !sourceRaw.includes('social media')) return false;
      if (activeSourceFilter === 'Board' && (!sourceRaw.includes('board') || sourceRaw.includes('social media'))) return false;
      if (activeSourceFilter === 'Other' && (sourceRaw.includes('social media') || sourceRaw.includes('board'))) return false;
      return true;
    });
  }, [socialConcerns, socialSearchQuery, activeSourceFilter]);

  const socialStats = useMemo(() => {
    const total = filteredSocialConcerns.length;
    const closed = filteredSocialConcerns.filter(c => c['Ticket Status'] === 'Closed').length;
    const wip = filteredSocialConcerns.filter(c => c['Ticket Status'] === 'WIP').length;
    return { total, closed, wip };
  }, [filteredSocialConcerns]);

  const renderBadge = (value: string, type: 'status' | 'source' | 'bs' | 'proxy') => {
    if (!value || value === '-') return <span className="text-slate-300 text-xs">—</span>;
    let base = "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight whitespace-nowrap ";
    if (type === 'status') {
      if (value === 'Closed') return <span className={base + "bg-[#c6efce] text-[#006100]"}>{value}</span>;
      if (value === 'WIP') return <span className={base + "bg-[#ffeb9c] text-[#9c5700]"}>{value}</span>;
    } else if (type === 'source') {
      if (value.toLowerCase().includes('social media')) return <span className={base + "bg-rose-100 text-rose-700"}>SOCIAL</span>;
      if (value.toLowerCase().includes('board')) return <span className={base + "bg-amber-100 text-amber-700"}>BOARD</span>;
    } else if (type === 'bs') {
      if (value === 'BS') return <span className={base + "bg-rose-600 text-white"}>{value}</span>;
      if (value === 'Activation') return <span className={base + "bg-emerald-100 text-emerald-700"}>ACTV</span>;
    } else if (type === 'proxy') {
      if (value === 'Yes') return <span className={base + "bg-amber-100 text-amber-700"}>PROXY</span>;
      if (value === 'No') return <span className={base + "bg-slate-100 text-slate-500"}>NO</span>;
    }
    return <span className={base + "bg-slate-100 text-slate-600"}>{value}</span>;
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  const allowedTabs = currentUser.permissions;

  return (
    <div className="min-h-screen bg-[#f3f6f9] pb-20">
      <header className="bg-[#0f172a] border-b border-white/10 shadow-2xl sticky top-0 z-50 px-4 sm:px-8 py-6">
        <div className="max-w-[1800px] mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#1a73e8] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0 transform -rotate-3">
                <i className="fas fa-rocket text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tighter italic leading-none mb-1">DASHLY</h1>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Buyer's Help Team Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 border-r border-white/10 pr-6">
                  <div className="text-right">
                    <p className="text-white text-[11px] font-black uppercase leading-none mb-1.5">{currentUser.name}</p>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">{currentUser.empId}</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-xs uppercase shadow-inner">
                    {currentUser.name.substring(0,1)}
                  </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSync} disabled={refreshing} className="h-11 px-6 flex items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-widest">
                    <i className={`fas fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
                    <span>Refresh</span>
                </button>
                <button onClick={handleLogout} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                    <i className="fas fa-power-off"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <nav className="flex items-center bg-white/5 p-1.5 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar shadow-lg">
              <div className="flex items-center gap-2 px-1">
                {allowedTabs.includes('GlobalSummary') && (
                  <button onClick={() => setActiveMainTab('GlobalSummary')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 ${activeMainTab === 'GlobalSummary' ? 'bg-[#1a73e8] text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-bolt text-xs"></i> AI Summary
                  </button>
                )}
                {allowedTabs.includes('SocialMedia') && (
                  <button onClick={() => setActiveMainTab('SocialMedia')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 ${activeMainTab === 'SocialMedia' ? 'bg-[#1a73e8] text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-chart-line text-xs"></i> Social Media
                  </button>
                )}
                {allowedTabs.includes('Proxy') && (
                  <button onClick={() => setActiveMainTab('Proxy')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 ${activeMainTab === 'Proxy' ? 'bg-[#6366f1] text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-user-secret text-xs"></i> Proxy Cases
                  </button>
                )}
                {allowedTabs.includes('Legal') && (
                  <button onClick={() => setActiveMainTab('Legal')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 ${activeMainTab === 'Legal' ? 'bg-[#334155] text-white shadow-xl shadow-slate-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-gavel text-xs"></i> Legal Compliance
                  </button>
                )}
                {allowedTabs.includes('Important') && (
                  <button onClick={() => setActiveMainTab('Important')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 ${activeMainTab === 'Important' ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-thumbtack text-xs"></i> Priority Threads
                  </button>
                )}
                {currentUser.role === 'admin' && allowedTabs.includes('AdminPanel') && (
                  <button onClick={() => setActiveMainTab('AdminPanel')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 ${activeMainTab === 'AdminPanel' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <i className="fas fa-users-cog text-xs"></i> IAM Admin
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-8 pt-10">
        {activeMainTab === 'GlobalSummary' && (
           <AISummaryDashboard social={socialConcerns} proxy={proxyConcerns} legal={legalConcerns} important={importantThreads} loading={socialLoading || proxyLoading || legalLoading || importantLoading} />
        )}
        {activeMainTab === 'SocialMedia' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             {socialError ? (
               <div className="bg-white p-12 rounded-[2.5rem] border border-rose-100 shadow-xl text-center">
                 <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i className="fas fa-exclamation-triangle"></i></div>
                 <h3 className="text-xl font-black text-slate-800 mb-2">Sync Interrupted</h3>
                 <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">{socialError}</p>
                 <button onClick={loadSocialData} className="bg-[#1a73e8] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Reconnect</button>
               </div>
             ) : (
               <>
                 <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-slate-200 mb-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <StatCard label="Total Audit Inflow" value={socialStats.total} icon="fa-database" color="bg-slate-900" />
                        <StatCard label="Resolution Finalized" value={socialStats.closed} icon="fa-circle-check" color="bg-emerald-500" />
                        <StatCard label="Audit WIP" value={socialStats.wip} icon="fa-hourglass-half" color="bg-amber-500" />
                    </div>
                  </div>
                  <ChartsSection concerns={filteredSocialConcerns} activeTab={activeSourceFilter} setActiveTab={setActiveSourceFilter} />
                  
                  <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden mt-12">
                     <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/40 gap-6">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4"><span className="w-2.5 h-10 bg-[#1a73e8] rounded-full shadow-lg"></span>Social Audit Repository</h2>
                        </div>
                        <input type="text" placeholder="Search Threads..." className="w-full md:w-[400px] pl-6 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" value={socialSearchQuery} onChange={e => setSocialSearchQuery(e.target.value)} />
                     </div>
                     <div className="overflow-x-auto max-h-[700px] no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                          <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                             <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">S#</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mail Thread</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ticket</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {filteredSocialConcerns.map(c => (
                               <tr key={c.id} onClick={() => setSelectedSocialConcern(c)} className="hover:bg-blue-50/30 cursor-pointer transition-all group">
                                  <td className="px-10 py-8 text-[11px] font-black text-slate-300 group-hover:text-blue-600">{c['S no.']}</td>
                                  <td className="px-10 py-8 max-w-xl"><h4 className="text-[15px] font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600">{c['Mail Thread']}</h4></td>
                                  <td className="px-10 py-8 text-center"><span className="text-[11px] font-mono font-black text-slate-600 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">{c['Ticket Id'] || 'N/A'}</span></td>
                                  <td className="px-10 py-8 text-center">{renderBadge(c['Ticket Status'], 'status')}</td>
                               </tr>
                             ))}
                          </tbody>
                        </table>
                     </div>
                  </div>
               </>
             )}
          </div>
        )}
        {activeMainTab === 'Proxy' && <ProxyDashboard data={proxyConcerns} />}
        {activeMainTab === 'Legal' && <LegalDashboard data={legalConcerns} />}
        {activeMainTab === 'Important' && <ImportantThreadsDashboard data={importantThreads} />}
        {activeMainTab === 'AdminPanel' && currentUser.role === 'admin' && <AdminPanel />}
      </main>

      {selectedSocialConcern && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-10 py-8 bg-[#1a73e8] text-white">
              <div className="flex justify-between items-start mb-4">
                 <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase border border-white/10">ID: {selectedSocialConcern['Ticket Id'] || 'PENDING'}</span>
                 <button onClick={() => setSelectedSocialConcern(null)} className="text-white/60 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
              </div>
              <h3 className="text-2xl font-black leading-tight pr-10">{selectedSocialConcern['Mail Thread']}</h3>
            </div>
            <div className="p-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto no-scrollbar">
               <div className="p-8 bg-slate-50 rounded-[1.5rem] text-slate-700 font-bold italic border border-slate-100 shadow-inner">
                 {selectedSocialConcern['Closing Comment'] || 'Final commentary pending.'}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
