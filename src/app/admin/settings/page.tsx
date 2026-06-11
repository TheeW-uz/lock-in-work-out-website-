'use client';

import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Save, 
  Info,
  Shield,
  Sliders,
  Cpu,
  AlertTriangle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Loader2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [minPasswordLength, setMinPasswordLength] = useState(6);
  const [requireVerification, setRequireVerification] = useState(false);
  const [defaultCoachModel, setDefaultCoachModel] = useState('Claude 3.5 Sonnet');
  const [maxAiQueries, setMaxAiQueries] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Lock-In database sync in progress. We will be back shortly.');

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    // Load config from localStorage
    const saved = localStorage.getItem('lockin_system_settings');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setAllowRegistrations(config.allowRegistrations ?? true);
        setMinPasswordLength(config.minPasswordLength ?? 6);
        setRequireVerification(config.requireVerification ?? false);
        setDefaultCoachModel(config.defaultCoachModel ?? 'Claude 3.5 Sonnet');
        setMaxAiQueries(config.maxAiQueries ?? 10);
        setMaintenanceMode(config.maintenanceMode ?? false);
        setMaintenanceMessage(config.maintenanceMessage ?? '');
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ text: '', type: '' });

    const config = {
      allowRegistrations,
      minPasswordLength,
      requireVerification,
      defaultCoachModel,
      maxAiQueries,
      maintenanceMode,
      maintenanceMessage
    };

    setTimeout(() => {
      localStorage.setItem('lockin_system_settings', JSON.stringify(config));
      setSaving(false);
      setStatusMsg({ text: 'Global platform settings updated successfully!', type: 'success' });
      setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
    }, 800);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-8 max-w-4xl">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>System Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Configure global application variables, authentication, and AI parameters.</p>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          statusMsg.type === 'error' 
            ? 'bg-red-950/20 border-red-900/60 text-red-400' 
            : 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400'
        }`}>
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        
        {/* Section 1: Global Platform Settings */}
        <div className="p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
            <Shield className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Access & Registration Settings</h3>
          </div>

          <div className="space-y-4">
            {/* Toggle: Allow registrations */}
            <div className="flex justify-between items-center gap-4">
              <div>
                <span className="font-bold text-slate-200 block">Allow New User Registrations</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Control whether new athletes can register via login portal.</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowRegistrations(prev => !prev)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {allowRegistrations ? (
                  <ToggleRight className="w-9 h-9 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-600" />
                )}
              </button>
            </div>

            {/* Toggle: Require verification */}
            <div className="flex justify-between items-center gap-4 border-t border-slate-900/50 pt-4">
              <div>
                <span className="font-bold text-slate-200 block">Require Email Verification</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Force users to verify their email before accessing user dashboard.</span>
              </div>
              <button
                type="button"
                onClick={() => setRequireVerification(prev => !prev)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {requireVerification ? (
                  <ToggleRight className="w-9 h-9 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-600" />
                )}
              </button>
            </div>

            {/* Input: Min password length */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-900/50 pt-4">
              <div>
                <span className="font-bold text-slate-200 block">Minimum Password Length</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Minimum character boundary required during signup validation.</span>
              </div>
              <input
                type="number"
                min={6}
                max={32}
                value={minPasswordLength}
                onChange={(e) => setMinPasswordLength(parseInt(e.target.value) || 6)}
                className="bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none max-w-xs md:ml-auto w-full"
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI Coach Parameters */}
        <div className="p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
            <Cpu className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">AI Coach Hyperparameters</h3>
          </div>

          <div className="space-y-4">
            {/* Model Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-200 block">Default LLM Core Model</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Select the target AI engine backing user workout planning.</span>
              </div>
              <select
                value={defaultCoachModel}
                onChange={(e) => setDefaultCoachModel(e.target.value)}
                className="bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none max-w-xs md:ml-auto w-full"
              >
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Default)</option>
                <option value="GPT-4o">GPT-4o (High Speed)</option>
                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              </select>
            </div>

            {/* Daily query threshold */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-900/50 pt-4">
              <div>
                <span className="font-bold text-slate-200 block">Daily Query Limits per User</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Maximum number of AI advisor requests a user can make per day.</span>
              </div>
              <input
                type="number"
                min={1}
                max={100}
                value={maxAiQueries}
                onChange={(e) => setMaxAiQueries(parseInt(e.target.value) || 10)}
                className="bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none max-w-xs md:ml-auto w-full"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Maintenance Mode */}
        <div className="p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Maintenance Mode</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <span className="font-bold text-slate-200 block">Enable Maintenance Lockdown</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Block all athlete access and display a maintenance screen.</span>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(prev => !prev)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {maintenanceMode ? (
                  <ToggleRight className="w-9 h-9 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-600" />
                )}
              </button>
            </div>

            {maintenanceMode && (
              <div className="space-y-2 border-t border-slate-900/50 pt-4">
                <label className="font-bold text-slate-200 block">Maintenance HUD Message</label>
                <textarea
                  rows={2}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="w-full bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none placeholder-slate-700 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Submission */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-[0.98]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Commit Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
