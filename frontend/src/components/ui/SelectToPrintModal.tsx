'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, CheckSquare, Square } from 'lucide-react';

export interface PrintableTestItem {
  id: string;
  name: string;
  code?: string;
}

interface SelectToPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  tests: PrintableTestItem[];
  defaultFormat?: string;
  onConfirmPrint: (selectedTestIds: string[], format: string) => void;
}

export function SelectToPrintModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  tests,
  defaultFormat = 'MAIN',
  onConfirmPrint,
}: SelectToPrintModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState(defaultFormat);

  // Initialize all selected by default
  useEffect(() => {
    if (tests.length > 0) {
      setSelectedIds(tests.map((t) => t.id));
    }
  }, [tests, isOpen]);

  // ESC key listener (matching "Press ESC to go back" in Screenshot 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allSelected = selectedIds.length === tests.length && tests.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tests.map((t) => t.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one test to print');
      return;
    }
    onConfirmPrint(selectedIds, format);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden text-slate-800">
        {/* Header matching Screenshot 3 */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">✎</span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Select to print</h2>
            <span className="text-xs text-red-600 font-semibold ml-2 select-none">
              Press ESC to go back
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Table matching Screenshot 3 */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-2 px-3 text-left font-semibold w-16 border-r border-slate-200">
                  S.No
                </th>
                <th className="py-2 px-4 text-left font-semibold border-r border-slate-200">
                  Test Name
                </th>
                <th className="py-2 px-3 text-center font-semibold w-24">
                  <div className="flex items-center justify-center gap-1.5 cursor-pointer" onClick={toggleAll}>
                    <span>Print IT</span>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    No tests found for this order.
                  </td>
                </tr>
              ) : (
                tests.map((test, idx) => {
                  const isChecked = selectedIds.includes(test.id);
                  return (
                    <tr
                      key={test.id}
                      onClick={() => toggleOne(test.id)}
                      className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${
                        isChecked ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 border-r border-slate-200">
                        {test.name}
                        {test.code && (
                          <span className="text-xs text-slate-400 font-normal font-mono ml-2">
                            ({test.code})
                          </span>
                        )}
                      </td>
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(test.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls matching Screenshot 3 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Format :</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="text-sm border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="MAIN">MAIN</option>
              <option value="HEADERLESS">HEADERLESS (For Pre-printed Letterhead)</option>
              <option value="SUMMARY">SUMMARY</option>
              <option value="COMPLETE">COMPLETE</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-1.5 rounded text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Printer size={15} />
            Print Selected
          </button>
        </div>
      </div>
    </div>
  );
}
