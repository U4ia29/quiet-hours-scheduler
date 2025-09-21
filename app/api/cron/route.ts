// app/api/cron/route.ts
// This is my CRON job API, which will be triggered automatically.

import { type NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { sendEmail } from '../../../lib/email';
import { ObjectId } from 'mongodb';

type Schedule = {
  _id: string;
  user_id: string;
  // Add other properties from your schedule object here if needed
};
export async function GET(request: NextRequest) {
  // 1. Protect the route with a secret key
  const cronKey = request.headers.get('x-cron-key');
  if (cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

  try {
    const client = await clientPromise;
    const db = client.db('quiet_hours');
    const col = db.collection('schedules');

    // 2. Find schedules starting in the next 10 mins that haven't had a reminder sent
    const candidates = await col.find({
      reminderSent: false,
      start_time: { $gte: now, $lte: windowEnd }
    }).toArray();

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, message: 'No schedules to process.' });
    }

const schedulesByUser: { [userId: string]: Schedule[] } = {};    for (const schedule of candidates) {
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

      //5.This is the atomic update that prevents sending duplicate emails.
      const updateResult = await col.updateMany(
        { _id: { $in: scheduleIds }, reminderSent: false },
        { $set: { reminderSent: true, reminderSentAt: new Date() } }
      );

      // If no documents were modified, it means another process handled them. Skip.
      if (updateResult.modifiedCount === 0) {
        continue;
      }

      // 6. Send one email to the user with all their upcoming blocks
      const email = userSchedules[0].user_email; // We stored the email for this purpose
      await sendEmail(email, userSchedules);

      results.push({ userId, sentTo: email, count: userSchedules.length });
    }

    return NextResponse.json({ ok: true, processedUsers: results.length, results });

  } catch (error) {
    console.error('CRON job failed:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
