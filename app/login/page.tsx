// app/login/page.tsx
"use client";

import { supabase } from "../../lib/supabaseClient";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Success! Redirecting...");
    router.push('/dashboard');
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-primary/20 border border-secondary/20 rounded-lg shadow-xl">
      <h3 className="text-3xl font-bold text-accent text-center">Login</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@address.com"
          type="email"
          className="p-3 bg-background/50 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="p-3 bg-background/50 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
        <button type="submit" className="btn" disabled={loading}>
  {loading ? 'Logging in...' : 'Login'}
</button>
        {message && <p className="text-center text-accent/80 mt-4">{message}</p>}
      </form>
      <p className="text-center mt-4 text-sm text-foreground/80">
  Don&apos;t have an account?
  <Link href="/signup" className="font-semibold text-secondary hover:underline ml-1">
    Sign Up
  </Link>
</p>
    </div>
  );
}