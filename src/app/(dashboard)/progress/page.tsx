'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Moon,
  Lock,
  Loader2,
  Trophy,
  Dumbbell,
  Flame,
  TrendingUp,
} from 'lucide-react';

interface DayData {
  date: string; // YYYY-MM-DD
  status: 'completed' | 'partial' | 'missed' | 'rest' | 'unlogged' | 'future';
  completion_percentage?: number;
  points_earned?: number;
  exercises_logged?: any[];
}

interface DayDetail {
  planned: any | null;
  logged: DayData | null;
  pointsHistory: any[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getStatusConfig(status: DayData['status']) {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-emerald-950/60 border-emerald-700/60 hover:border-emerald-600',
        dot: 'bg-emerald-400',
        text: 'text-emerald-400',
        icon: CheckCircle,
        label: 'Completed',
      };
    case 'partial':
      return {
        bg: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-700',
        dot: 'bg-amber-400',
        text: 'text-amber-400',
        icon: AlertCircle,
        label: 'Partial',
      };
    case 'missed':
      return {
        bg: 'bg-red-950/40 border-red-900/60 hover:border-red-800',
        dot: 'bg-red-500',
        text: 'text-red-400',
        icon: XCircle,
        label: 'Missed',
      };
    case 'rest':
      return {
        bg: 'bg-cyan-950/30 border-cyan-900/50 hover:border-cyan-800',
        dot: 'bg-cyan-400',
        text: 'text-cyan-400',
        icon: Moon,
        label: 'Rest Day',
      };
    case 'future':
      return {
        bg: 'bg-zinc-900/30 border-zinc-800/30',
        dot: 'bg-zinc-600',
        text: 'text-zinc-600',
        icon: Lock,
        label: 'Upcoming',
      };
    default:
      return {
        bg: 'bg-zinc-900/20 border-zinc-800/40 hover:border-zinc-700',
        dot: 'bg-zinc-700',
        text: 'text-zinc-500',
        icon: Dumbbell,
        label: 'Unlogged',
      };
  }
}

export default function ProgressPage() {
  const { user } = useAuth();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
  const [weeklyPlans, setWeeklyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DayDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchMonthData = useCallback(
    async (uid: string, year: number, month: number) => {
      setLoading(true);
      try {
        const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0);
        const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

        // Fetch daily workout logs for month
        const { data: logs } = await supabase
          .from('daily_workouts')
          .select('date, status, completion_percentage, points_earned, exercises_logged')
          .eq('user_id', uid)
          .gte('date', firstDay)
          .lte('date', lastDayStr);

        // Fetch weekly plans (to identify rest days)
        const { data: plans } = await supabase
          .from('weekly_plans')
          .select('day_of_week, workout_name, is_rest_day')
          .eq('user_id', uid);

        setWeeklyPlans(plans || []);

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayStr = today.toISOString().split('T')[0];
        const dataMap: Record<string, DayData> = {};

        // Build calendar
        for (let d = 1; d <= lastDay.getDate(); d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dateObj = new Date(year, month, d);
          const dayName = daysOfWeek[dateObj.getDay()];
          const log = logs?.find(l => l.date === dateStr);
          const plan = plans?.find(p => p.day_of_week === dayName);
          const isFuture = dateStr > todayStr;

          let status: DayData['status'] = 'unlogged';

          if (isFuture) {
            status = 'future';
          } else if (log) {
            status = log.status as any;
          } else if (plan?.is_rest_day) {
            status = 'rest';
          }

          dataMap[dateStr] = {
            date: dateStr,
            status,
            completion_percentage: log?.completion_percentage,
            points_earned: log?.points_earned,
            exercises_logged: log?.exercises_logged,
          };
        }

        setCalendarData(dataMap);
      } catch (err) {
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user?.id) {
      fetchMonthData(user.id, viewYear, viewMonth);
    }
  }, [user, viewYear, viewMonth, fetchMonthData]);

  const fetchDayDetail = async (dateStr: string) => {
    if (!user?.id) return;
    setLoadingDetail(true);
    try {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = daysOfWeek[dateObj.getDay()];

      const [logRes, planRes, ptsRes] = await Promise.all([
        supabase
          .from('daily_workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .single(),
        supabase
          .from('weekly_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('day_of_week', dayName)
          .single(),
        supabase
          .from('points_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', dateStr),
      ]);

      setSelectedDetail({
        planned: planRes.data,
        logged: logRes.data
          ? {
              date: logRes.data.date,
              status: logRes.data.status,
              completion_percentage: logRes.data.completion_percentage,
              points_earned: logRes.data.points_earned,
              exercises_logged: logRes.data.exercises_logged,
            }
          : null,
        pointsHistory: ptsRes.data || [],
      });
    } catch (err) {
      console.error('Error fetching day detail:', err);
      setSelectedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDayClick = (dateStr: string) => {
    const day = calendarData[dateStr];
    if (!day || day.status === 'future') return;
    setSelectedDate(dateStr);
    fetchDayDetail(dateStr);
  };

  // Monthly summary stats
  const completedDays = Object.values(calendarData).filter(d => d.status === 'completed').length;
  const partialDays = Object.values(calendarData).filter(d => d.status === 'partial').length;
  const missedDays = Object.values(calendarData).filter(d => d.status === 'missed').length;
  const totalWorkoutDays = completedDays + partialDays + missedDays;
  const monthPct = totalWorkoutDays > 0 ? Math.round(((completedDays + partialDays * 0.5) / totalWorkoutDays) * 100) : 0;

  // Build calendar grid
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday-first grid: getDay() returns 0=Sun,1=Mon...6=Sat
  // We want Mon=0 in our grid
  let startOffset = firstOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6; // Sunday -> offset 6

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split('T')[0];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    const now = new Date();
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">

      {/* HEADER */}
      <header className="mb-8 border-b border-zinc-900 pb-6">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">
          Monthly Overview
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>
          Progress Calendar
        </h1>
      </header>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-2xl border-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Completion</span>
          </div>
          <p className="text-2xl font-extrabold text-white">{monthPct}%</p>
          <p className="text-zinc-500 text-xs mt-1">This month</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Completed</span>
          </div>
          <p className="text-2xl font-extrabold text-white">{completedDays}</p>
          <p className="text-zinc-500 text-xs mt-1">Workouts done</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Missed</span>
          </div>
          <p className="text-2xl font-extrabold text-white">{missedDays}</p>
          <p className="text-zinc-500 text-xs mt-1">Workouts skipped</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-violet-400" />
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Partial</span>
          </div>
          <p className="text-2xl font-extrabold text-white">{partialDays}</p>
          <p className="text-zinc-500 text-xs mt-1">Partially done</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* CALENDAR */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border-zinc-900">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAYS_HEADER.map(d => (
              <div key={d} className="text-center text-[10px] text-zinc-600 font-bold uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((dateStr, idx) => {
                if (!dateStr) {
                  return <div key={`empty-${idx}`} className="h-12" />;
                }
                const day = calendarData[dateStr];
                const config = day ? getStatusConfig(day.status) : getStatusConfig('unlogged');
                const dayNum = parseInt(dateStr.split('-')[2]);
                const isToday = dateStr === todayStr;
                const isSelected = selectedDate === dateStr;
                const isClickable = day && day.status !== 'future';

                return (
                  <button
                    key={dateStr}
                    onClick={() => isClickable && handleDayClick(dateStr)}
                    disabled={!isClickable}
                    title={`${dateStr}: ${config.label}${day?.completion_percentage != null ? ` (${day.completion_percentage}%)` : ''}`}
                    className={`h-12 flex flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-all duration-150 relative
                      ${config.bg}
                      ${isSelected ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0d1017]' : ''}
                      ${isToday && !isSelected ? 'ring-1 ring-violet-500/50 ring-offset-1 ring-offset-[#0d1017]' : ''}
                      ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <span className={`text-[11px] font-bold ${isToday ? 'text-violet-400' : 'text-zinc-300'}`}>
                      {dayNum}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${config.dot}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-zinc-900">
            {[
              { status: 'completed' as const, label: 'Completed' },
              { status: 'partial' as const, label: 'Partial' },
              { status: 'missed' as const, label: 'Missed' },
              { status: 'rest' as const, label: 'Rest' },
              { status: 'unlogged' as const, label: 'Unlogged' },
            ].map(({ status, label }) => {
              const c = getStatusConfig(status);
              return (
                <div key={status} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* DAY DETAIL PANEL */}
        <div className="lg:col-span-1">
          {!selectedDate ? (
            <div className="glass-panel rounded-3xl p-6 border-zinc-900 border-dashed text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">
                Click any past day on the calendar to see detailed workout info.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="glass-panel rounded-3xl p-6 border-zinc-900 flex justify-center py-12">
              <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
            </div>
          ) : selectedDetail ? (
            <div className="glass-panel rounded-3xl p-6 border-zinc-900 space-y-5">
              {/* Date */}
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Selected Date</p>
                <p className="text-white font-bold text-base mt-0.5">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Status */}
              {selectedDetail.logged ? (
                <>
                  <div className="flex items-center justify-between bg-[#0a0c10] border border-zinc-900 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">Status</p>
                      <p className={`text-sm font-bold mt-0.5 ${getStatusConfig(selectedDetail.logged.status).text}`}>
                        {getStatusConfig(selectedDetail.logged.status).label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">Completion</p>
                      <p className="text-white font-bold text-sm mt-0.5">
                        {selectedDetail.logged.completion_percentage ?? 0}%
                      </p>
                    </div>
                  </div>

                  {/* Points */}
                  {selectedDetail.pointsHistory.length > 0 && (
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Points Activity</p>
                      <div className="space-y-2">
                        {selectedDetail.pointsHistory.map((ph, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-[#0a0c10] border border-zinc-900 rounded-lg px-3 py-2">
                            <span className="text-zinc-400 truncate max-w-[140px]">{ph.description}</span>
                            <span className={`font-bold shrink-0 ml-2 ${ph.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {ph.points >= 0 ? '+' : ''}{ph.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercises Logged */}
                  {selectedDetail.logged.exercises_logged && selectedDetail.logged.exercises_logged.length > 0 && (
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">
                        Exercises ({selectedDetail.logged.exercises_logged.length})
                      </p>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {selectedDetail.logged.exercises_logged.map((ex: any, i: number) => (
                          <div key={i} className="bg-[#0a0c10] border border-zinc-900 rounded-lg px-3 py-2">
                            <p className="text-white text-xs font-semibold">{ex.name}</p>
                            <p className="text-zinc-500 text-[10px] mt-0.5">
                              {ex.sets} sets × {ex.reps} reps
                              {ex.weight_used > 0 ? ` · ${ex.weight_used}kg` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : selectedDetail.planned?.is_rest_day ? (
                <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-xl p-4 text-center">
                  <Moon className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                  <p className="text-cyan-400 text-sm font-semibold">Rest Day</p>
                  <p className="text-zinc-500 text-xs mt-1">No workout scheduled</p>
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 text-center">
                  <Dumbbell className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm font-semibold">No log found</p>
                  {selectedDetail.planned ? (
                    <p className="text-zinc-500 text-xs mt-1">
                      Was planned: {selectedDetail.planned.workout_name}
                    </p>
                  ) : (
                    <p className="text-zinc-500 text-xs mt-1">No workout was scheduled</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-6 border-zinc-900 text-center">
              <p className="text-zinc-500 text-sm">Could not load day details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
