import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const result = await register(fullName, email, password, confirmPassword);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] animate-fade-in font-sans selection:bg-[#8FD3E8] selection:text-[#0F4C81]">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden mt-8 mb-8">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[#E2E8F0] flex flex-col items-center justify-center bg-[#0F4C81] text-white">
          <Link to="/" className="flex flex-col items-center gap-2 group mb-2 hover:opacity-90 transition-opacity">
             <div className="w-12 h-12 rounded-xl bg-[#8FD3E8]/20 border border-[#8FD3E8]/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
               <span className="material-symbols-outlined text-[#8FD3E8] text-2xl">tsunami</span>
             </div>
             <div className="text-center">
               <h3 className="text-lg font-black text-white tracking-tight uppercase leading-none">Jal Drishti</h3>
               <p className="text-[10px] text-[#8FD3E8] font-bold uppercase tracking-widest mt-1">Flood Intelligence</p>
             </div>
          </Link>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[#0A2540] tracking-tight">Create Account</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">Register for an authorized personnel account.</p>
          </div>

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>Registration successful! Redirecting to login...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-base text-red-600">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748B] text-base">person</span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. R. Sharma"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1.5">
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
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748B] text-base">lock</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748B] text-base">lock</span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-6 py-2.5 px-4 bg-[#0F4C81] hover:bg-[#0B3B66] disabled:bg-[#CBD5E1] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-base">how_to_reg</span>
            )}
            <span>{loading ? 'Processing...' : 'Register Account'}</span>
          </button>

          <div className="mt-6 text-center text-xs font-medium text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0F4C81] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
