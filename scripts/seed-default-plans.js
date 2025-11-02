#!/usr/bin/env node
/**
 * Simple seed script to insert the default services into `services` table.
 * Requires these env vars:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const plans = [
    {
      name: "90-Day Customized Program",
      price_cents: 25000,
      currency: "USD",
      description: "Personalized 90-day program — weekly check-ins",
      duration_days: 90,
      is_recurring: true,
      metadata: {},
    },
    {
      name: "One-time Customized Diet Plan",
      price_cents: 2500,
      currency: "USD",
      description: "Custom diet plan — delivered by trainer",
      duration_days: null,
      is_recurring: false,
      metadata: {},
    },
    {
      name: "One-time Customized Workout Plan",
      price_cents: 4999,
      currency: "USD",
      description: "Custom workout plan — delivered by trainer",
      duration_days: null,
      is_recurring: false,
      metadata: {},
    },
    {
      name: "Ultimate Weight Loss Diet Plan (Pre-made)",
      price_cents: 2500,
      currency: "USD",
      description: "Pre-made weight-loss diet plan — immediate download",
      duration_days: null,
      is_recurring: false,
      metadata: {},
    },
    {
      name: "30-Day Strength Builder (Pre-made)",
      price_cents: 2500,
      currency: "USD",
      description: "Pre-made 30-day strength builder — immediate download",
      duration_days: 30,
      is_recurring: false,
      metadata: {},
    },
  ];

  for (const p of plans) {
    // Upsert by name to avoid duplicates
    const { data: existing } = await supabase
      .from("services")
      .select("id")
      .eq("name", p.name)
      .limit(1);
    if (existing && existing.length) {
      console.log(`Skipping existing plan: ${p.name}`);
      continue;
    }

    const { error } = await supabase.from("services").insert(p);
    if (error) {
      console.error("Insert error for", p.name, error);
    } else {
      console.log("Inserted plan:", p.name);
    }
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
