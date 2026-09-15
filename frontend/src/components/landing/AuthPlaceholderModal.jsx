import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPlaceholderModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RESPONDER');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotice('Authentication backend placeholder: Access granted for local demonstration.');
    setTimeout(() => {
      onClose();
      navigate('/dashboard');
    }, 1200);
  };

  const handleGuestAccess = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F4C81]/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-[#F8FAFC] border border-[#0F4C81]/30 rounded-xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#0F4C81] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#8FD3E8]/20 border border-[#8FD3E8]/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#8FD3E8] text-xl">tsunami</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight uppercase">Jal Drishti Portal</h3>
              <p className="text-[11px] text-[#8FD3E8] font-medium">Uttarakhand Flood Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#E2E8F0] bg-white">
          <button
            onClick={() => { setMode('login'); setNotice(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              mode === 'login'
                ? 'text-[#0F4C81] border-b-2 border-[#0F4C81] bg-[#F8FAFC]'
                : 'text-[#64748B] hover:text-[#0F4C81]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('signup'); setNotice(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'text-[#0F4C81] border-b-2 border-[#0F4C81] bg-[#F8FAFC]'
                : 'text-[#64748B] hover:text-[#0F4C81]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#F8FAFC]">
          {notice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>{notice}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1">
                Authorized Personnel Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#0F4C81] font-medium"
              >
                <option value="RESPONDER">Emergency Response Official (USDMA)</option>
                <option value="HYDROLOGIST">Hydrologist / CWC Technical Analyst</option>
                <option value="DISTRICT_OFFICER">District Disaster Mgmt Officer (DDMO)</option>
                <option value="OBSERVER">Authorized Monitoring Observer</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1">
              Official Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748B] text-base">mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@usdma.uk.gov.in"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F4C81] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1">
              Access Token / Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748B] text-base">lock</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F4C81] font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">login</span>
            <span>{mode === 'login' ? 'Authenticate System Login' : 'Register Authorized Account'}</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#64748B] uppercase tracking-widest font-semibold">Or</span>
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
          </div>

          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full py-2 px-4 bg-white hover:bg-[#F1F5F9] border border-[#0F4C81]/30 text-[#0F4C81] font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Proceed to Operational Dashboard</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
}
