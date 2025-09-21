"use client";

import { supabase } from "../../lib/supabaseClient";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';

type Schedule = {
  _id: string;
  start_time: string;
  end_time: string;
};

export default function DashboardPage() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/schedules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);
// I want to fetch the schedules as soon as the dashboard page loads,
// so I'll use a `useEffect` hook to call `fetchSchedules` once.
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Creating schedule...');

    const start_time_iso = new Date(startTime).toISOString();
    const end_time_iso = new Date(endTime).toISOString();

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setMessage("Authentication error. Please log in again.");
      return;
    }

    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ start_time: start_time_iso, end_time: end_time_iso })
    });

    const result = await res.json();

    if (res.ok) {
      setMessage("Schedule created successfully!");
      await fetchSchedules(); //This will Re-fetch schedules
      setStartTime('');
      setEndTime('');
    } else {
      setMessage("Error: " + result.error);
    }

    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="w-full max-w-4xl p-8 bg-primary/20 border border-secondary/20 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-3xl font-bold text-accent">Dashboard</h3>
        <button onClick={handleLogout} className="bg-red-500 hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-opacity">
          Logout
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
          <h4 className="text-xl font-semibold text-accent/90">Create New Schedule</h4>
          <div>
            <label htmlFor="start">Start Time:</label>
            <input id="start" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full mt-1 p-2 border border-secondary/30 rounded bg-background/50 text-foreground" required />
          </div>
          <div>
            <label htmlFor="end">End Time:</label>
            <input id="end" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full mt-1 p-2 border border-secondary/30 rounded bg-background/50 text-foreground" required />
          </div>
          <button type="submit" className="btn">
  Create Schedule
</button>
          {message && <p className="text-center text-accent/80 mt-2">{message}</p>}
        </form>

        <div className="mt-10 md:mt-0">
          <h4 className="text-xl font-semibold text-accent/90">Your Schedules</h4>
          {loading ? ( <p className="mt-4">Loading...</p> ) : (
            <ul className="mt-4 space-y-2">
              {schedules.length > 0 ? schedules.map((schedule) => (
                <li key={schedule._id} className="bg-background/50 p-3 rounded-md text-sm">
                  {new Date(schedule.start_time).toLocaleString()} - {new Date(schedule.end_time).toLocaleString()}
                </li>
              )) : (
                <p className="mt-4 text-sm opacity-60">You have no upcoming schedules.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}