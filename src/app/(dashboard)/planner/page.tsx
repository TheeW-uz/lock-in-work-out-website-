'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  X, 
  Loader2, 
  Calendar, 
  HelpCircle, 
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Dumbbell
} from 'lucide-react';

interface Exercise {
  name: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sets: number;
  reps: number;
  weight_used: number;
  duration: number; // in minutes
  notes?: string;
}

interface DayPlan {
  id?: string;
  day_of_week: string;
  workout_name: string;
  is_rest_day: boolean;
  exercises: Exercise[];
}

export default function PlannerPage() {
  const { user } = useAuth();
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const categories = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 
    'Cardio', 'Mobility', 'Full Body', 'Calisthenics', 'Strength', 
    'Hypertrophy', 'Endurance'
  ];

  const [activeDay, setActiveDay] = useState('Monday');
  const [plans, setPlans] = useState<Record<string, DayPlan>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Exercise Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // New Exercise Fields
  const [exName, setExName] = useState('');
  const [exCategory, setExCategory] = useState('Strength');
  const [exDifficulty, setExDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exWeight, setExWeight] = useState(0);
  const [exDuration, setExDuration] = useState(10);
  const [exNotes, setExNotes] = useState('');

  // 1. Fetch Weekly Plan
  const fetchWeeklyPlan = async (uid: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', uid);

      if (error) throw error;

      // Initialize dictionary
      const plansMap: Record<string, DayPlan> = {};
      daysOfWeek.forEach(d => {
        plansMap[d] = {
          day_of_week: d,
          workout_name: d === 'Saturday' || d === 'Sunday' ? 'Rest Day' : 'Workout Day',
          is_rest_day: d === 'Saturday' || d === 'Sunday',
          exercises: []
        };
      });

      // Populate with DB data
      if (data) {
        data.forEach((row: any) => {
          plansMap[row.day_of_week] = {
            id: row.id,
            day_of_week: row.day_of_week,
            workout_name: row.workout_name,
            is_rest_day: row.is_rest_day,
            exercises: row.exercises || []
          };
        });
      }

      setPlans(plansMap);
    } catch (err: any) {
      console.error('Error fetching weekly plan:', err);
      showStatus('Failed to load weekly plan: ' + (err.message || JSON.stringify(err)), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWeeklyPlan(user.id);
    }
  }, [user]);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    const isSchemaError = text.includes('PGRST205') || text.toLowerCase().includes('could not find the table');
    if (!isSchemaError) {
      setTimeout(() => setStatusMsg({ text: '', type: '' }), 6000);
    }
  };

  // Toggle Rest Day status
  const handleToggleRestDay = (day: string) => {
    const updated = { ...plans };
    const dayPlan = updated[day];
    dayPlan.is_rest_day = !dayPlan.is_rest_day;
    if (dayPlan.is_rest_day) {
      dayPlan.workout_name = 'Rest Day';
      dayPlan.exercises = []; // Rest days have no exercises
    } else {
      dayPlan.workout_name = 'Workout Day';
    }
    setPlans(updated);
  };

  // Change workout name
  const handleWorkoutNameChange = (day: string, name: string) => {
    const updated = { ...plans };
    updated[day].workout_name = name;
    setPlans(updated);
  };

  // Delete exercise
  const handleDeleteExercise = (day: string, index: number) => {
    const updated = { ...plans };
    updated[day].exercises.splice(index, 1);
    setPlans(updated);
    showStatus('Exercise removed from plan.', 'success');
  };

  // Open Edit form
  const handleStartEdit = (index: number) => {
    const ex = plans[activeDay].exercises[index];
    setExName(ex.name);
    setExCategory(ex.category);
    setExDifficulty(ex.difficulty);
    setExSets(ex.sets);
    setExReps(ex.reps);
    setExWeight(ex.weight_used);
    setExDuration(ex.duration);
    setExNotes(ex.notes || '');
    
    setEditingIndex(index);
    setShowAddForm(true);
  };

  // Save or Add Exercise to local plan state
  const handleSaveExerciseLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exName.trim()) {
      showStatus('Exercise name is required', 'error');
      return;
    }

    const updated = { ...plans };
    const dayPlan = updated[activeDay];

    const exerciseItem: Exercise = {
      name: exName.trim(),
      category: exCategory,
      difficulty: exDifficulty,
      sets: Number(exSets),
      reps: Number(exReps),
      weight_used: Number(exWeight),
      duration: Number(exDuration),
      notes: exNotes.trim() || undefined
    };

    if (editingIndex !== null) {
      // Edit mode
      dayPlan.exercises[editingIndex] = exerciseItem;
      showStatus('Exercise updated in plan.', 'success');
    } else {
      // Add mode
      dayPlan.exercises.push(exerciseItem);
      showStatus('Exercise added to plan.', 'success');
    }

    // Reset Form
    resetExForm();
  };

  const resetExForm = () => {
    setExName('');
    setExCategory('Strength');
    setExDifficulty('Medium');
    setExSets(3);
    setExReps(10);
    setExWeight(0);
    setExDuration(10);
    setExNotes('');
    setShowAddForm(false);
    setEditingIndex(null);
  };

  // 2. Save Plan to Supabase DB (For active day)
  const handleSaveDayPlanToDB = async () => {
    if (!user) return;
    setSaving(true);
    const dayPlan = plans[activeDay];

    try {
      // Upsert weekly plan for selected user and day
      const { error } = await supabase
        .from('weekly_plans')
        .upsert({
          user_id: user.id,
          day_of_week: dayPlan.day_of_week,
          workout_name: dayPlan.workout_name,
          is_rest_day: dayPlan.is_rest_day,
          exercises: dayPlan.exercises,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,day_of_week'
        });

      if (error) throw error;
      showStatus(`Plan for ${activeDay} successfully saved to DB!`, 'success');
      
      // Refresh to pull fresh IDs
      await fetchWeeklyPlan(user.id);
    } catch (err: any) {
      console.error(err);
      showStatus(err.message || 'Failed to save plan to database.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeDayPlan = plans[activeDay];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">
            Custom Weekly Schedule
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Workout Split Planner
          </h1>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSaveDayPlanToDB}
          disabled={saving || loading}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl px-5 py-3 shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save {activeDay} Plan</span>
            </>
          )}
        </button>
      </header>

      {/* STATUS BANNER */}
      {statusMsg.text && (
        <div className={`p-5 rounded-2xl border flex flex-col gap-3 mb-6 animate-fadeIn ${
          statusMsg.type === 'error' 
            ? 'bg-red-950/20 border-red-900/60 text-red-300' 
            : 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
        }`}>
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 shrink-0 text-violet-400" />
            <p className="text-sm font-semibold">{statusMsg.text}</p>
          </div>
          {(statusMsg.text.includes('PGRST205') || statusMsg.text.toLowerCase().includes('could not find the table')) && (
            <div className="mt-2 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 text-xs space-y-3 text-zinc-400">
              <p className="font-bold text-white text-sm">💡 Action Required: Run Database Schema Setup</p>
              <p>The Supabase schema cache does not have the <code className="text-violet-400 font-mono font-semibold">weekly_plans</code> table. Follow these steps to initialize your database:</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-violet-400 underline hover:text-violet-300">Supabase Dashboard</a>.</li>
                <li>Go to the <span className="font-bold text-white">SQL Editor</span> tab in the left sidebar.</li>
                <li>Open the <span className="font-mono text-violet-300">schema.sql</span> file located in the root of this workspace.</li>
                <li>Copy its entire contents, paste it into the Supabase SQL editor, and click <span className="font-bold text-white bg-violet-600/30 px-1.5 py-0.5 rounded">Run</span>.</li>
                <li>Once successful, reload this web page.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-zinc-500 text-sm">Loading split planner...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Days of week tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-zinc-900/60">
            {daysOfWeek.map(d => {
              const isSelected = activeDay === d;
              const hasExercises = plans[d]?.exercises.length > 0;
              const isRest = plans[d]?.is_rest_day;
              
              return (
                <button
                  key={d}
                  onClick={() => {
                    setActiveDay(d);
                    resetExForm();
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer border ${
                    isSelected 
                      ? 'bg-violet-600/10 text-violet-400 border-violet-850/60' 
                      : 'bg-[#0d1017] text-zinc-400 border-zinc-900 hover:text-white'
                  }`}
                >
                  <span className="block">{d}</span>
                  <span className="text-[10px] opacity-65 font-medium mt-1 block leading-none">
                    {isRest ? 'Rest' : hasExercises ? `${plans[d].exercises.length} Exs` : 'Empty'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeDayPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Daily configuration and Exercises */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Configuration panel */}
                <div className="glass-panel p-6 rounded-2xl border-zinc-900 space-y-5">
                  <h3 className="text-lg font-bold text-white mb-2">Configure {activeDay}</h3>

                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Rest Day Switch */}
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!activeDayPlan.is_rest_day}
                          onChange={() => handleToggleRestDay(activeDay)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
                      </label>
                      <span className="text-sm font-semibold text-white">
                        {activeDayPlan.is_rest_day ? 'Rest Day Active' : 'Training Day Active'}
                      </span>
                    </div>

                    {/* Workout Day Name */}
                    {!activeDayPlan.is_rest_day && (
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Workout Session Name</label>
                        <input
                          type="text"
                          value={activeDayPlan.workout_name}
                          onChange={(e) => handleWorkoutNameChange(activeDay, e.target.value)}
                          placeholder="e.g., Push Day, Cardio Focus"
                          className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-xl px-4 py-2 text-white text-sm outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Exercises list */}
                {!activeDayPlan.is_rest_day && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-violet-400" />
                        <span>Planned Exercises</span>
                      </h4>
                      
                      {!showAddForm && (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="text-xs text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1.5 cursor-pointer bg-violet-600/5 px-3 py-1.5 rounded-lg border border-violet-850/20"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Exercise
                        </button>
                      )}
                    </div>

                    {activeDayPlan.exercises.length === 0 ? (
                      <div className="glass-panel p-8 text-center rounded-2xl border-zinc-900 border-dashed">
                        <p className="text-zinc-500 text-sm">No exercises added to this training day yet.</p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="mt-3 text-xs text-violet-400 hover:text-white font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          Create first exercise <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeDayPlan.exercises.map((ex, index) => (
                          <div 
                            key={index}
                            className="bg-[#0b0c11] border border-zinc-900 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-zinc-850 transition-colors"
                          >
                            <div className="space-y-1">
                              <h5 className="font-bold text-white text-sm">{ex.name}</h5>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                                <span className="bg-[#121622] text-zinc-400 px-1.5 py-0.5 rounded">{ex.category}</span>
                                <span className="bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded">{ex.difficulty}</span>
                                <span>{ex.sets} sets x {ex.reps} reps</span>
                                {ex.weight_used > 0 && <span>• {ex.weight_used} kg</span>}
                                <span>• {ex.duration}m</span>
                              </div>
                              {ex.notes && <p className="text-zinc-500 text-[11px] italic mt-1.5">{ex.notes}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartEdit(index)}
                                className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                title="Edit exercise"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExercise(activeDay, index)}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete exercise"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeDayPlan.is_rest_day && (
                  <div className="glass-panel p-8 text-center rounded-2xl border-zinc-900">
                    <p className="text-zinc-500 text-sm">Today is marked as Rest Day. Rest is crucial for muscle protein synthesis and nervous system recovery.</p>
                  </div>
                )}

              </div>

              {/* Add / Edit Exercise Form Drawer */}
              <div className="lg:col-span-1">
                {showAddForm && !activeDayPlan.is_rest_day ? (
                  <div className="glass-panel p-5 rounded-2xl border-zinc-900 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <h4 className="font-bold text-white text-sm">
                        {editingIndex !== null ? 'Modify Exercise' : 'Add New Exercise'}
                      </h4>
                      <button 
                        onClick={resetExForm}
                        className="text-zinc-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveExerciseLocal} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Exercise Name</label>
                        <input
                          type="text"
                          required
                          value={exName}
                          onChange={(e) => setExName(e.target.value)}
                          placeholder="e.g., Flat Barbell Bench Press"
                          className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Category / Muscle Group</label>
                        <select
                          value={exCategory}
                          onChange={(e) => setExCategory(e.target.value)}
                          className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Difficulty & Duration */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Difficulty</label>
                          <select
                            value={exDifficulty}
                            onChange={(e) => setExDifficulty(e.target.value as any)}
                            className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Duration (Min)</label>
                          <input
                            type="number"
                            min="1"
                            value={exDuration}
                            onChange={(e) => setExDuration(parseInt(e.target.value) || 0)}
                            className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Sets & Reps */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Sets Target</label>
                          <input
                            type="number"
                            min="1"
                            value={exSets}
                            onChange={(e) => setExSets(parseInt(e.target.value) || 1)}
                            className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Reps Target</label>
                          <input
                            type="number"
                            min="1"
                            value={exReps}
                            onChange={(e) => setExReps(parseInt(e.target.value) || 1)}
                            className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Weight target */}
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Target Weight (kg)</label>
                        <input
                          type="number"
                          min="0"
                          value={exWeight}
                          onChange={(e) => setExWeight(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Training Notes</label>
                        <textarea
                          rows={2}
                          value={exNotes}
                          onChange={(e) => setExNotes(e.target.value)}
                          placeholder="e.g. Focus on deep stretch at the bottom"
                          className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={resetExForm}
                          className="flex-1 bg-[#10121a] border border-zinc-800 text-zinc-400 font-semibold rounded-lg py-2.5 text-xs active:scale-[0.98] transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-lg py-2.5 text-xs active:scale-[0.98] transition-all cursor-pointer"
                        >
                          {editingIndex !== null ? 'Update Ex' : 'Add to Day'}
                        </button>
                      </div>

                    </form>
                  </div>
                ) : (
                  <div className="glass-panel p-5 rounded-2xl border-zinc-900 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span>Planner Tips</span>
                    </h4>
                    
                    <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                      <p>1. Organize your week by scheduling splits (e.g. Push, Pull, Legs, Rest).</p>
                      <p>2. Keep difficulty levels balanced to maximize recovery (Easy = green, Medium = yellow, Hard = red).</p>
                      <p>3. Do not forget to click <strong className="text-white">Save {activeDay} Plan</strong> after making modifications, otherwise changes will not persist in the database.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
