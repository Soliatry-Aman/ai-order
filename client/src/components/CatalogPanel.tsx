import React, { useState } from 'react';

interface Props {
  onQueryOrder: (orderId: string) => void;
  onQueryInventory: (sku: string) => void;
  onClose: () => void;
}

const SAMPLE_ORDERS = [
  { id: '4821', customer: 'Priya Sharma', status: 'shipped', total: '₹2,499', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: '4822', customer: 'Rahul Verma', status: 'processing', total: '₹890', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: '4823', customer: 'Aisha Khan', status: 'delivered', total: '₹3,998', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: '4824', customer: 'Vikram Rao', status: 'cancelled', total: '₹1,499', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
];

const SAMPLE_INVENTORY = [
  { sku: 'SLV-BLU-42', name: 'Sylvi Chronograph Blue', stock: 0, status: 'Out of Stock', restock: '2026-08-20' },
  { sku: 'SLV-BLK-40', name: 'Sylvi Chronograph Black', stock: 34, status: 'In Stock', restock: null },
  { sku: 'SFL-OIL-100', name: 'Onion Hair Oil 100ml', stock: 210, status: 'In Stock', restock: null },
  { sku: 'SFL-SER-30', name: 'Vitamin C Serum 30ml', stock: 7, status: 'Low Stock', restock: '2026-08-05' },
];

export const CatalogPanel: React.FC<Props> = ({ onQueryOrder, onQueryInventory, onClose }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredOrders = SAMPLE_ORDERS.filter(
    o => o.id.includes(searchFilter) || o.customer.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredInventory = SAMPLE_INVENTORY.filter(
    i => i.sku.toLowerCase().includes(searchFilter.toLowerCase()) || i.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full sm:w-96 flex-shrink-0 bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full z-20 animate-slide-right overflow-hidden shadow-2xl">
      {/* Panel Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-base">📦</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Order & Inventory Catalog</h2>
            <p className="text-[11px] text-slate-400">Click any item to query live status</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/8">
        <div className="relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by ID, SKU, or Customer..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-2 gap-1.5 bg-black/20 border-b border-white/8">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          Orders ({SAMPLE_ORDERS.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'inventory'
              ? 'bg-theme-gradient text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          Inventory ({SAMPLE_INVENTORY.length})
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {activeTab === 'orders' ? (
          filteredOrders.length > 0 ? (
            filteredOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => onQueryOrder(o.id)}
                className="glass-card rounded-2xl p-3 border border-white/8 hover:border-indigo-500/40 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-indigo-300 group-hover:text-indigo-200">
                    Order #{o.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${o.badge}`}>
                    {o.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{o.customer}</span>
                  <span className="text-white font-bold">{o.total}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Click to query status</span>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                    Query →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-slate-500 py-8">No orders matching search</p>
          )
        ) : (
          filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <div
                key={item.sku}
                onClick={() => onQueryInventory(item.sku)}
                className="glass-card rounded-2xl p-3 border border-white/8 hover:border-sky-500/40 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-[11px] text-sky-300 group-hover:text-sky-200">
                    {item.sku}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      item.stock === 0
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : item.stock < 10
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {item.stock} in stock
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium mb-1">{item.name}</p>
                {item.restock && (
                  <p className="text-[10px] text-amber-400/80 mb-1">
                    Restock expected: {item.restock}
                  </p>
                )}
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Click to check stock</span>
                  <span className="text-sky-400 group-hover:translate-x-1 transition-transform">
                    Check →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-slate-500 py-8">No inventory matching search</p>
          )
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-black/40 border-t border-white/8 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Showing live catalog items</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live DB
        </span>
      </div>
    </div>
  );
};
