
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (empId: string, pass: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    setTimeout(() => {
      const success = onLogin(empId, password);
      if (!success) {
        setError(true);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl relative z-10 p-10 animate-login">
        <div className="text-center mb-10">
           <div className="w-20 h-20 bg-gradient-to-br from-[#6366f1] to-[#1a73e8] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-500/20 transform -rotate-6">
              <i className="fas fa-rocket text-3xl"></i>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic mb-2">DASHLY</h1>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Buyer's Help Team Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee Identifier</label>
              <div className="relative group">
                 <i className="fas fa-id-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                 <input 
                    type="text" 
                    required 
                    placeholder="Enter ID"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Access Key</label>
              <div className="relative group">
                 <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                 <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                 />
              </div>
           </div>

           {error && (
             <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <i className="fas fa-exclamation-circle text-rose-500"></i>
                <p className="text-rose-600 text-[11px] font-black uppercase tracking-tight">Access Denied. Check Credentials.</p>
             </div>
           )}

           <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-[#0f172a] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
           >
              {loading ? (
                 <i className="fas fa-circle-notch animate-spin"></i>
              ) : (
                 <>
                    <i className="fas fa-shield-halved"></i>
                    Initialize Session
                 </>
              )}
           </button>
        </form>

        <div className="mt-12 text-center pt-8 border-t border-slate-50">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
              Internal Registry Access
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
