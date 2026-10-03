'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks';
import { inventoryService } from '@/lib/services/misc.service';
import { formatDate } from '@/lib/utils';
import { TableSkeleton, PageError } from '@/components/ui/Skeleton';
import { Package, AlertTriangle, Plus, Loader2, ArrowDownToLine } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { data, isLoading, error, refetch } = useInventory();
  const [actioning, setActioning] = useState<string | null>(null);

  const allItems = data?.data ?? [];
  const lowStockItems = allItems.filter((i) => i.isLowStock);

  const handleReceipt = async (id: string, name: string) => {
    const qtyStr = window.prompt(`Receive stock for "${name}". Quantity:`);
    const qty = parseInt(qtyStr ?? '0');
    if (!qty || isNaN(qty) || qty <= 0) return;
    const notes = window.prompt('Notes (optional):') ?? undefined;
    setActioning(`receipt-${id}`);
    try {
      await inventoryService.receipt(id, qty, notes);
      toast.success(`${qty} units received for ${name}!`);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to receive stock';
      toast.error(msg);
    } finally {
      setActioning(null);
    }
  };

  if (error) return <PageError message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      {/* Low stock alert */}
      {!isLoading && lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} below minimum stock
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item._id} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {item.name} ({item.currentStock} {item.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{isLoading ? '…' : `${allItems.length} items tracked`}</p>
        <button
          onClick={() => toast('Add inventory item via POST /inventory (UI form coming soon)', { icon: '📦' })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Item</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Category</th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Current Stock</th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Minimum</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Stock Level</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Expiry</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py3">Supplier</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">No inventory items found.</td>
                </tr>
              ) : (
                allItems.map((item) => {
                  const pct = Math.min(100, (item.currentStock / (item.minimumStock * 2)) * 100);
                  return (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Package size={13} className={item.isLowStock ? 'text-amber-500' : 'text-slate-400'} />
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          {item.isLowStock && <AlertTriangle size={11} className="text-amber-500" />}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-bold ${item.isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm text-slate-500">{item.minimumStock} {item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 w-36">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct < 50 ? 'bg-amber-500' : pct < 80 ? 'bg-blue-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{Math.round(pct)}% of target</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {item.expiryDate ? (
                          <span className="text-sm text-slate-600">{formatDate(item.expiryDate)}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600">{item.supplier ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleReceipt(item._id, item.name)}
                          disabled={actioning === `receipt-${item._id}`}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          {actioning === `receipt-${item._id}`
                            ? <Loader2 size={11} className="animate-spin" />
                            : <ArrowDownToLine size={11} />}
                          Receive
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
