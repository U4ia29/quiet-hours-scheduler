// app/api/cron/route.ts
// This is my CRON job API, which will be triggered automatically.

import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { sendEmail } from '../../../lib/email';
import { ObjectId } from 'mongodb';

type Schedule = {
  _id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  user_email: string;
  // Add other properties from your schedule object here if needed
};
export async function GET(request: NextRequest) {
  // 1. Protect the route with a secret key
  const cronKey = request.headers.get('x-cron-key');
  console.log('CRON job triggered.'); // <-- LOG 1: See if it runs at all

  if (cronKey !== process.env.CRON_SECRET) {
    console.error('CRON job unauthorized. Check CRON_SECRET and vercel.json header.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

  console.log(`[UTC Time Check] Current server time (UTC): ${now.toISOString()}`); // <-- LOG 2
  console.log(`[UTC Time Check] Searching for schedules with start_time between ${now.toISOString()} and ${windowEnd.toISOString()}`); // <-- LOG 3

  try {
    const client = await clientPromise;
    const db = client.db('quiet_hours');
    const col = db.collection('schedules');

    // 2. Find schedules starting in the next 10 mins that haven't had a reminder sent
    const candidates = await col.find({
      reminderSent: { $ne: true }, // Safer check: not equal to true
      start_time: { $gte: now, $lte: windowEnd }
    }).toArray();

    console.log(`Found ${candidates.length} candidate schedules to process.`); // <-- LOG 4 (The most important log!)

    // If you see candidates, log them to inspect their data
    if (candidates.length > 0) {
        console.log('Candidate details:', JSON.stringify(candidates, null, 2));
    }

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, message: 'No schedules to process.' });
    }

    // Group schedules by user
    const schedulesByUser: { [userId:string]: Schedule[] } = {};

    for (const candidate of candidates) {
        const schedule: Schedule = {
            _id: candidate._id.toString(),
            user_id: candidate.user_id,
            start_time: candidate.start_time instanceof Date ? candidate.start_time.toISOString() : candidate.start_time,
            end_time: candidate.end_time instanceof Date ? candidate.end_time.toISOString() : candidate.end_time,
            user_email: candidate.user_email,
        };
        if (!schedulesByUser[schedule.user_id]) {
            schedulesByUser[schedule.user_id] = [];
        }
        schedulesByUser[schedule.user_id].push(schedule);
    }

    const results = [];

    // 4. Process each user's batch of schedules
    for (const userId in schedulesByUser) {
      const userSchedules = schedulesByUser[userId];
      const scheduleIds = userSchedules.map(s => new ObjectId(s._id));

      console.log(`Processing ${userSchedules.length} schedules for user ${userId}`); // <-- LOG 5

      //5.This is the atomic update that prevents sending duplicate emails.
      const updateResult = await col.updateMany(
        { _id: { $in: scheduleIds }, reminderSent: { $ne: true } },
        { $set: { reminderSent: true, reminderSentAt: new Date() } }
      );

      // If no documents were modified, it means another process handled them. Skip.
      if (updateResult.modifiedCount === 0) {
          console.log(`Skipping user ${userId}, schedules already processed by another instance.`);
        continue;
      }

      // 6. Send one email to the user with all their upcoming blocks
      const email = userSchedules[0].user_email;
      console.log(`Attempting to send email to ${email}`); // <-- LOG 6
      await sendEmail(email, userSchedules);
      console.log(`Successfully sent email for user ${userId}`); // <-- LOG 7

      results.push({ userId, sentTo: email, count: userSchedules.length });
    }

    return NextResponse.json({ ok: true, processedUsers: results.length, results });

  } catch (error) {
    console.error('CRON job failed:', error); // <-- LOG 8 (Catch any errors)
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
