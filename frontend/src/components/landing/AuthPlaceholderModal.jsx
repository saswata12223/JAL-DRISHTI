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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-[#A5F1F7] rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[rgba(16,42,46,0.08)] flex justify-between items-start bg-[#F7FCFD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A5F1F7] to-[#8BE5EC] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[#102A2E] text-2xl">tsunami</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#102A2E] tracking-tight">Jal Drishti Portal</h3>
              <p className="text-xs text-[#5F777C] font-semibold">Uttarakhand Flood Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5F777C] hover:text-[#102A2E] hover:bg-[#F2FAFB] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[rgba(16,42,46,0.08)] bg-[#F2FAFB]">
          <button
            onClick={() => { setMode('login'); setNotice(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              mode === 'login'
                ? 'text-[#102A2E] border-b-2 border-[#102A2E] bg-white'
                : 'text-[#5F777C] hover:text-[#102A2E]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('signup'); setNotice(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'text-[#102A2E] border-b-2 border-[#102A2E] bg-white'
                : 'text-[#5F777C] hover:text-[#102A2E]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {notice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>{notice}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-[#102A2E] uppercase tracking-wider mb-1.5">
                Authorized Personnel Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[rgba(16,42,46,0.15)] rounded-lg text-[#102A2E] text-xs focus:outline-none focus:border-[#102A2E] font-medium"
              >
                <option value="RESPONDER">Emergency Response Official (USDMA)</option>
                <option value="HYDROLOGIST">Hydrologist / CWC Technical Analyst</option>
                <option value="DISTRICT_OFFICER">District Disaster Mgmt Officer (DDMO)</option>
                <option value="OBSERVER">Authorized Monitoring Observer</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#102A2E] uppercase tracking-wider mb-1.5">
              Official Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#5F777C] text-base">mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@usdma.uk.gov.in"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(16,42,46,0.15)] rounded-lg text-[#102A2E] text-xs placeholder:text-[#5F777C]/60 focus:outline-none focus:border-[#102A2E] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#102A2E] uppercase tracking-wider mb-1.5">
              Access Token / Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#5F777C] text-base">lock</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(16,42,46,0.15)] rounded-lg text-[#102A2E] text-xs placeholder:text-[#5F777C]/60 focus:outline-none focus:border-[#102A2E] font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-[#A5F1F7] hover:bg-[#8BE5EC] text-[#102A2E] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">login</span>
            <span>{mode === 'login' ? 'Authenticate System Login' : 'Register Authorized Account'}</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[rgba(16,42,46,0.1)]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#5F777C] uppercase tracking-widest font-semibold">Or</span>
            <div className="flex-grow border-t border-[rgba(16,42,46,0.1)]"></div>
          </div>

          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full py-2 px-4 bg-[#F2FAFB] hover:bg-[#EAF8FA] border border-[#A5F1F7] text-[#102A2E] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Proceed to Operational Dashboard</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
}
