"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Package, ShoppingCart, RefreshCw } from "lucide-react";

// --- Types ---
interface Batch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  batches: Batch[];
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellQty, setSellQty] = useState<Record<string, string>>({}); // Track input per product
  const [processing, setProcessing] = useState(false);

  // --- CONFIG: backend URL ---
  // IMPORTANT: Double check this URL matches your Port 3000 in the Ports tab!
  // Use the environment variable, or fallback to localhost for safety
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  

  // --- Fetch Data ---
  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory`);
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- Handle Sell Action ---
  const handleSell = async (sku: string) => {
    const qty = parseInt(sellQty[sku]);
    if (!qty || qty <= 0) return alert("Please enter a valid quantity");

    setProcessing(true);
    try {
      // Call the FIFO Sell Endpoint
      await axios.post(`${API_URL}/inventory/sell`, {
        sku: sku,
        qty: qty
      });
      
      alert("Sale Successful!");
      setSellQty({ ...sellQty, [sku]: "" }); // Clear input
      fetchInventory(); // Refresh data to see changes instantly
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || "Sale failed"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
          <p className="text-gray-500">Real-time FIFO Inventory Tracking</p>
        </div>
        <button 
          onClick={fetchInventory}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm hover:bg-gray-50 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Product List */}
      <div className="max-w-4xl mx-auto grid gap-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading inventory system...</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              {/* Top Row: Name & Total Stock */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    SKU: {product.sku}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {product.batches.reduce((sum, b) => sum + b.quantity, 0)} <span className="text-sm font-normal text-gray-400">Units</span>
                  </p>
                </div>
              </div>

              {/* Middle Row: Batches (Visualizing FIFO) */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Active Batches (FIFO Priority)
                </h3>
                <div className="space-y-2">
                  {product.batches.length === 0 ? (
                    <p className="text-red-500 text-sm italic">Out of Stock</p>
                  ) : (
                    product.batches.map((batch) => (
                      <div key={batch.id} className={`flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0 ${batch.quantity === 0 ? 'opacity-40' : ''}`}>
                        <span className="font-mono text-gray-700">{batch.batchNumber}</span>
                        <div className="flex gap-6">
                          <span className={batch.quantity === 0 ? "text-red-500 font-bold" : "text-gray-800 font-bold"}>
                            Qty: {batch.quantity}
                          </span>
                          <span className={`font-medium ${new Date(batch.expiryDate) < new Date('2025-01-01') ? 'text-orange-500' : 'text-green-600'}`}>
                            Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Row: The Sell Action */}
              <div className="flex gap-2 items-center border-t pt-4">
                <input 
                  type="number" 
                  placeholder="Qty to sell" 
                  className="border rounded-lg px-3 py-2 w-32 text-sm"
                  value={sellQty[product.sku] || ""}
                  onChange={(e) => setSellQty({...sellQty, [product.sku]: e.target.value})}
                />
                <button 
                  onClick={() => handleSell(product.sku)}
                  disabled={processing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {processing ? "Processing..." : "Process Sale"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}