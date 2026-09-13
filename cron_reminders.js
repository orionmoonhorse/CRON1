// cron_reminders.js

import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

import {
  sendDayBeforeEmail,
  sendMorningOfEmail
} from "./email_service.js";

const { Client } = pg;

// -----------------------------------------
// DATABASE CONNECTION (Railway)
// -----------------------------------------
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// -----------------------------------------
// MAIN CRON FUNCTION
//------------------------------------------
async function runCronCycle() {
  const now = new Date();

  console.log("\n==============================");
  console.log("CRON RUN:", now.toISOString());
  console.log("==============================\n");

  try {
    // ============================================================
    // 1. DAY-BEFORE REMINDERS
    // ============================================================

    const dayBefore = new Date(now);
    dayBefore.setDate(dayBefore.getDate() + 1);
    const dayBeforeDate = dayBefore.toISOString().split("T")[0];

    console.log("Checking day-before reminders for:", dayBeforeDate);

    const dayBeforeRows = await client.query(
      `
      SELECT 
        a.id,
        c.name,
        c.email,
        a.date,
        a.start_time,
        es.service_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN estimates e ON a.estimate_id = e.id
      JOIN estimate_services es ON es.estimate_id = e.id
      WHERE a.date = $1
        AND a.status = 'scheduled'
        AND a.day_before_sent IS NOT TRUE
      `,
      [dayBeforeDate]
    );

    console.log(`Found ${dayBeforeRows.rows.length} day-before reminders.`);

    for (const row of dayBeforeRows.rows) {
      const appointment = {
        name: row.name,
        email: row.email,
        service: row.service_name || "Service",
        date: row.date,
        time: row.start_time || "08:00"
      };

      console.log("\nDAY-BEFORE PAYLOAD:", appointment);

      try {
        await sendDayBeforeEmail(appointment);

        await client.query(
          "UPDATE appointments SET day_before_sent = TRUE WHERE id = $1",
          [row.id]
        );

        console.log(`✓ Day-before reminder sent for appointment ${row.id}`);
      } catch (err) {
        console.error(`❌ Error sending day-before reminder for ${row.id}:`, err);
      }
    }

    // ============================================================
    // 2. MORNING-OF REMINDERS (8:00 AM)
    // ============================================================

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toISOString().split("T")[0];

    if (currentHour === 8 && currentMinute === 0) {
      console.log("\nChecking morning-of reminders for:", today);

      const morningRows = await client.query(
        `
        SELECT 
          a.id,
          c.name,
          c.email,
          a.date,
          a.start_time,
          es.service_name
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        JOIN estimates e ON a.estimate_id = e.id
        JOIN estimate_services es ON es.estimate_id = e.id
        WHERE a.date = $1
          AND a.status = 'scheduled'
          AND a.morning_sent IS NOT TRUE
        `,
        [today]
      );

      console.log(`Found ${morningRows.rows.length} morning-of reminders.`);

      for (const row of morningRows.rows) {
        const appointment = {
          name: row.name,
          email: row.email,
          service: row.service_name || "Service",
          date: row.date,
          time: row.start_time || "08:00"
        };

        console.log("\nMORNING-OF PAYLOAD:", appointment);

        try {
          await sendMorningOfEmail(appointment);

          await client.query(
            "UPDATE appointments SET morning_sent = TRUE WHERE id = $1",
            [row.id]
          );

          console.log(`✓ Morning-of reminder sent for appointment ${row.id}`);
        } catch (err) {
          console.error(`❌ Error sending morning-of reminder for ${row.id}:`, err);
        }
      }
    } else {
      console.log(
        `Skipping morning-of reminders — current time is ${currentHour}:${currentMinute}`
      );
    }

    console.log("\nCRON CYCLE COMPLETE\n");
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
}

// -----------------------------------------
// WORKER LOOP — RUN FOREVER
//------------------------------------------
async function startWorker() {
  console.log("CRON WORKER STARTING…");

  try {
    await client.connect();
    console.log("Connected to Railway Postgres.");
  } catch (err) {
    console.error("❌ Failed to connect to Postgres:", err);
    process.exit(1);
  }

  // Run immediately
  await runCronCycle();

  // Then every 15 minutes (safe + reliable)
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 15 * 60 * 1000));
    await runCronCycle();
  }
}

startWorker();
