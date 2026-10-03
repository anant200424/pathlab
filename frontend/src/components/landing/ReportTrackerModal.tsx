'use client';

import React, { useState } from 'react';
import { X, Search, FileText, Printer, Download, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface ReportTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportTrackerModal({ isOpen, onClose }: ReportTrackerModalProps) {
  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) {
      toast.error('Please enter an Order ID or Phone number');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrderData(null);
    try {
      const res = await apiClient.get('/orders', {
        params: { search: orderQuery.trim(), limit: 5 },
      });
      const orders = res.data?.data?.items || res.data?.data || [];
      if (orders.length > 0) {
        setOrderData(orders[0]);
      } else {
        setErrorMsg('No lab order found matching this identifier. Please verify the ID on your receipt.');
      }
    } catch {
      setErrorMsg('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800">
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Track & Download Report Slip</h3>
              <p className="text-[11px] text-slate-400">View original ePathLab clinical test slip</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Enter Order ID (e.g. ORD-...) or Phone"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Track</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {orderData && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-extrabold text-sm text-slate-900 uppercase">
                    {orderData.patient?.fullName || orderData.patient?.firstName || 'Patient'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Order ID: {orderData.orderId}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  orderData.status === 'verified' || orderData.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {orderData.status === 'verified' || orderData.status === 'published' ? 'Verified' : 'Under Process'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <p>Referred by: <strong className="text-slate-800">{orderData.referringDoctor?.fullName || 'DR N UPADHYAY'}</strong></p>
                <p>Tests Count: <strong className="text-slate-800">{orderData.orderedTests?.length || 1} Tests</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex gap-2">
                <a
                  href={`/print/slip/${orderData._id}?format=MAIN`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer size={14} /> Open Original Slip
                </a>
                <a
                  href={`/print/slip/${orderData._id}?format=MAIN`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <Download size={14} /> Download
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
