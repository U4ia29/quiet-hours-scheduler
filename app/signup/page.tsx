// app/signup/page.tsx
"use client";

import { supabase } from "../../lib/supabaseClient";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
        setMessage("Success! Please check your email for a confirmation link.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-primary/20 border border-secondary/20 rounded-lg shadow-xl">
      <h3 className="text-3xl font-bold text-accent text-center">Create an Account</h3>
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
        <button
          type="submit"
          className="btn"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
        {message && <p className="text-center text-accent/80 mt-4">{message}</p>}
      </form>
      <p className="text-center">
        Already have an account? <Link href="/login" className="text-secondary hover:underline">Log In</Link>
      </p>
    </div>
  );
}