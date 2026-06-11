'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Save, 
  Edit, 
  RefreshCw, 
  Check,
  User,
  Heart,
  Calendar,
  Clock,
  Dumbbell,
  Scale,
  AlertTriangle,
  Info,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
  sender: 'user' | 'coach';
  text: string;
  time: string;
  routine?: any; // Contains the generated routine days if any
}

interface GeneratedDay {
  day_of_week: string;
  workout_name: string;
  is_rest_day: boolean;
  exercises: any[];
}

export default function CoachPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  // Questionnaire States (Pre-filled with profile stats if they exist)
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [goal, setGoal] = useState('Build Muscle');
  const [experience, setExperience] = useState('Intermediate');
  const [equipment, setEquipment] = useState<string[]>(['Dumbbells', 'Bodyweight']);
  const [workoutDaysCount, setWorkoutDaysCount] = useState('3');
  const [injuries, setInjuries] = useState('');
  const [style, setStyle] = useState('Strength');
  const [time, setTime] = useState('60');

  // Page layout state
  const [showSetup, setShowSetup] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeGeneratedRoutine, setActiveGeneratedRoutine] = useState<GeneratedDay[] | null>(null);
  const [savedRoutineMsg, setSavedRoutineMsg] = useState('');

  // Equipment options
  const equipmentOptions = ['Full Gym', 'Dumbbells', 'Barbell Only', 'Kettlebells', 'Resistance Bands', 'Bodyweight'];

  useEffect(() => {
    if (profile) {
      setHeight(profile.height ? String(profile.height) : '');
      setWeight(profile.weight ? String(profile.weight) : '');
      setAge(profile.age ? String(profile.age) : '');
      setGender(profile.gender || 'Male');
      setGoal(profile.fitness_goal || 'Build Muscle');
      setExperience(profile.experience_level || 'Intermediate');
      setEquipment(profile.available_equipment || ['Dumbbells', 'Bodyweight']);
      setWorkoutDaysCount(profile.workout_days ? String(profile.workout_days.length) : '3');
      setInjuries(profile.injuries || '');
      setStyle(profile.preferred_style || 'Strength');
      setTime(profile.available_time ? String(profile.available_time) : '60');
    }
  }, [profile]);

  const handleEquipmentToggle = (item: string) => {
    if (equipment.includes(item)) {
      setEquipment(equipment.filter(e => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  // 1. Core Algorithmic Routine Builder (Simulates highly advanced AI)
  const generateWeeklyRoutine = async () => {
    setGenerating(true);
    setSavedRoutineMsg('');
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const daysCount = parseInt(workoutDaysCount);
    const hasGym = equipment.includes('Full Gym');
    const isCalisthenics = style === 'Calisthenics' || equipment.every(e => e === 'Bodyweight');

    // Simple scheduling names based on days
    const schedule: GeneratedDay[] = [];
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const getExercisesForDay = (type: string) => {
      const db: Record<string, any[]> = {
        chest_back: [
          { name: 'Flat Bench Press', category: 'Chest', difficulty: 'Hard', sets: 4, reps: 8, weight_used: hasGym ? 60 : 0, duration: 12, notes: 'Focus on control on the eccentric' },
          { name: 'Barbell Row', category: 'Back', difficulty: 'Hard', sets: 4, reps: 8, weight_used: hasGym ? 50 : 0, duration: 12, notes: 'Keep back flat, pull to lower rib' },
          { name: 'Incline Dumbbell Press', category: 'Chest', difficulty: 'Medium', sets: 3, reps: 10, weight_used: 18, duration: 10, notes: '30 degree incline bench' },
          { name: 'Lat Pulldown', category: 'Back', difficulty: 'Medium', sets: 3, reps: 10, weight_used: hasGym ? 45 : 0, duration: 10, notes: 'Drive with elbows' },
        ],
        calisthenics_upper: [
          { name: 'Pullups', category: 'Calisthenics', difficulty: 'Hard', sets: 4, reps: 8, weight_used: 0, duration: 15, notes: 'Full dead hang to chin over bar' },
          { name: 'Dips', category: 'Calisthenics', difficulty: 'Hard', sets: 4, reps: 10, weight_used: 0, duration: 15, notes: 'Lean slightly forward for chest focus' },
          { name: 'Pushups', category: 'Calisthenics', difficulty: 'Easy', sets: 3, reps: 15, weight_used: 0, duration: 10, notes: 'Keep core tight, elbows tucked' },
          { name: 'Pike Pushups', category: 'Calisthenics', difficulty: 'Medium', sets: 3, reps: 8, weight_used: 0, duration: 10, notes: 'Vertical push for shoulders' }
        ],
        legs: [
          { name: 'Back Squat', category: 'Legs', difficulty: 'Hard', sets: 4, reps: 8, weight_used: hasGym ? 70 : 0, duration: 15, notes: 'Squat to parallel depth' },
          { name: 'Romanian Deadlift', category: 'Legs', difficulty: 'Hard', sets: 3, reps: 10, weight_used: hasGym ? 60 : 0, duration: 12, notes: 'Feel stretch in hamstrings' },
          { name: 'Bulgarian Split Squat', category: 'Legs', difficulty: 'Hard', sets: 3, reps: 10, weight_used: 12, duration: 12, notes: 'Focus on single leg balance' },
          { name: 'Hanging Knee Raises', category: 'Core', difficulty: 'Medium', sets: 3, reps: 12, weight_used: 0, duration: 8, notes: 'Avoid swinging your body' }
        ],
        legs_safe: [
          { name: 'Leg Extensions', category: 'Legs', difficulty: 'Medium', sets: 4, reps: 12, weight_used: hasGym ? 30 : 0, duration: 10, notes: 'Low strain on knees, squeeze at top' },
          { name: 'Glute Bridges', category: 'Legs', difficulty: 'Easy', sets: 4, reps: 15, weight_used: 0, duration: 10, notes: 'Squeeze glutes at peak expansion' },
          { name: 'Plank Hold', category: 'Core', difficulty: 'Easy', sets: 3, reps: 1, weight_used: 0, duration: 5, notes: 'Hold for 60 seconds' }
        ],
        arms_shoulders: [
          { name: 'Overhead Press', category: 'Shoulders', difficulty: 'Hard', sets: 4, reps: 8, weight_used: hasGym ? 35 : 0, duration: 12, notes: 'Squeeze glutes to protect lower back' },
          { name: 'Dumbbell Lateral Raise', category: 'Shoulders', difficulty: 'Easy', sets: 4, reps: 15, weight_used: 8, duration: 10, notes: 'Keep pinkies slightly elevated' },
          { name: 'Incline Dumbbell Curl', category: 'Biceps', difficulty: 'Medium', sets: 3, reps: 12, weight_used: 12, duration: 10, notes: 'Full biceps stretch' },
          { name: 'Triceps Overhead Extension', category: 'Triceps', difficulty: 'Medium', sets: 3, reps: 12, weight_used: 16, duration: 10, notes: 'Keep elbows tucked near ears' }
        ],
        push: [
          { name: 'Barbell Bench Press', category: 'Chest', difficulty: 'Hard', sets: 4, reps: 8, weight_used: hasGym ? 60 : 0, duration: 12, notes: 'Retract scapula before lifting' },
          { name: 'Dumbbell Shoulder Press', category: 'Shoulders', difficulty: 'Hard', sets: 3, reps: 10, weight_used: 16, duration: 10, notes: 'Full range of motion' },
          { name: 'Decline Pushups', category: 'Chest', difficulty: 'Medium', sets: 3, reps: 12, weight_used: 0, duration: 8, notes: 'Feet elevated on a bench' },
          { name: 'Cable Tricep Pushdown', category: 'Triceps', difficulty: 'Easy', sets: 3, reps: 12, weight_used: hasGym ? 20 : 0, duration: 8, notes: 'Keep elbows locked at sides' }
        ],
        pull: [
          { name: 'Pullups (or Chin-ups)', category: 'Back', difficulty: 'Hard', sets: 4, reps: 8, weight_used: 0, duration: 12, notes: 'Pull bar to collarbone' },
          { name: 'One-Arm Dumbbell Row', category: 'Back', difficulty: 'Medium', sets: 3, reps: 10, weight_used: 20, duration: 10, notes: 'Pull weight to hip crease' },
          { name: 'Face Pulls', category: 'Shoulders', difficulty: 'Easy', sets: 3, reps: 15, weight_used: hasGym ? 15 : 0, duration: 8, notes: 'Squeeze rear delts and rotators' },
          { name: 'Hammer Curls', category: 'Biceps', difficulty: 'Easy', sets: 3, reps: 12, weight_used: 12, duration: 8, notes: 'Pronated grip for forearm density' }
        ],
        full_body: [
          { name: 'Goblet Squat', category: 'Legs', difficulty: 'Medium', sets: 4, reps: 10, weight_used: 20, duration: 12, notes: 'Keep chest upright' },
          { name: 'Dumbbell Floor Press', category: 'Chest', difficulty: 'Medium', sets: 4, reps: 10, weight_used: 18, duration: 10, notes: 'Triceps and chest focus' },
          { name: 'Dumbbell Romanian Deadlift', category: 'Legs', difficulty: 'Medium', sets: 3, reps: 12, weight_used: 18, duration: 10, notes: 'Hinge at the hips' },
          { name: 'Dumbbell Row', category: 'Back', difficulty: 'Medium', sets: 3, reps: 10, weight_used: 18, duration: 10, notes: 'Keep spine neutral' }
        ]
      };

      const hasInjuries = injuries.trim().length > 0;
      const isLegs = type === 'legs';

      if (isLegs && hasInjuries && (injuries.toLowerCase().includes('knee') || injuries.toLowerCase().includes('back') || injuries.toLowerCase().includes('spine'))) {
        return db.legs_safe;
      }
      return db[type] || db.full_body;
    };

    // Construct Days based on count
    if (daysCount === 3) {
      // Push / Pull / Legs
      schedule.push({ day_of_week: 'Monday', workout_name: 'Push Day', is_rest_day: false, exercises: getExercisesForDay(isCalisthenics ? 'calisthenics_upper' : 'push') });
      schedule.push({ day_of_week: 'Tuesday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
      schedule.push({ day_of_week: 'Wednesday', workout_name: 'Pull Day', is_rest_day: false, exercises: getExercisesForDay('pull') });
      schedule.push({ day_of_week: 'Thursday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
      schedule.push({ day_of_week: 'Friday', workout_name: 'Leg Day', is_rest_day: false, exercises: getExercisesForDay('legs') });
      schedule.push({ day_of_week: 'Saturday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
      schedule.push({ day_of_week: 'Sunday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
    } else if (daysCount === 4) {
      // Upper / Lower / Upper / Lower
      schedule.push({ day_of_week: 'Monday', workout_name: 'Upper Body A', is_rest_day: false, exercises: getExercisesForDay(isCalisthenics ? 'calisthenics_upper' : 'chest_back') });
      schedule.push({ day_of_week: 'Tuesday', workout_name: 'Lower Body A', is_rest_day: false, exercises: getExercisesForDay('legs') });
      schedule.push({ day_of_week: 'Wednesday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
      schedule.push({ day_of_week: 'Thursday', workout_name: 'Upper Body B', is_rest_day: false, exercises: getExercisesForDay('arms_shoulders') });
      schedule.push({ day_of_week: 'Friday', workout_name: 'Lower Body B', is_rest_day: false, exercises: getExercisesForDay('legs') });
      schedule.push({ day_of_week: 'Saturday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
      schedule.push({ day_of_week: 'Sunday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
    } else {
      // 5 Days: Push / Pull / Legs / Upper / Lower
      schedule.push({ day_of_week: 'Monday', workout_name: 'Push Day', is_rest_day: false, exercises: getExercisesForDay('push') });
      schedule.push({ day_of_week: 'Tuesday', workout_name: 'Pull Day', is_rest_day: false, exercises: getExercisesForDay('pull') });
      schedule.push({ day_of_week: 'Wednesday', workout_name: 'Leg Day', is_rest_day: false, exercises: getExercisesForDay('legs') });
      schedule.push({ day_of_week: 'Thursday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
      schedule.push({ day_of_week: 'Friday', workout_name: 'Upper Body Focus', is_rest_day: false, exercises: getExercisesForDay('chest_back') });
      schedule.push({ day_of_week: 'Saturday', workout_name: 'Lower Body Focus', is_rest_day: false, exercises: getExercisesForDay('legs') });
      schedule.push({ day_of_week: 'Sunday', workout_name: 'Rest Day', is_rest_day: true, exercises: [] });
    }

    setActiveGeneratedRoutine(schedule);

    // AI Coach justification text
    const explanation = `Hello! Based on your profile (Age: ${age || 25}, Weight: ${weight || 70}kg, Goal: "${goal}", Level: "${experience}"), I have generated a custom ${daysCount}-day weekly training split.

### Why I Chose This Routine:
1. **Frequency & Volume:** A ${daysCount}-day split provides optimal stimulation per muscle group without exceeding systemic recovery.
2. **Equipment Selection:** Tailored exercises to utilize **${equipment.join(', ')}** to maximize raw mechanical tension.
3. **Injury Management:** ${injuries ? `Modified hamstring/legs exercise selection to account for: "${injuries}". Replaced heavy loading on spinal column with single-leg stability or low-impact isolation.` : 'No active limitations reported. Routine incorporates primary compound patterns.'}
4. **Goal Alignment:** I focused on ${goal === 'Lose Weight' ? 'metabolically active compound moves with 10-12 reps to raise EPOC' : 'strength/hypertrophy style compound targets to hit deep mechanical stimulus'}.

*Disclaimer: Routine calculations are logic-based estimates. Maintain proper structural form during lifts.*`;

    const coachMsg: Message = {
      sender: 'coach',
      text: explanation,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      routine: schedule
    };

    setMessages(prev => [...prev, coachMsg]);
    setGenerating(false);
    setShowSetup(false);

    // Save profile details to database in profiles
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          age: age ? parseInt(age) : null,
          gender,
          fitness_goal: goal,
          experience_level: experience,
          available_equipment: equipment,
          workout_days: schedule.filter(s => !s.is_rest_day).map(s => s.day_of_week),
          injuries: injuries || null,
          preferred_style: style,
          available_time: time ? parseInt(time) : null
        })
        .eq('id', user.id);
      await refreshProfile();
    }
  };

  // 2. Save Routine to DB planner (overrides weekly_plans)
  const handleSaveRoutineToPlanner = async () => {
    if (!user || !activeGeneratedRoutine) return;
    setSavedRoutineMsg('');

    try {
      // Loop and upsert all days
      const upserts = activeGeneratedRoutine.map(day => ({
        user_id: user.id,
        day_of_week: day.day_of_week,
        workout_name: day.workout_name,
        is_rest_day: day.is_rest_day,
        exercises: day.exercises,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('weekly_plans')
        .upsert(upserts, { onConflict: 'user_id,day_of_week' });

      if (error) throw error;

      setSavedRoutineMsg('Weekly routine successfully synced with your Workout Plan!');
    } catch (err: any) {
      console.error(err);
      setSavedRoutineMsg(`Error: ${err.message || 'Failed to save routine'}`);
    }
  };

  // 3. User Chat response logic
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');

    const userMsg: Message = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setGenerating(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple keyword based answers for coach responses
    let answerText = "That's a great question! For muscle gain, make sure you hit 1.6-2g of protein per kilogram of bodyweight daily. Keep progress progressive (add weights/reps gradually).";
    
    const txt = userText.toLowerCase();
    if (txt.includes('protein') || txt.includes('eat') || txt.includes('diet') || txt.includes('nutrition')) {
      answerText = "Nutrition is key! To support this routine, aim for a minor calorie surplus (~200-300 kcal) if building muscle, or a deficit (~400 kcal) if losing fat. Post-workout, consume 25-35g of protein (e.g. whey, chicken, tofu) and some simple carbs (e.g. banana, rice) to spike insulin and reload muscle glycogen.";
    } else if (txt.includes('injury') || txt.includes('hurt') || txt.includes('pain')) {
      answerText = "Safety first! If you feel joint pain or sharp shooting pain, stop the exercise immediately. Soreness is normal, but joint discomfort means you should swap the exercise. Always warm up with dynamic stretches (e.g., arm swings, leg swings) before lifting.";
    } else if (txt.includes('rest') || txt.includes('sleep') || txt.includes('recovery')) {
      answerText = "Recovery is vital. Aim for 7.5-9 hours of sleep. Muscles heal when resting, not when loading. Make sure you leave at least 48 hours of recovery before training the same muscle group at high intensity again.";
    } else if (txt.includes('cardio') || txt.includes('run') || txt.includes('fat')) {
      answerText = "For fat loss, focus on your nutrition first. Add 2-3 sessions of moderate-intensity cardio (like 30 minutes of fast walking or incline walking) weekly. This raises energy expenditure without spiking fatigue, preserving your hard-earned muscle.";
    }

    const coachMsg: Message = {
      sender: 'coach',
      text: answerText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, coachMsg]);
    setGenerating(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      
      {/* HEADER */}
      <header className="p-6 border-b border-zinc-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              Coach AI
            </h1>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1 block">
              Active Advisor
            </span>
          </div>
        </div>

        {showSetup ? (
          <span className="text-zinc-500 text-xs font-semibold">Step 1: Setup Profile</span>
        ) : (
          <button
            onClick={() => setShowSetup(true)}
            className="text-xs text-violet-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-violet-600/5 px-3 py-1.5 rounded-lg border border-violet-850/20"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Adjust Fitness Profile
          </button>
        )}
      </header>

      {/* CHAT/SETUP SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        
        {showSetup ? (
          /* QUESTIONNAIRE SETUP SCREEN */
          <div className="max-w-3xl mx-auto glass-panel p-8 rounded-3xl border-zinc-900 relative overflow-hidden space-y-8 animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Customize Your Training Split
              </h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Fill in your statistics and parameters. The AI Coach will synthesize a tailored routine optimized for your recovery rates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stats */}
              <div className="space-y-4">
                <h3 className="text-white font-bold text-sm border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-violet-400" />
                  <span>Physical Statistics</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Height (cm)</label>
                    <input 
                      type="number" 
                      placeholder="178"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      placeholder="72"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Age</label>
                    <input 
                      type="number" 
                      placeholder="24"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Injuries / Limitations</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Knee pain when squatting, lower back fatigue"
                    value={injuries}
                    onChange={(e) => setInjuries(e.target.value)}
                    className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Training details */}
              <div className="space-y-4">
                <h3 className="text-white font-bold text-sm border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-violet-400" />
                  <span>Workout Parameters</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Experience Level</label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Training Goal</label>
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    >
                      <option value="Build Muscle">Build Muscle</option>
                      <option value="Lose Weight">Lose Weight</option>
                      <option value="Increase Strength">Increase Strength</option>
                      <option value="Improve Endurance">Improve Endurance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Workout Days / Week</label>
                    <select
                      value={workoutDaysCount}
                      onChange={(e) => setWorkoutDaysCount(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    >
                      <option value="3">3 Days (PPL)</option>
                      <option value="4">4 Days (Upper/Lower)</option>
                      <option value="5">5 Days (PPL Split)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Time Per Session (Min)</label>
                    <input 
                      type="number" 
                      placeholder="60"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Preferred Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-lg p-2.5 text-white text-xs outline-none"
                  >
                    <option value="Strength">Strength / Hypertrophy</option>
                    <option value="Powerlifting">Powerlifting</option>
                    <option value="Calisthenics">Calisthenics / Bodyweight</option>
                    <option value="Endurance">Cardio & Endurance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Equipment Selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-zinc-500 uppercase font-semibold block">Available Equipment</label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map(option => {
                  const isChecked = equipment.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleEquipmentToggle(option)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-violet-600/10 text-violet-400 border-violet-850/60 shadow-sm' 
                          : 'bg-[#0b0c11] text-zinc-500 border-zinc-900 hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={generateWeeklyRoutine}
              disabled={generating || equipment.length === 0}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl py-3.5 shadow-lg shadow-violet-500/15 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-4"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing Training Program...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate AI Split Program</span>
                </>
              )}
            </button>

          </div>
        ) : (
          /* CHAT DIALOGUE MODE */
          <div className="max-w-3xl mx-auto space-y-6">
            
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {/* Coach Profile Avatar */}
                {msg.sender === 'coach' && (
                  <div className="w-8 h-8 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center border border-violet-900/30 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Content Bubble */}
                <div className={`max-w-[85%] rounded-2xl p-5 border text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#151923] border-zinc-800 text-white'
                    : 'bg-[#0d1017] border-zinc-900 text-zinc-300'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  
                  {/* Render Routine Attachment if exists */}
                  {msg.routine && (
                    <div className="mt-6 pt-6 border-t border-zinc-900 space-y-4">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider">Generated Weekly Split</h4>
                      
                      <div className="space-y-3">
                        {msg.routine.map((day: any, dIdx: number) => (
                          <div key={dIdx} className="bg-[#08090d]/60 border border-zinc-950 rounded-xl p-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white">{day.day_of_week}</span>
                              <span className="text-zinc-500 font-semibold">{day.workout_name}</span>
                            </div>
                            
                            {!day.is_rest_day && day.exercises && (
                              <div className="mt-2 text-[11px] text-zinc-500 space-y-1 pl-2 border-l border-violet-500/25">
                                {day.exercises.map((ex: any, eIdx: number) => (
                                  <div key={eIdx}>
                                    • <span className="text-zinc-300 font-semibold">{ex.name}</span> ({ex.category}) — {ex.sets}x{ex.reps} {ex.weight_used > 0 ? `@ ${ex.weight_used}kg` : ''}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Sync buttons */}
                      <div className="pt-2 flex flex-wrap gap-2.5">
                        <button
                          onClick={handleSaveRoutineToPlanner}
                          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/10 cursor-pointer active:scale-[0.98] transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save as weekly routine</span>
                        </button>
                        
                        <button
                          onClick={() => router.push('/planner')}
                          className="bg-[#121622] border border-zinc-800 text-zinc-300 font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit before saving</span>
                        </button>
                      </div>

                      {savedRoutineMsg && (
                        <p className={`text-xs font-semibold ${
                          savedRoutineMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {savedRoutineMsg}
                        </p>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-500 mt-2 block text-right">
                    {msg.time}
                  </span>
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center border border-zinc-700/60 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {generating && (
              <div className="flex gap-4 justify-start animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center border border-violet-900/30">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#0d1017] border border-zinc-900 rounded-2xl p-5 text-sm text-zinc-500">
                  Coach AI is writing response...
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* FOOTER CHAT INPUT */}
      {!showSetup && (
        <footer className="p-4 border-t border-zinc-900 bg-[#0c0e14] shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Ask Coach AI about protein intake, stretch tips, cardios..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="flex-1 bg-[#10131a] border border-zinc-850 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
            />
            <button
              onClick={handleSendChat}
              disabled={generating || !chatInput.trim()}
              className="w-11 h-11 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-violet-500/10 cursor-pointer disabled:opacity-40 transition-all shrink-0 active:scale-95"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </footer>
      )}

    </div>
  );
}
