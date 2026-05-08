/**
 * Jest Global Test Setup
 * Runs before every test file.
 * Handles Supabase cloud DB latency — 30s timeout is safe.
 */

import dotenv from "dotenv";
import path from "path";

// Load .env so Prisma gets DATABASE_URL (Supabase) before app is imported
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Extend timeout for Supabase cloud DB (network round-trips add latency)
jest.setTimeout(30000);
