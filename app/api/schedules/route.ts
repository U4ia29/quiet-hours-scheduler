// app/api/schedules/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

// Helper function to verify the token 
async function getUserFromSupabaseToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    }
  });
  if (!res.ok) return null;
  return res.json();
}
//new GET function 

export async function GET(request: NextRequest) {
  // 1. Verify if the user is authenticated
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await getUserFromSupabaseToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // 2. Connect to the database and get the schedules for this user
    const client = await clientPromise;
    const db = client.db('quiet_hours');
    const col = db.collection('schedules');

    // Find all schedules for the user and sort them by start time
    const schedules = await col.find({ user_id: user.id }).sort({ start_time: 1 }).toArray();

    // 3. Return the list of schedules
    return NextResponse.json({ schedules });

  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
// The new POST handler
export async function POST(request: NextRequest) {
  // 1. Verify if the user is authenticated
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await getUserFromSupabaseToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2. Get and validate the dates from the request body
  const { start_time, end_time } = await request.json();
  const start = new Date(start_time);
  const end = new Date(end_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }
  if (start >= end) {
    return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
  }

  try {
    // 3. Connect to the database
    const client = await clientPromise;
    const db = client.db('quiet_hours'); // Use your database name
    const col = db.collection('schedules');

    // 4. Check for overlapping schedule for this user
    const overlap = await col.findOne({
      user_id: user.id,
      start_time: { $lt: end },   // An existing schedule starts before the new one ends
      end_time: { $gt: start }    // AND existing schedule ends after the new one starts
    });

    if (overlap) {
      return NextResponse.json({ error: 'This time slot overlaps with an existing schedule' }, { status: 400 });
    }

    // 5. If no overlap occurs insert the new schedule
    const newSchedule = {
      user_id: user.id,
      user_email: user.email,
      start_time: start,
      end_time: end,
      reminderSent: false,
      createdAt: new Date()
    };
    const result = await col.insertOne(newSchedule);

    // 6. Return a success response
    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });

  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}