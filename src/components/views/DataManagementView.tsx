/**
 * BritConnect Data Management & Audit Centre
 * Section 3.3: Version history, database restore, storage utilization,
 * privacy notice, and typed confirmation wipe.
 */

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  History,
  Download,
  RotateCcw,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Database,
  CheckCircle2,
} from 'lucide-react';
import {
  CleanedCustomerRecord,
  DatasetVersionMeta,
} from '../../types/telecom';
import {
  getDatasetVersions,
  wipeAllData,
} from '../../services/db';

interface DataManagementViewProps {
  customers: CleanedCustomerRecord[];
  onDataWiped: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  customers,
  onDataWiped,
}) => {
  const [versions, setVersions] = useState<DatasetVersionMeta[]>([]);
  const [storageEstimate, setStorageEstimate] = useState<{ usedMb: number; quotaMb: number }>({
    usedMb: 0,
    quotaMb: 0,
  });
  const [typedConfirm, setTypedConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    getDatasetVersions().then(setVersions);

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        setStorageEstimate({
          usedMb: +((est.usage || 0) / (1024 * 1024)).toFixed(2),
          quotaMb: +((est.quota || 0) / (1024 * 1024)).toFixed(0),
        });
      });
    }
  }, []);

  const handleDownloadBackup = () => {
    const backup = {
      app: 'BritConnect AI Churn Intelligence Platform',
      version: '2.4',
      exportedAt: new Date().toISOString(),
      recordCount: customers.length,
      data: customers,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BritConnect_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmWipe = async () => {
    if (typedConfirm !== 'DELETE BRITCONNECT DATA') return;
    await wipeAllData();
    setShowDeleteModal(false);
    onDataWiped();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
          Data Management & Version Control
        </h1>
        <p className="text-xs text-[#5B6575] mt-1">
          Section 3.3: Persistent IndexedDB storage metrics, dataset version history, and data sovereignty controls.
        </p>
      </div>

      {/* Storage & Privacy Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Card */}
        <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-xs font-medium">Browser Storage Usage</span>
            <HardDrive className="w-4 h-4 text-[#1D4C8F]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            {storageEstimate.usedMb} MB
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">
            IndexedDB quota: {storageEstimate.quotaMb} MB available
          </div>
        </div>

        {/* Dataset Records */}
        <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-xs font-medium">Active Database Records</span>
            <Database className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            {customers.length.toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            Persisted across page refreshes
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-xs font-medium">Privacy & Data Sovereignty</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-[#0B1F3A] mt-1">100% Client-Side</div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">
            Customer PII remains strictly in browser storage
          </div>
        </div>
      </div>

      {/* Dataset Version History */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-base text-[#0B1F3A] flex items-center gap-2">
              <History className="w-4 h-4 text-[#C9A227]" />
              <span>Dataset Version History & Audit Trail</span>
            </h3>
            <p className="text-xs text-[#5B6575]">
              Log of all uploads, appends, and replacements committed during session history.
            </p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-1.5 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Download Database JSON Backup</span>
          </button>
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#5B6575]">
            No version history recorded yet. Upload a dataset in the Upload Centre to create version 1.
          </div>
        ) : (
          <div className="border border-[#E3E7EE] rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F5F6F8] text-[#0B1F3A] border-b border-[#E3E7EE]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Source File</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Rows</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Added / Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7EE]">
                {versions.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-[#1A2233]">
                      {new Date(v.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#0B1F3A]">{v.fileName}</td>
                    <td className="py-2 px-3 capitalize">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCE6F3] text-[#0B1F3A]">
                        {v.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{v.rowCount.toLocaleString('en-GB')}</td>
                    <td className="py-2 px-3 text-right text-[#5B6575]">
                      +{v.addedRows} / ~{v.updatedRows}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger Zone: Wipe All Data */}
      <div className="bg-[#F6DDE1] border border-[#A3152B] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-[#7A0C1E] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone: Clear All Application Data</span>
            </h3>
            <p className="text-xs text-[#4D0612] mt-1 max-w-xl leading-relaxed">
              Permanently purges all raw customer records, cleaned data, trained machine learning models, campaign results, and chat history from this browser's IndexedDB. This action cannot be reversed.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-[#7A0C1E] hover:bg-[#4D0612] text-white text-xs font-bold rounded-lg transition shadow-xs shrink-0"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-[#E3E7EE]">
            <h3 className="font-serif font-bold text-lg text-[#7A0C1E] mb-2">
              Confirm Complete Database Purge
            </h3>
            <p className="text-xs text-[#5B6575] leading-relaxed mb-4">
              To prevent accidental deletion, please type{' '}
              <strong className="text-[#0B1F3A] font-mono">DELETE BRITCONNECT DATA</strong> below to confirm.
            </p>

            <input
              type="text"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder="Type confirmation phrase..."
              className="w-full px-3 py-2 text-xs border border-[#A3152B] rounded-lg mb-4 font-mono text-[#0B1F3A]"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTypedConfirm('');
                }}
                className="px-4 py-2 border border-[#E3E7EE] rounded-lg text-xs font-semibold text-[#5B6575] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWipe}
                disabled={typedConfirm !== 'DELETE BRITCONNECT DATA'}
                className="px-4 py-2 bg-[#7A0C1E] hover:bg-[#4D0612] text-white text-xs font-bold rounded-lg transition disabled:opacity-40"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
