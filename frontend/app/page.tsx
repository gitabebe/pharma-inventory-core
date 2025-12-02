"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation"; 
import { 
  Package, ShoppingCart, RefreshCw, Activity, CheckCircle2, History, LogOut, AlertCircle, PlayCircle, StopCircle, PlusCircle
} from "lucide-react";
// Import Recharts
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Types ---
interface Batch { id: string; batchNumber: string; quantity: number; expiryDate: string; }
interface Product { id: string; name: string; sku: string; batches: Batch[]; }
interface SaleLog { 
  id: string; totalAmount: number; createdAt: string; 
  items: { quantity: number; batch: { batchNumber: string; product: { name: string } } }[] 
}
interface HrStatus { isWorking: boolean; session?: { checkIn: string } }

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<SaleLog[]>([]);
  const [stats, setStats] = useState<{date: string, total: number}[]>([]); 
  const [loading, setLoading] = useState(true);
  const [sellQty, setSellQty] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  
  // HR State
  const [hrStatus, setHrStatus] = useState<HrStatus>({ isWorking: false });
  const [hrLoading, setHrLoading] = useState(false);

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // --- 1. Load Data ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchInventory();
      fetchHistory();
      fetchHrStatus();
      fetchStats(); 
    }
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory`);
      if (Array.isArray(response.data)) setProducts(response.data);
      setLoading(false);
    } catch (error) { console.error("Inventory error:", error); setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${API_URL}/inventory/history`, getAuthHeader());
      setLogs(response.data);
    } catch (error) { console.error("History error:", error); }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${API_URL}/inventory/stats`, getAuthHeader());
      setStats(response.data);
    } catch (error) { console.error("Stats error:", error); }
  };

  // --- HR Functions ---
  const fetchHrStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${API_URL}/hr/status`, getAuthHeader());
      setHrStatus(response.data);
    } catch (error) { console.error("HR Status Error", error); }
  }

  const toggleShift = async () => {
    setHrLoading(true);
    try {
      const endpoint = hrStatus.isWorking ? "clock-out" : "clock-in";
      await axios.post(`${API_URL}/hr/${endpoint}`, {}, getAuthHeader());
      await fetchHrStatus();
      alert(hrStatus.isWorking ? "Shift Ended. Goodbye!" : "Shift Started. Welcome!");
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || "HR Action Failed"));
    } finally {
      setHrLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // --- Quick Restock Function (NEW) ---
  const handleRestock = async (productId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Ask user for quantity (optional, defaults to 50 if they cancel/empty)
    const qtyStr = prompt("How many units to add?", "50");
    if (!qtyStr) return;
    const qty = parseInt(qtyStr);

    try {
      await axios.post(`${API_URL}/inventory/batch`, {
        productId: productId,
        batchNumber: "BATCH-" + Math.floor(Math.random() * 10000), // Random ID
        expiry: "2026-06-01", // Fresh stock date
        qty: qty 
      }, getAuthHeader());
      
      alert(`Restocked ${qty} units!`);
      fetchInventory(); // Update UI
    } catch (error) {
      console.error(error);
      alert("Restock failed");
    }
  };

  const handleSell = async (sku: string, productName: string) => {
    const qty = parseInt(sellQty[sku]);
    if (!qty || qty <= 0) return;
    setProcessing(true);
    try {
      await axios.post(`${API_URL}/inventory/sell`, { sku, qty }, getAuthHeader());
      setSellQty({ ...sellQty, [sku]: "" });
      fetchInventory(); 
      fetchHistory();
      fetchStats();
    } catch (error: any) {
      if (error.response?.status === 401) { alert("Session expired."); handleLogout(); }
      else { alert("Error: " + (error.response?.data?.message || "Sale failed")); }
    } finally { setProcessing(false); }
  };

  const getExpiryStatus = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    if (date < today) return { color: "text-red-600 bg-red-50", label: "EXPIRED" };
    if (date < threeMonthsFromNow) return { color: "text-orange-600 bg-orange-50", label: "EXPIRING SOON" };
    return { color: "text-green-600 bg-green-50", label: "GOOD" };
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="text-green-400" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">PharmaCore</h1>
              <p className="text-xs text-slate-400">Enterprise Inventory System</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* HR WIDGET */}
            <div className="bg-slate-800 rounded-lg p-1 px-3 flex items-center gap-3 border border-slate-700">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                  Employee Status
                </span>
                <span className={`text-sm font-bold ${hrStatus.isWorking ? "text-green-400" : "text-slate-500"}`}>
                  {hrStatus.isWorking ? "● ON DUTY" : "○ OFF DUTY"}
                </span>
              </div>
              <button 
                onClick={toggleShift}
                disabled={hrLoading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-xs transition ${
                  hrStatus.isWorking ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {hrStatus.isWorking ? <StopCircle className="w-4 h-4"/> : <PlayCircle className="w-4 h-4"/>}
                {hrStatus.isWorking ? "Clock Out" : "Clock In"}
              </button>
            </div>

            <div className="h-8 w-px bg-slate-700"></div>

            <button onClick={handleLogout} className="flex items-center gap-2 hover:text-red-400 text-xs font-bold transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ANALYTICS CHART */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500"/> Sales Trend (Last 7 Days)
            </h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {weekday: 'short'})} 
                    tick={{fontSize: 12}}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* INVENTORY HEADER */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">
              <Package className="w-5 h-5" /> Current Stock
            </h2>
            <button onClick={() => { fetchInventory(); fetchHistory(); fetchStats(); }} title="Refresh">
               <RefreshCw className="w-5 h-5 text-slate-400 hover:text-blue-600 transition" />
            </button>
          </div>

          {/* INVENTORY LIST */}
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading inventory...</div>
          ) : (
            products.map((product) => {
              const totalStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
              const isLowStock = totalStock < 10;
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{product.name}</h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded mt-1 inline-block">SKU: {product.sku}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${isLowStock ? "text-red-500" : "text-blue-600"}`}>{totalStock}</div>
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Units</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4">
                    <div className="space-y-2">
                      {product.batches.map((batch) => {
                         const status = getExpiryStatus(batch.expiryDate);
                         return (
                          <div key={batch.id} className={`flex justify-between items-center text-sm bg-white p-3 rounded border ${batch.quantity === 0 ? 'opacity-50 dashed border-slate-300' : 'border-slate-200'}`}>
                            <span className="font-mono font-bold text-slate-700">{batch.batchNumber}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${status.color}`}>
                              {new Date(batch.expiryDate).toLocaleDateString()} ({status.label})
                            </span>
                            <span className="text-xs text-slate-400">Qty: {batch.quantity}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="p-4 bg-white flex items-center gap-3">
                    
                    {/* NEW RESTOCK BUTTON */}
                    <button 
                      onClick={() => handleRestock(product.id)}
                      className="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold hover:bg-green-200 transition text-xs flex items-center gap-1"
                      title="Add Stock"
                    >
                      <PlusCircle className="w-3 h-3"/> Add
                    </button>

                    <input 
                      type="number" 
                      placeholder="Qty" 
                      className="border border-slate-300 rounded-lg px-4 py-2 w-24 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      value={sellQty[product.sku] || ""}
                      onChange={(e) => setSellQty({...sellQty, [product.sku]: e.target.value})}
                    />
                    <button 
                      onClick={() => handleSell(product.sku, product.name)}
                      disabled={processing || totalStock === 0}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                      Process FIFO Sale
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: History Log */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">
            <History className="w-5 h-5" /> Recent Activity
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                <AlertCircle className="w-8 h-8" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-3 items-start border-l-2 border-green-500 pl-3 py-2 bg-slate-50 rounded-r">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] bg-white border px-1 rounded text-slate-400">
                          #{log.id.slice(0,4)}
                        </span>
                      </div>
                      
                      {log.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-700">
                          <span className="font-bold">Sold {item.quantity}x</span> {item.batch.product.name}
                          <div className="text-xs text-slate-500">
                            (Batch: {item.batch.batchNumber})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}