'use client';

import { useState } from 'react';
import { Settings, Shield, Bell, Database, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [labName, setLabName] = useState('LabCare Pro Central Lab');
  const [currency, setCurrency] = useState('INR (₹)');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [barcodePrefix, setBarcodePrefix] = useState('SMP');
  const [autoVerify, setAutoVerify] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('System settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Laboratory Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure laboratory operational defaults, report layout branding, and security parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Settings size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">General Laboratory Preferences</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Default Laboratory Name
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Operating Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="INR (₹)">Indian Rupee (INR - ₹)</option>
                <option value="USD ($)">US Dollar (USD - $)</option>
                <option value="EUR (€)">Euro (EUR - €)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Laboratory Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST +05:30)</option>
                <option value="UTC">Universal Coordinated Time (UTC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Barcode Sample Prefix
              </label>
              <input
                type="text"
                value={barcodePrefix}
                onChange={(e) => setBarcodePrefix(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bell size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Notifications & Automation</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">Critical Value Email Alerts</p>
                <p className="text-xs text-slate-500">Send instant alert notifications when sample results enter critical high/low limits.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoVerify}
                onChange={(e) => setAutoVerify(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">Auto-Verification for Normal Routine Tests</p>
                <p className="text-xs text-slate-500">Automatically approve routine results that fall strictly within reference intervals.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200"
          >
            <Save size={15} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
