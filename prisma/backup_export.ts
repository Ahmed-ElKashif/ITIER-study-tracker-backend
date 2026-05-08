/**
 * Task 11.1 - Phase 1 Data Backup Script
 * Exports all critical data to JSON for safe keeping before Phase 2 migration.
 * Run: npx ts-node prisma/backup_export.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Starting Phase 1 data backup...');

  const tracks = await prisma.track.findMany();
  const users = await prisma.user.findMany();
  const studyEntries = await prisma.studyEntry.findMany();

  const backup = {
    exportedAt: new Date().toISOString(),
    phase: 'phase1',
    counts: {
      tracks: tracks.length,
      users: users.length,
      studyEntries: studyEntries.length,
    },
    data: { tracks, users, studyEntries },
  };

  const outPath = path.join(__dirname, 'backup_phase1.json');
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf-8');

  console.log('✅ Backup complete!');
  console.log(`📦 File: ${outPath}`);
  console.log(`📊 Backed up:`);
  console.log(`   - Tracks:        ${tracks.length}`);
  console.log(`   - Users:         ${users.length}`);
  console.log(`   - Study Entries: ${studyEntries.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Backup failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
