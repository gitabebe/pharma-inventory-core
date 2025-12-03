"use client";
import { useEffect, useState, Fragment } from "react"; // <--- ADDED FRAGMENT
import axios from "axios";
import { useRouter } from "next/navigation"; 
import { 
  LogOut, Truck, Store, Users, UserPlus, Trophy, ShoppingCart, RefreshCw, Trash2, Search, User as UserIcon, XCircle, CheckCircle, ArrowRight, Eye, Plus, Minus, Edit2
} from "lucide-react";

// --- TYPES ---
interface Batch { id: string; batchNumber: string; quantity: number; expiryDate: string; costPrice: number; location: { type: string }; }
interface Product { id: string; name: string; sku: string; batches: Batch[]; }
interface User { name: string; role: string; email: string; }
interface Employee { id: string; name: string; role: string; email: string; baseSalary?: number; isActive: boolean; }
interface Performer { name: string; totalSales: number; email: string; }
interface CartItem { sku: string; name: string; qty: number; }
interface MyProfile { name: string; email: string; role: string; baseSalary: number; joinDate: string; }

export default function EnterpriseERP() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]); 
  const [performers, setPerformers] = useState<Performer[]>([]);
  
  const [showProfile, setShowProfile] = useState(false);
  const [myProfileData, setMyProfileData] = useState<MyProfile | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  // Carts
  const [cart, setCart] = useState<CartItem[]>([]); 
  const [transferCart, setTransferCart] = useState<CartItem[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");

  // Forms
  const [empData, setEmpData] = useState({ name: "", email: "", pass: "", role: "PHARMACIST", salary: "0" });
  const [isEditingEmp, setIsEditingEmp] = useState<string | null>(null); 
  
  const [receiveData, setReceiveData] = useState({ sku: "", batch: "", expiry: "", qty: "", cost: "" });
  const [prodData, setProdData] = useState({ name: "", sku: "", min: "10" });
  const [transferInputs, setTransferInputs] = useState<Record<string, string>>({});

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("user_role");
    if (!token) { router.push("/login"); } 
    else {
      setUser({ name: "User", role: role || "PHARMACIST", email: "me@pharmacy.com" });
      loadData(role);
    }
  }, []);

  const getHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  const loadData = (role: string | null) => {
    if(role !== 'SUPER_ADMIN' && role !== 'HR_MANAGER') { axios.get(`${API_URL}/inventory`).then(res => setProducts(res.data)); }
    if(role !== 'PHARMACIST') { axios.get(`${API_URL}/auth/employees`, getHeader()).then(res => setEmployees(res.data)); }
    axios.get(`${API_URL}/hr/performance`, getHeader()).then(res => setPerformers(res.data));
  };

  const fetchMyProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, getHeader());
      setMyProfileData(res.data);
      setShowProfile(true);
    } catch(e) { alert("Could not load profile. Check backend logs."); }
  };

  const getStock = (p: Product, locationType: 'STORE' | 'WAREHOUSE') => {
    return p.batches.filter(b => b.location.type === locationType).reduce((sum, b) => sum + b.quantity, 0);
  };

  // --- ACTIONS ---
  const handleCreateProduct = async () => {
    try { await axios.post(`${API_URL}/inventory/product`, { name: prodData.name, sku: prodData.sku, minStock: parseInt(prodData.min) }, getHeader()); alert("Created!"); loadData(user?.role||""); } catch (e) { alert("Error"); }
  };
  const receiveStock = async () => {
     try {
       const prod = products.find(p => p.sku === receiveData.sku);
       if (!prod) { alert("Product not found"); return; }
       await axios.post(`${API_URL}/inventory/batch`, { productId: prod.id, batchNumber: receiveData.batch, expiry: receiveData.expiry, qty: parseInt(receiveData.qty), cost: parseFloat(receiveData.cost) }, getHeader());
       alert("Received!"); loadData(user?.role||"");
     } catch(e) { alert("Failed"); }
  }
  const addToTransferCart = (p: Product) => {
    const qty = parseInt(transferInputs[p.sku]);
    if (!qty || qty <= 0) return;
    const existing = transferCart.find(c => c.sku === p.sku);
    if(existing) { setTransferCart(transferCart.map(c => c.sku === p.sku ? {...c, qty: c.qty + qty} : c)); } 
    else { setTransferCart([...transferCart, { sku: p.sku, name: p.name, qty: qty }]); }
    setTransferInputs({...transferInputs, [p.sku]: ""});
  };
  const confirmTransfer = async () => {
    try { for (const item of transferCart) { await axios.post(`${API_URL}/inventory/transfer`, { sku: item.sku, qty: item.qty }, getHeader()); } alert("Transferred!"); setTransferCart([]); loadData(user?.role||""); } catch(e) { alert("Failed"); }
  }
  
  // --- HR ACTIONS ---
  const saveEmployee = async () => {
    try {
      if (isEditingEmp) {
        await axios.patch(`${API_URL}/auth/users/${isEditingEmp}`, { role: empData.role, salary: parseFloat(empData.salary) }, getHeader());
        alert("Updated!"); setIsEditingEmp(null);
      } else {
        await axios.post(`${API_URL}/auth/register`, { name: empData.name, email: empData.email, pass: empData.pass, role: empData.role, baseSalary: parseFloat(empData.salary) }, getHeader());
        alert("Hired!");
      }
      setEmpData({ name: "", email: "", pass: "", role: "PHARMACIST", salary: "0" });
      loadData(user?.role || "");
    } catch (e) { alert("Operation Failed"); }
  };

  const editEmployee = (emp: Employee) => {
    setIsEditingEmp(emp.id);
    setEmpData({ name: emp.name, email: emp.email, pass: "", role: emp.role, salary: String(emp.baseSalary || 0) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fireEmployee = async (id: string) => { if(confirm("Deactivate?")) { await axios.delete(`${API_URL}/auth/users/${id}`, getHeader()); loadData(user?.role||""); } };
  
  // Pharmacist Actions
  const addToCart = (p: Product) => {
    const existing = cart.find(c => c.sku === p.sku);
    if(existing) { setCart(cart.map(c => c.sku === p.sku ? {...c, qty: c.qty + 1} : c)); } 
    else { setCart([...cart, { sku: p.sku, name: p.name, qty: 1 }]); }
  };
  const updateCart = (targetCart: CartItem[], setCartFunc: any, sku: string, delta: number) => {
    const existing = targetCart.find(c => c.sku === sku);
    if (!existing) return;
    const newQty = existing.qty + delta;
    if (newQty <= 0) setCartFunc(targetCart.filter(c => c.sku !== sku));
    else setCartFunc(targetCart.map(c => c.sku === sku ? {...c, qty: newQty} : c));
  };
  const removeCartItem = (targetCart: CartItem[], setCartFunc: any, sku: string) => setCartFunc(targetCart.filter(c => c.sku !== sku));

  const checkout = async () => {
    try { for (const item of cart) { await axios.post(`${API_URL}/inventory/sell`, { sku: item.sku, qty: item.qty }, getHeader()); } alert("Sold!"); setCart([]); loadData(user?.role||""); } catch (e: any) { alert("Error: " + e.response?.data?.message); }
  };
  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  if (!user) return <div className="p-10">Loading ERP...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div><h1 className="text-xl font-bold">PharmaCore</h1><p className="text-xs text-slate-400">{user.role}</p></div>
        <div className="flex gap-4">
          <button onClick={fetchMyProfile} className="flex items-center gap-2 text-sm bg-slate-800 px-3 py-1 rounded hover:bg-slate-700"><UserIcon className="w-4 h-4"/> My Profile</button>
          <button onClick={handleLogout} className="text-xs bg-red-600 px-3 py-1 rounded font-bold hover:bg-red-700 flex gap-2 items-center"><LogOut className="w-3 h-3"/> Logout</button>
        </div>
      </nav>

      {/* FULL PROFILE MODAL */}
      {showProfile && myProfileData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 relative animate-in fade-in zoom-in duration-200">
             <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-slate-400 hover:text-black"><XCircle/></button>
             <h2 className="text-xl font-bold mb-4 flex gap-2 items-center text-slate-700"><UserIcon className="w-6 h-6 text-blue-600"/> My Full Profile</h2>
             <div className="space-y-4 text-sm">
               <div className="bg-slate-50 p-3 rounded border">
                 <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-slate-400 uppercase">Name</p><p className="font-bold">{myProfileData.name}</p></div>
                    <div><p className="text-xs text-slate-400 uppercase">Role</p><p className="font-bold">{myProfileData.role}</p></div>
                    <div className="col-span-2"><p className="text-xs text-slate-400 uppercase">Email</p><p className="font-mono">{myProfileData.email}</p></div>
                    <div><p className="text-xs text-slate-400 uppercase">Hired On</p><p>{new Date(myProfileData.joinDate).toLocaleDateString()}</p></div>
                    <div><p className="text-xs text-slate-400 uppercase">Base Salary</p><p className="font-bold text-green-600">${myProfileData.baseSalary}</p></div>
                 </div>
               </div>
               <div className="bg-green-50 p-3 rounded border border-green-100">
                  <p className="text-xs text-green-700 uppercase">Performance (Total Sales)</p>
                  <p className="text-2xl font-bold text-green-600">${performers.find(p => p.email === myProfileData.email)?.totalSales || 0}</p>
               </div>
             </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        
        {/* --- 1. PHARMACIST VIEW --- */}
        {user.role === 'PHARMACIST' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white p-4 rounded shadow">
              <div className="flex justify-between mb-4"><h2 className="font-bold flex gap-2"><Search className="w-5 h-5"/> Product Catalog</h2><input placeholder="Search..." className="border rounded px-2 text-sm" onChange={e => setSearchTerm(e.target.value)} /></div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600"><tr><th className="p-2">Name</th><th className="p-2">SKU</th><th className="p-2">Stock</th><th className="p-2">Action</th></tr></thead>
                <tbody>
                  {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                    const stock = getStock(p, 'STORE');
                    return (
                      <tr key={p.id} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-bold">{p.name}</td><td className="p-2 font-mono text-slate-500">{p.sku}</td>
                        <td className={`p-2 font-bold ${stock>0?'text-green-600':'text-red-500'}`}>{stock}</td>
                        <td className="p-2"><button disabled={stock<=0} onClick={() => addToCart(p)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50">Add</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-white p-4 rounded shadow flex flex-col h-96">
              <h2 className="font-bold mb-4 flex gap-2"><ShoppingCart className="w-5 h-5"/> Sale Cart</h2>
              <div className="flex-1 overflow-y-auto space-y-2">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b pb-2">
                    <div><div>{item.name}</div><div className="text-xs text-slate-400">{item.sku}</div></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCart(cart, setCart, item.sku, -1)} className="bg-slate-200 p-1 rounded hover:bg-slate-300"><Minus className="w-3 h-3"/></button>
                      <span className="font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateCart(cart, setCart, item.sku, 1)} className="bg-slate-200 p-1 rounded hover:bg-slate-300"><Plus className="w-3 h-3"/></button>
                      <button onClick={() => removeCartItem(cart, setCart, item.sku)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={checkout} disabled={cart.length===0} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 mt-4">Checkout</button>
            </div>
          </div>
        )}

        {/* --- 2. STORE MANAGER VIEW --- */}
        {user.role === 'STORE_MANAGER' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded shadow grid grid-cols-2 gap-6">
               <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">1. Define Medicine</h3>
                  <div className="flex gap-2 mb-2"><input value={prodData.name} onChange={e=>setProdData({...prodData, name: e.target.value})} placeholder="Name (e.g. Ibuprofen)" className="border p-1 w-full text-sm rounded"/><input value={prodData.sku} onChange={e=>setProdData({...prodData, sku: e.target.value})} placeholder="SKU (e.g. IBU-200)" className="border p-1 w-full text-sm rounded"/></div>
                  <button onClick={handleCreateProduct} className="bg-slate-700 text-white w-full py-1 text-xs font-bold rounded">Create</button>
               </div>
               <div>
                  <h3 className="font-bold mb-2 flex gap-2"><Truck className="w-4 h-4"/> 2. Receive Stock</h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select className="col-span-2 border p-1 text-sm rounded" onChange={e => setReceiveData({...receiveData, sku: e.target.value})}><option value="">Select Product...</option>{products.map(p => <option key={p.id} value={p.sku}>{p.name}</option>)}</select>
                    <input placeholder="Batch #" className="border p-1 text-sm" onChange={e=>setReceiveData({...receiveData, batch: e.target.value})}/><input type="date" className="border p-1 text-sm" onChange={e=>setReceiveData({...receiveData, expiry: e.target.value})}/>
                    <input placeholder="Qty" type="number" className="border p-1 text-sm" onChange={e=>setReceiveData({...receiveData, qty: e.target.value})}/><input placeholder="Cost" type="number" className="border p-1 text-sm" onChange={e=>setReceiveData({...receiveData, cost: e.target.value})}/>
                  </div>
                  <button onClick={receiveStock} className="bg-green-600 text-white w-full py-1 rounded text-sm font-bold">Receive</button>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-4 rounded shadow">
                <h2 className="font-bold mb-4">Warehouse Inventory</h2>
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800 text-white"><tr><th className="p-2">Product</th><th className="p-2">Whse Qty</th><th className="p-2">Transfer Qty</th><th className="p-2">Action</th></tr></thead>
                  <tbody>
                    {products.map(p => {
                       const whStock = getStock(p, 'WAREHOUSE');
                       const isExpanded = expandedProduct === p.id;
                       return (
                         <Fragment key={p.id}>
                           <tr className="border-b bg-white">
                             <td className="p-2">
                               <div className="font-bold">{p.name} <span className="text-xs font-normal text-slate-500">({p.sku})</span></div>
                               <button onClick={() => setExpandedProduct(isExpanded ? null : p.id)} className="text-blue-500 text-xs flex items-center gap-1 mt-1 hover:underline"><Eye className="w-3 h-3"/> {isExpanded ? 'Hide' : 'View'} Batches</button>
                             </td>
                             <td className="p-2 font-bold text-blue-600">{whStock}</td>
                             <td className="p-2"><input type="number" placeholder="0" className="border w-16 px-1" value={transferInputs[p.sku]||""} onChange={e=>setTransferInputs({...transferInputs, [p.sku]: e.target.value})}/></td>
                             <td className="p-2"><button onClick={() => addToTransferCart(p)} className="text-blue-600 font-bold text-xs"><ArrowRight/></button></td>
                           </tr>
                           {isExpanded && (
                             <tr className="bg-slate-50"><td colSpan={4} className="p-3"><div className="grid grid-cols-3 gap-2 text-xs">{p.batches.filter(b => b.location.type === 'WAREHOUSE').map(b => (<div key={b.id} className="bg-white border p-2 rounded flex justify-between"><span>{b.batchNumber}</span><span className="text-slate-500">Exp: {new Date(b.expiryDate).toLocaleDateString()}</span><span className="font-bold text-green-600">${b.costPrice}</span></div>))}</div></td></tr>
                           )}
                         </Fragment>
                       )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bg-white p-4 rounded shadow flex flex-col">
                <h2 className="font-bold mb-4 flex gap-2"><Store className="w-5 h-5"/> Transfer Cart</h2>
                <div className="flex-1 bg-slate-50 p-2 rounded mb-4 overflow-y-auto space-y-2">
                   {transferCart.map((item, i) => (
                       <div key={i} className="flex justify-between items-center text-sm border-b pb-1">
                         <div>{item.name}</div>
                         <div className="flex items-center gap-1">
                           <button onClick={() => updateCart(transferCart, setTransferCart, item.sku, -1)} className="bg-slate-200 p-1 rounded hover:bg-slate-300"><Minus className="w-3 h-3"/></button>
                           <span className="font-bold w-4 text-center">{item.qty}</span>
                           <button onClick={() => updateCart(transferCart, setTransferCart, item.sku, 1)} className="bg-slate-200 p-1 rounded hover:bg-slate-300"><Plus className="w-3 h-3"/></button>
                           <button onClick={() => removeCartItem(transferCart, setTransferCart, item.sku)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 className="w-4 h-4"/></button>
                         </div>
                       </div>
                   ))}
                </div>
                <button onClick={confirmTransfer} disabled={transferCart.length===0} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Approve All</button>
              </div>
            </div>
          </div>
        )}

        {/* --- 3. HR & ADMIN VIEW --- */}
        {(user.role === 'HR_MANAGER' || user.role === 'SUPER_ADMIN') && (
          <div className="space-y-6">
            
            {/* Performance Leaderboard for HR */}
            {user.role === 'HR_MANAGER' && (
              <div className="bg-white p-4 rounded shadow">
                <h2 className="font-bold mb-4 flex gap-2"><Trophy className="w-5 h-5 text-yellow-500"/> Performance Leaderboard</h2>
                <div className="grid grid-cols-2 gap-4">
                  {performers.length > 0 ? performers.map((p, i) => (
                    <div key={i} className="flex justify-between p-3 bg-slate-50 rounded border">
                      <span className="font-bold">#{i+1} {p.name}</span>
                      <span className="text-green-600 font-bold">${p.totalSales}</span>
                    </div>
                  )) : <p className="text-slate-400">No sales recorded.</p>}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold mb-4 flex gap-2"><UserPlus className="w-5 h-5"/> {isEditingEmp ? 'Edit Contract' : 'Hire / Create User'}</h2>
              <div className="flex gap-2">
                <input placeholder="Name" value={empData.name} className="border p-2 w-full text-sm" onChange={e=>setEmpData({...empData, name: e.target.value})}/>
                <input placeholder="Email" value={empData.email} disabled={!!isEditingEmp} className={`border p-2 w-full text-sm ${isEditingEmp ? 'bg-slate-100' : ''}`} onChange={e=>setEmpData({...empData, email: e.target.value})}/>
                {!isEditingEmp && <input placeholder="Pass" type="password" value={empData.pass} className="border p-2 w-full text-sm" onChange={e=>setEmpData({...empData, pass: e.target.value})}/>}
                <select value={empData.role} className="border p-2 w-full text-sm" onChange={e=>setEmpData({...empData, role: e.target.value})}>
                  <option value="PHARMACIST">Pharmacist</option><option value="STORE_MANAGER">Store Mgr</option><option value="HR_MANAGER">HR Mgr</option>
                </select>
                {user.role === 'HR_MANAGER' && <input placeholder="Salary $" value={empData.salary} className="border p-2 w-24 text-sm" onChange={e=>setEmpData({...empData, salary: e.target.value})}/>}
                
                <button onClick={saveEmployee} className={`px-4 rounded font-bold text-white ${isEditingEmp ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'}`}>
                  {isEditingEmp ? 'Update' : 'Add'}
                </button>
                {isEditingEmp && <button onClick={() => { setIsEditingEmp(null); setEmpData({ name: "", email: "", pass: "", role: "PHARMACIST", salary: "0" }); }} className="text-slate-500 text-xs underline">Cancel</button>}
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold mb-4 flex gap-2"><Users className="w-5 h-5"/> Staff Directory</h2>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600"><tr><th className="p-2">Name</th><th className="p-2">Status</th><th className="p-2">Role</th><th className="p-2">Email</th>{user.role==='HR_MANAGER' && <th className="p-2">Salary</th>}<th className="p-2">Action</th></tr></thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className={`border-b ${!emp.isActive ? 'bg-red-50 opacity-75' : ''}`}>
                      <td className="p-2 font-bold">{emp.name}</td>
                      <td className="p-2">{emp.isActive ? <span className="text-green-600 text-xs font-bold">Active</span> : <span className="text-red-600 text-xs font-bold">Terminated</span>}</td>
                      <td className="p-2"><span className="bg-slate-200 px-2 py-1 rounded text-xs">{emp.role}</span></td>
                      <td className="p-2 text-slate-500">{emp.email}</td>
                      {user.role==='HR_MANAGER' && <td className="p-2 font-mono">${emp.baseSalary}</td>}
                      <td className="p-2 flex gap-2">
                        {user.role==='HR_MANAGER' && emp.isActive && <button onClick={()=>editEmployee(emp)} className="text-blue-600 hover:text-blue-800 flex gap-1 items-center"><Edit2 className="w-4 h-4"/> Edit</button>}
                        {emp.isActive && <button onClick={()=>fireEmployee(emp.id)} className="text-red-600 hover:text-red-800 flex gap-1 items-center"><Trash2 className="w-4 h-4"/> Fire</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}