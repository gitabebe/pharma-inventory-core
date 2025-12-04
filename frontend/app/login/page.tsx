"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, Info, X, CheckCircle2, ShieldCheck, BarChart3, Users } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState(""); 
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, pass });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_role", response.data.user.role);
      router.push("/");
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    // FIX: Changed 'flex' to 'flex flex-col lg:flex-row' (Stack on mobile, Row on Desktop)
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      
      {/* --- HERO SECTION (TOP on Mobile / LEFT on Desktop) --- */}
      {/* FIX: Removed 'hidden'. Added 'w-full'. Adjusted padding. */}
      <div className="w-full lg:w-1/2 bg-slate-900 text-white flex flex-col justify-center p-8 lg:p-12 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=2069&auto=format&fit=crop')] bg-cover opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500 p-2 lg:p-3 rounded-xl"><Activity className="w-6 h-6 lg:w-8 lg:h-8 text-white" /></div>
            <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">PharmaCore ERP</h1>
          </div>
          
          {/* On mobile, we hide the big text paragraph to save space, show on desktop */}
          <p className="text-sm lg:text-xl text-slate-300 mb-6 lg:mb-8 max-w-lg leading-relaxed">
            The next-generation Enterprise Resource Planning system designed for modern pharmacy chains.
          </p>

          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 mt-1"/>
              <div><h3 className="font-bold text-base lg:text-lg">Role-Based Security</h3><p className="text-slate-400 text-xs lg:text-sm">Strict access control for Admins & HR.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400 mt-1"/>
              <div><h3 className="font-bold text-base lg:text-lg">Advanced Analytics</h3><p className="text-slate-400 text-xs lg:text-sm">Real-time sales tracking & forecasting.</p></div>
            </div>
            {/* Hide 3rd item on very small mobile screens to save vertical space */}
            <div className="hidden sm:flex items-start gap-4">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400 mt-1"/>
              <div><h3 className="font-bold text-base lg:text-lg">Workforce Management</h3><p className="text-slate-400 text-xs lg:text-sm">Complete HR suite for hiring & payroll.</p></div>
            </div>
          </div>
        </div>
        <p className="relative z-10 mt-8 lg:mt-12 text-xs text-slate-500">© 2025 PharmaCore Inc. Enterprise Edition v1.0</p>
      </div>

      {/* --- LOGIN FORM (BOTTOM on Mobile / RIGHT on Desktop) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-slate-50 grow">
        <div className="w-full max-w-md">
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-xl border border-slate-100">
            <div className="mb-6 lg:mb-8 text-center">
               <h2 className="text-xl lg:text-2xl font-bold text-slate-800">Welcome Back</h2>
               <p className="text-slate-500 text-sm mt-1">Please sign in to your enterprise dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@pharmacy.com" className="w-full border border-slate-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" className="w-full border border-slate-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-slate-900 outline-none transition-all" required />
                </div>
              </div>

              {error && <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2"><Info className="w-4 h-4"/> {error}</div>}

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Sign In securely
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setShowHelp(true)} className="text-sm text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center justify-center gap-2 w-full">
                <Info className="w-4 h-4"/> Need Test Credentials?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- HELP MODAL (Same as before) --- */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Info className="w-5 h-5 text-blue-400"/> Test Access Credentials</h3>
              <button onClick={() => setShowHelp(false)} className="hover:bg-slate-700 p-1 rounded"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">Use these accounts to test the different roles in the system. The universal password is <span className="font-mono bg-slate-100 px-1 rounded font-bold">123456</span>.</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => {setEmail('admin@pharmacy.com'); setPass('123456'); setShowHelp(false);}}>
                   <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">AD</div><div><p className="font-bold text-sm">Super Admin</p><p className="text-xs text-slate-500">admin@pharmacy.com</p></div></div>
                   <CheckCircle2 className="w-4 h-4 text-slate-300"/>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => {setEmail('hr@pharmacy.com'); setPass('123456'); setShowHelp(false);}}>
                   <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">HR</div><div><p className="font-bold text-sm">HR Manager</p><p className="text-xs text-slate-500">hr@pharmacy.com</p></div></div>
                   <CheckCircle2 className="w-4 h-4 text-slate-300"/>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => {setEmail('store@pharmacy.com'); setPass('123456'); setShowHelp(false);}}>
                   <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">SM</div><div><p className="font-bold text-sm">Store Manager</p><p className="text-xs text-slate-500">store@pharmacy.com</p></div></div>
                   <CheckCircle2 className="w-4 h-4 text-slate-300"/>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => {setEmail('pharm@pharmacy.com'); setPass('123456'); setShowHelp(false);}}>
                   <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">PH</div><div><p className="font-bold text-sm">Pharmacist</p><p className="text-xs text-slate-500">pharm@pharmacy.com</p></div></div>
                   <CheckCircle2 className="w-4 h-4 text-slate-300"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}