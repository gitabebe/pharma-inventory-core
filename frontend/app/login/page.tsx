"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState(""); 
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Ask Backend for the Token
      const res = await axios.post(`${API_URL}/auth/login`, {
        email, 
        pass
      });

      // 2. Save the Token to Browser Memory (LocalStorage)
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user_role", res.data.user.role);

      // 3. Go to Dashboard
      alert("Login Successful! Redirecting...");
      router.push("/");

    } catch (error: any) {
      alert("Login Failed: " + (error.response?.data?.message || "Check console"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">PharmaCore Login</h1>
          <p className="text-slate-500 text-sm">Enterprise Access Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="email" 
                className="pl-10 w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="password" 
                className="pl-10 w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}