// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="text-center p-8">
      <h1 className="text-5xl font-bold mb-4 text-secondary">
        Welcome to Quiet Hours Scheduler
      </h1>
      <p className="mb-8 text-lg opacity-80">
        Your personal space for focused study sessions.
      </p>
      <Link href="/login" className="btn">
  Get Started
</Link>
    </main>
  );
}