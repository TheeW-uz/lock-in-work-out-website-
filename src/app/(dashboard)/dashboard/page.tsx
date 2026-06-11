'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, 
  Flame, 
  Dumbbell, 
  Clock, 
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Zap,
  Activity,
  Award,
  AlertTriangle,
  Heart,
  Loader2
} from 'lucide-react';

interface ExerciseLog {
  name: string;
  category: string;
  difficulty: string;
  sets: number;
  reps: number;
  weight_used: number;
  duration: number; // minutes
  notes?: string;
  completedSets?: number;
  completedReps?: number;
  completedWeight?: number;
  completed?: boolean;
}

export default function DashboardPage() {
  const { user, profile, stats, refreshProfile } = useAuth();
  
  const [workoutName, setWorkoutName] = useState('Rest Day');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [isRestDay, setIsRestDay] = useState(true);
  const [completedToday, setCompletedToday] = useState(false);
  const [completionPct, setCompletionPct] = useState(100);
  const [loggedExercises, setLoggedExercises] = useState<ExerciseLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWorkout, setLoadingWorkout] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [missingDaysChecked, setMissingDaysChecked] = useState(false);

  // Today's date info
  const todayDateStr = new Date().toISOString().split('T')[0];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = daysOfWeek[new Date().getDay()];

  // 1. Auto-Lock Missed Workouts for the last 7 days (on mount)
  const autoLockMissedWorkouts = async (uid: string) => {
    if (missingDaysChecked) return;
    try {
      // Fetch user's weekly plans to know which days are workout days
      const { data: plans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', uid);

      if (!plans || plans.length === 0) return;

      // Get existing daily workout logs for the last 7 days (excluding today)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: recentLogs } = await supabase
        .from('daily_workouts')
        .select('date, status')
        .eq('user_id', uid)
        .gte('date', startDateStr);

      // We will loop through the last 7 days (excluding today)
      const updates = [];
      const pointsInserts = [];

      for (let i = 7; i >= 1; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dDayName = daysOfWeek[d.getDay()];

        // Check if this date has a log
        const logExists = recentLogs?.some(l => l.date === dStr);
        if (logExists) continue; // Already logged (completed, partial, or already marked missed)

        // Find if this day of week was a scheduled workout day (not rest day, has exercises)
        const dayPlan = plans.find(p => p.day_of_week === dDayName);
        if (dayPlan && !dayPlan.is_rest_day && dayPlan.exercises && dayPlan.exercises.length > 0) {
          // This day was missed! Write it to daily_workouts and points_history
          updates.push({
            user_id: uid,
            date: dStr,
            status: 'missed',
            completion_percentage: 0,
            points_earned: -5,
            exercises_logged: dayPlan.exercises
          });

          pointsInserts.push({
            user_id: uid,
            date: dStr,
            points: -5,
            description: `Missed scheduled workout: ${dayPlan.workout_name}`,
            category: 'workout_missed'
          });
        }
      }

      if (updates.length > 0) {
        // Insert missed workouts
        await supabase.from('daily_workouts').insert(updates);
        // Insert point deductions
        await supabase.from('points_history').insert(pointsInserts);
        // Refresh profiles to sync points in sidebar
        await refreshProfile();
      }
      setMissingDaysChecked(true);
    } catch (err) {
      console.error('Error auto-locking missed workouts:', err);
    }
  };

  // 2. Fetch Today's Workout and logs
  const fetchTodayWorkout = async (uid: string) => {
    try {
      setLoadingWorkout(true);
      
      // Check if user already logged today's workout
      const { data: todayLog } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('user_id', uid)
        .eq('date', todayDateStr)
        .single();

      if (todayLog) {
        setCompletedToday(true);
        setWorkoutName(todayLog.status === 'completed' ? 'Completed Day' : 'Logged Workout');
        setExercises(todayLog.exercises_logged || []);
        setIsRestDay(false);
        setCompletionPct(Number(todayLog.completion_percentage));
        setLoadingWorkout(false);
        return;
      }

      // If not logged, fetch the scheduled workout plan for today
      const { data: plan } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', uid)
        .eq('day_of_week', todayDayName)
        .single();

      if (plan) {
        setWorkoutName(plan.workout_name);
        setIsRestDay(plan.is_rest_day);
        
        // Initialize exercises with default log states
        const defaultExercises = (plan.exercises || []).map((ex: any) => ({
          ...ex,
          completedSets: ex.sets,
          completedReps: ex.reps,
          completedWeight: ex.weight_used || 0,
          completed: false
        }));
        setExercises(defaultExercises);
      } else {
        // No plan created at all
        setWorkoutName('Rest Day');
        setIsRestDay(true);
        setExercises([]);
      }
    } catch (err) {
      console.error('Error fetching today workout:', err);
    } finally {
      setLoadingWorkout(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      autoLockMissedWorkouts(user.id);
      fetchTodayWorkout(user.id);
    }
  }, [user]);

  // Handle exercise details edit (reps, sets, weight completed)
  const updateExerciseLog = (index: number, key: keyof ExerciseLog, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [key]: value };
    setExercises(updated);
  };

  // 3. Real-time Estimates
  const calculateEstimates = () => {
    let totalVolume = 0;
    let totalDuration = 0;
    let caloriesBurned = 0;
    const mainMusclesSet = new Set<string>();
    const secondaryMusclesSet = new Set<string>();

    const activeExercises = exercises.filter(ex => !ex.completed || ex.completed === true);

    activeExercises.forEach(ex => {
      // Only count if checked or if manual percentage is set
      const setsDone = ex.completedSets || 0;
      const repsDone = ex.completedReps || 0;
      const weight = ex.completedWeight || 0;
      const duration = ex.duration || 10;
      
      // Volume = sets * reps * weight
      totalVolume += setsDone * repsDone * weight;
      totalDuration += duration;

      // Calories burned estimation based on difficulty (MET values)
      // easy: 4 MET, medium: 6 MET, hard: 8 MET
      // kcal = duration * MET * weight_kg / 60
      const userWeight = profile?.weight || 75; // Default 75kg
      let metVal = 4;
      if (ex.difficulty.toLowerCase() === 'medium') metVal = 6;
      if (ex.difficulty.toLowerCase() === 'hard') metVal = 9;
      
      const exCal = duration * metVal * userWeight / 60;
      caloriesBurned += exCal;

      // Muscle group mapping helper
      const cat = ex.category.toLowerCase();
      if (cat.includes('chest')) {
        mainMusclesSet.add('Chest');
        secondaryMusclesSet.add('Triceps');
        secondaryMusclesSet.add('Shoulders');
      } else if (cat.includes('back')) {
        mainMusclesSet.add('Back');
        secondaryMusclesSet.add('Biceps');
        secondaryMusclesSet.add('Forearms');
      } else if (cat.includes('shoulder')) {
        mainMusclesSet.add('Shoulders');
        secondaryMusclesSet.add('Triceps');
      } else if (cat.includes('bicep')) {
        mainMusclesSet.add('Biceps');
        secondaryMusclesSet.add('Forearms');
      } else if (cat.includes('tricep')) {
        mainMusclesSet.add('Triceps');
      } else if (cat.includes('legs')) {
        mainMusclesSet.add('Quads');
        mainMusclesSet.add('Hamstrings');
        secondaryMusclesSet.add('Calves');
        secondaryMusclesSet.add('Glutes');
      } else if (cat.includes('core')) {
        mainMusclesSet.add('Abs');
        secondaryMusclesSet.add('Obliques');
      } else if (cat.includes('cardio')) {
        mainMusclesSet.add('Cardiovascular System');
        secondaryMusclesSet.add('Legs');
      } else {
        mainMusclesSet.add(ex.category);
      }
    });

    // Clean up secondary muscles (remove main ones)
    mainMusclesSet.forEach(m => secondaryMusclesSet.delete(m));

    // Intensity levels
    let intensity = 'Low';
    if (activeExercises.length > 0) {
      const hardCount = activeExercises.filter(e => e.difficulty.toLowerCase() === 'hard').length;
      const medCount = activeExercises.filter(e => e.difficulty.toLowerCase() === 'medium').length;
      if (hardCount > 0 || medCount > 3) intensity = 'High';
      else if (medCount > 0) intensity = 'Moderate';
    }

    // Recovery difficulty
    let recovery = '12 Hours';
    if (intensity === 'High') recovery = '36-48 Hours';
    else if (intensity === 'Moderate') recovery = '24 Hours';

    return {
      volume: totalVolume,
      duration: totalDuration,
      calories: Math.round(caloriesBurned * (completionPct / 100)),
      mainMuscles: Array.from(mainMusclesSet),
      secondaryMuscles: Array.from(secondaryMusclesSet),
      intensity,
      recovery
    };
  };

  const est = calculateEstimates();

  // 4. Points calculation
  const calculatePointsEarned = () => {
    let base = 10;
    
    // Add difficulty bonus
    let diffBonus = 0;
    exercises.forEach(ex => {
      if (ex.difficulty.toLowerCase() === 'medium') diffBonus += 1;
      if (ex.difficulty.toLowerCase() === 'hard') diffBonus += 2;
    });

    // Add volume bonus (1 point per 1000kg)
    const volBonus = Math.floor(est.volume / 1000);

    // Sum and scale by completion percentage
    const total = Math.round((base + diffBonus + volBonus) * (completionPct / 100));
    return Math.max(0, total);
  };

  const pointsToEarn = calculatePointsEarned();

  // 5. Submit Workout log
  const handleLogWorkout = async () => {
    if (!user) return;
    setSubmitting(true);
    setStatusMessage('');

    try {
      const status = completionPct === 100 ? 'completed' : 'partial';

      // Insert workout log
      const { error: logErr } = await supabase
        .from('daily_workouts')
        .insert({
          user_id: user.id,
          date: todayDateStr,
          status,
          completion_percentage: completionPct,
          points_earned: pointsToEarn,
          exercises_logged: exercises
        });

      if (logErr) throw logErr;

      // Insert points history
      const { error: ptsErr } = await supabase
        .from('points_history')
        .insert({
          user_id: user.id,
          date: todayDateStr,
          points: pointsToEarn,
          description: `Completed ${workoutName} (${completionPct}%)`,
          category: 'workout_completion'
        });

      if (ptsErr) throw ptsErr;

      setCompletedToday(true);
      setStatusMessage('Workout locked in! Points successfully calculated and awarded.');
      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'Failed to submit workout log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">
            {todayDayName}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Daily Arena
          </h1>
        </div>
        
        {/* Streak HUD for active day */}
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2.5 rounded-xl border-zinc-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 animate-bounce" />
            <div>
              <span className="text-zinc-400 text-[10px] block leading-none font-medium">Streak Count</span>
              <span className="text-sm font-bold text-white mt-1 block leading-none">{stats?.streak || 0} Days</span>
            </div>
          </div>
        </div>
      </header>

      {/* STATUS BANNER */}
      {statusMessage && (
        <div className="p-4 rounded-xl border bg-emerald-950/20 border-emerald-900 text-emerald-400 flex items-center gap-3 mb-6 animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{statusMessage}</p>
        </div>
      )}

      {loadingWorkout ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-zinc-500 text-sm">Loading daily arena...</p>
        </div>
      ) : completedToday ? (
        /* TODAY ALREADY LOGGED */
        <div className="max-w-3xl mx-auto text-center py-12 px-6 glass-panel rounded-3xl border-zinc-800">
          <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-800 flex items-center justify-center mx-auto mb-6 text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Today is Locked In!
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
            You completed your training and secured your points. Keep the momentum going tomorrow!
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto text-left">
            <div className="bg-[#10121a] border border-zinc-900 p-4 rounded-xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Status</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">Completed</span>
            </div>
            <div className="bg-[#10121a] border border-zinc-900 p-4 rounded-xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Completion</span>
              <span className="text-sm font-bold text-white mt-1 block">{completionPct}%</span>
            </div>
            <div className="bg-[#10121a] border border-zinc-900 p-4 rounded-xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Points Earned</span>
              <span className="text-sm font-bold text-violet-400 mt-1 block">+{pointsToEarn} Pts</span>
            </div>
            <div className="bg-[#10121a] border border-zinc-900 p-4 rounded-xl">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Est. Calories</span>
              <span className="text-sm font-bold text-white mt-1 block">{est.calories} kcal</span>
            </div>
          </div>
        </div>
      ) : isRestDay ? (
        /* REST DAY SCREEN */
        <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 border-zinc-800 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="w-14 h-14 bg-cyan-950/30 text-cyan-400 border border-cyan-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Recovery & Rest Day
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Rest is where muscles grow. Focus on recovery, active mobility, hydration, and nutrition today.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-md mx-auto mb-6">
            <div className="p-4 bg-[#0d1017] border border-zinc-900 rounded-xl flex gap-3">
              <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <h4 className="text-white text-xs font-bold">Mobility suggestion</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">15 minutes of light full-body static stretching.</p>
              </div>
            </div>
            <div className="p-4 bg-[#0d1017] border border-zinc-900 rounded-xl flex gap-3">
              <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <h4 className="text-white text-xs font-bold">Active Recovery</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5">Keep moving: A light walk or jog to flush metabolites.</p>
              </div>
            </div>
          </div>
        </div>
      ) : exercises.length === 0 ? (
        /* NO EXERCISES IN SCHEDULE */
        <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 border-zinc-800 text-center">
          <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No Exercises Planned
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
            Today is scheduled as {workoutName}, but no exercises have been added yet. Add exercises in the Weekly Split tab or let the AI Coach design a split for you!
          </p>
        </div>
      ) : (
        /* ACTIVE WORKOUT TRACKER */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Exercise list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span>Routine: {workoutName}</span>
                <span className="text-xs bg-violet-600/10 text-violet-400 border border-violet-800/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Active
                </span>
              </h2>
              <span className="text-zinc-500 text-xs">{exercises.length} Exercises</span>
            </div>

            <div className="space-y-4">
              {exercises.map((ex, index) => (
                <div key={index} className="glass-panel p-5 rounded-2xl border-zinc-900 hover:border-zinc-850/80 transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white">{ex.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400">
                        <span className="bg-[#121622] border border-zinc-800 px-2 py-0.5 rounded-md text-[10px] text-zinc-300 font-semibold">{ex.category}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          ex.difficulty.toLowerCase() === 'hard' 
                            ? 'bg-red-950/20 border-red-900/50 text-red-400' 
                            : ex.difficulty.toLowerCase() === 'medium'
                            ? 'bg-amber-950/20 border-amber-900/50 text-amber-500'
                            : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                        }`}>{ex.difficulty}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-500" /> {ex.duration}m</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-[#10121b] border border-zinc-900 p-1.5 rounded-xl text-xs font-semibold">
                      <span className="text-white px-2 py-0.5">{ex.sets} Sets</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-white px-2 py-0.5">{ex.reps} Reps</span>
                      {ex.weight_used > 0 && (
                        <>
                          <span className="text-zinc-600">|</span>
                          <span className="text-white px-2 py-0.5">{ex.weight_used} kg</span>
                        </>
                      )}
                    </div>
                  </div>

                  {ex.notes && (
                    <p className="text-zinc-500 text-xs italic mt-3 bg-[#0a0c10] border border-zinc-950 p-2 rounded-lg">{ex.notes}</p>
                  )}

                  {/* Log inputs for sets/reps/weight */}
                  <div className="mt-4 pt-4 border-t border-zinc-900/80 grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Sets Completed</span>
                      <input 
                        type="number" 
                        min="0"
                        value={ex.completedSets}
                        onChange={(e) => updateExerciseLog(index, 'completedSets', parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Avg Reps Done</span>
                      <input 
                        type="number" 
                        min="0"
                        value={ex.completedReps}
                        onChange={(e) => updateExerciseLog(index, 'completedReps', parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Weight Lifted (kg)</span>
                      <input 
                        type="number" 
                        min="0"
                        value={ex.completedWeight}
                        onChange={(e) => updateExerciseLog(index, 'completedWeight', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estimates panel */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Lock-In Panel
            </h2>
            
            <div className="glass-panel p-6 rounded-3xl border-zinc-900 relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              
              {/* Completion Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-zinc-400 uppercase tracking-wider">Workout Completion</span>
                  <span className="text-violet-400 text-sm font-bold">{completionPct}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="5"
                  value={completionPct}
                  onChange={(e) => setCompletionPct(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <span className="text-[10px] text-zinc-500 leading-normal block">
                  Scale your points based on actual completion level (e.g. if plan is 10 pushups and you did 8, log 80%).
                </span>
              </div>

              {/* Estimate Details */}
              <div className="border-t border-zinc-900 pt-6 space-y-4">
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block">
                  AI & Logic Estimates
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-[#0d1017] p-3 border border-zinc-900 rounded-xl">
                    <Flame className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-zinc-500 text-[9px] uppercase font-semibold block leading-none">Calories</span>
                      <span className="text-sm font-bold text-white mt-1 block leading-none">{est.calories} kcal</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-[#0d1017] p-3 border border-zinc-900 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    <div>
                      <span className="text-zinc-500 text-[9px] uppercase font-semibold block leading-none">Volume</span>
                      <span className="text-sm font-bold text-white mt-1 block leading-none">{est.volume} kg</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#0d1017] p-3 border border-zinc-900 rounded-xl">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="text-zinc-500 text-[9px] uppercase font-semibold block leading-none">Intensity</span>
                      <span className="text-sm font-bold text-white mt-1 block leading-none">{est.intensity}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#0d1017] p-3 border border-zinc-900 rounded-xl">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <div>
                      <span className="text-zinc-500 text-[9px] uppercase font-semibold block leading-none">Recovery</span>
                      <span className="text-sm font-bold text-white mt-1 block leading-none">{est.recovery}</span>
                    </div>
                  </div>
                </div>

                {/* Muscle Groups */}
                {est.mainMuscles.length > 0 && (
                  <div className="space-y-2 pt-2 text-xs">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Primary Target Muscles:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {est.mainMuscles.map(m => (
                          <span key={m} className="bg-emerald-950/20 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded-md text-[10px]">{m}</span>
                        ))}
                      </div>
                    </div>
                    {est.secondaryMuscles.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-[10px] block mt-1">Secondary Synergists:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {est.secondaryMuscles.map(m => (
                            <span key={m} className="bg-zinc-900 text-zinc-400 border border-zinc-800/80 px-2 py-0.5 rounded-md text-[10px]">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 text-[10px] text-zinc-500 border-t border-zinc-950 pt-3">
                  <Info className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
                  <p>Estimates are approximate. Workouts done in today's session cannot be altered after being locked in.</p>
                </div>
              </div>

              {/* Award Summary */}
              <div className="bg-violet-950/15 border border-violet-900/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-950/30 text-violet-400 p-2.5 rounded-xl border border-violet-900/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-zinc-400 text-xs block font-semibold leading-none">Calculated Points</span>
                    <span className="text-zinc-500 text-[9px] mt-0.5 block">Includes volume & difficulty bonuses</span>
                  </div>
                </div>
                <span className="text-xl font-bold text-violet-400">+{pointsToEarn} Pts</span>
              </div>

              {/* Lock in button */}
              <button
                onClick={handleLogWorkout}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl py-3.5 shadow-lg shadow-violet-500/15 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Lock In Workout</span>
                  </>
                )}
              </button>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
