
import React, { useState, useEffect } from 'react';
import { User, MainTabType } from '../types.ts';
import { HARDCODED_ASSOCIATES } from '../associates.ts';

const decode = (str: string) => atob(str);

const AdminPanel: React.FC = () => {
  // Combined list of Hardcoded + Locally saved users
  const [associates, setAssociates] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState<MainTabType[]>(['GlobalSummary']);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('dashly_associates') || '[]');
    setAssociates([...HARDCODED_ASSOCIATES, ...saved]);
  }, []);

  const saveToLocal = (onlyLocal: User[]) => {
    localStorage.setItem('dashly_associates', JSON.stringify(onlyLocal));
    setAssociates([...HARDCODED_ASSOCIATES, ...onlyLocal]);
  };

  const handleSaveUser = () => {
    if (!newName || !newEmpId || (!editingUser && !newPassword)) {
      alert("Please fill identity fields.");
      return;
    }
    
    const localOnly = JSON.parse(localStorage.getItem('dashly_associates') || '[]');

    if (editingUser) {
      // Check if editing a hardcoded user
      const isHc = HARDCODED_ASSOCIATES.some(a => a.empId === editingUser.empId);
      if (isHc) {
        alert("This user is hardcoded in 'associates.ts'. Please update the file directly or generate new export code.");
      } else {
        const updatedLocal = localOnly.map((a: User) => a.empId === editingUser.empId ? {
          ...a, name: newName, empId: newEmpId,
          passwordHash: newPassword ? btoa(newPassword) : a.passwordHash,
          permissions: newPermissions
        } : a);
        saveToLocal(updatedLocal);
      }
    } else {
      const newUser: User = { empId: newEmpId, passwordHash: btoa(newPassword), name: newName, role: 'associate', permissions: newPermissions };
      saveToLocal([...localOnly, newUser]);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDeleteUser = (empId: string) => {
    if (HARDCODED_ASSOCIATES.some(a => a.empId === empId)) {
      alert("Cannot delete hardcoded system users from UI. Remove from 'associates.ts'.");
      return;
    }
    if (window.confirm('Revoke access for this associate?')) {
      const localOnly = JSON.parse(localStorage.getItem('dashly_associates') || '[]');
      const filtered = localOnly.filter((a: User) => a.empId !== empId);
      saveToLocal(filtered);
    }
  };

  const resetForm = () => {
    setEditingUser(null); setNewName(''); setNewEmpId(''); setNewPassword(''); setNewPermissions(['GlobalSummary']);
  };

  const generateExportCode = () => {
    const localOnly = JSON.parse(localStorage.getItem('dashly_associates') || '[]');
    const all = [...HARDCODED_ASSOCIATES, ...localOnly];
    return `export const HARDCODED_ASSOCIATES: User[] = ${JSON.stringify(all, null, 2)};`;
  };

  const tabs: {id: MainTabType, label: string, icon: string}[] = [
    { id: 'GlobalSummary', label: 'AI Executive Summary', icon: 'fa-bolt' },
    { id: 'SocialMedia', label: 'Social Media Dashboard', icon: 'fa-chart-line' },
    { id: 'Proxy', label: 'Proxy Investigation', icon: 'fa-user-secret' },
    { id: 'Legal', label: 'Legal Compliance', icon: 'fa-gavel' },
    { id: 'Important', label: 'Priority Thread Registry', icon: 'fa-thumbtack' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4 tracking-tighter">
              <span className="w-2.5 h-10 bg-rose-500 rounded-full shadow-lg"></span>
              Identity Management
           </h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-7">Registry Control Panel</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowExport(!showExport)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center gap-3">
            <i className="fas fa-code"></i> Save to Code
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all">
            <i className="fas fa-plus-circle text-rose-500 mr-2"></i> New Associate
          </button>
        </div>
      </div>

      {showExport && (
        <div className="bg-slate-900 text-slate-300 p-10 rounded-[2.5rem] mb-10 relative animate-in zoom-in duration-300">
           <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Persistence Instructions</p>
           <p className="text-sm mb-6 text-slate-400 font-medium">To save these users permanently (so they work "anywhere"), copy the code below and paste it into the <strong>associates.ts</strong> file in your project folder.</p>
           <pre className="bg-black/50 p-6 rounded-2xl overflow-x-auto text-[11px] font-mono border border-white/5 no-scrollbar">
             {generateExportCode()}
           </pre>
           <button onClick={() => setShowExport(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
        </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associate Entity</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Granted Tabs</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {associates.map((a) => (
                 <tr key={a.empId} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${HARDCODED_ASSOCIATES.some(h => h.empId === a.empId) ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                             {a.name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <p className="text-base font-black text-slate-900 leading-none">{a.name}</p>
                                {HARDCODED_ASSOCIATES.some(h => h.empId === a.empId) && <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">Hardcoded</span>}
                             </div>
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{a.empId}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex flex-wrap gap-2">
                          {a.permissions.map(p => (
                            <span key={p} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase border border-blue-100 shadow-sm">
                               {p.replace('GlobalSummary', 'AI').replace('SocialMedia', 'Social').replace('Important', 'Priority')}
                            </span>
                          ))}
                       </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <div className="flex items-center justify-end gap-3">
                          <button onClick={() => { setEditingUser(a); setNewName(a.name); setNewEmpId(a.empId); setNewPermissions(a.permissions); setShowModal(true); }} className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center shadow-sm">
                             <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={() => handleDeleteUser(a.empId)} className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                             <i className="fas fa-trash-alt"></i>
                          </button>
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-white/20">
             <div className="px-12 py-10 bg-[#0f172a] text-white flex justify-between items-center relative">
                <div>
                   <h3 className="text-2xl font-black tracking-tight">{editingUser ? 'Modify Access' : 'Provision Associate'}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry Wizard</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                   <i className="fas fa-times text-xl"></i>
                </button>
             </div>
             
             <div className="p-12 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar bg-white">
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                      <input type="text" placeholder="Name" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 shadow-sm" value={newName} onChange={e => setNewName(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">EMP ID</label>
                      <input type="text" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" value={newEmpId} onChange={e => setNewEmpId(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{editingUser ? 'New Password (Optional)' : 'Access Key'}</label>
                      <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 shadow-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                   </div>
                </div>
                
                <div className="pt-8 border-t border-slate-100">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">Module Entitlements</label>
                   <div className="grid grid-cols-1 gap-3">
                      {tabs.map(t => (
                        <button key={t.id} onClick={() => newPermissions.includes(t.id) ? setNewPermissions(newPermissions.filter(p => p !== t.id)) : setNewPermissions([...newPermissions, t.id])} className={`px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left flex items-center justify-between border-2 transition-all ${newPermissions.includes(t.id) ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                           <span className="flex items-center gap-4"><i className={`fas ${t.icon} w-5 text-center`}></i>{t.label}</span>
                           <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${newPermissions.includes(t.id) ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}><i className={`fas ${newPermissions.includes(t.id) ? 'fa-check' : 'fa-plus'} text-[10px]`}></i></div>
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={handleSaveUser} className="w-full bg-[#0f172a] text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] shadow-2xl hover:bg-black transition-all active:scale-95">
                  {editingUser ? 'Save Changes' : 'Confirm Provisioning'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
