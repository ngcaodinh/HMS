import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  process.cwd(),
  'prisma/migrations/20260804000000_doctor_input_validation/migration.sql',
);

describe('doctor input validation migration contract', () => {
  const migration = readFileSync(migrationPath, 'utf8');

  it('clears undecided treatment types before making the field nullable', () => {
    expect(migration).toContain("WHERE `status` NOT IN ('diagnosed', 'closed')");
    expect(migration).toContain("ENUM('outpatient', 'inpatient') NULL");
  });

  it('backfills vital audit fields and leaves a read-only preflight before NOT NULL', () => {
    expect(migration).toContain('JSON_EXTRACT(`record`.`vitalSigns`');
    expect(migration).toContain('SELECT COUNT(*) AS missing_vital_data');
    expect(migration).toContain('MODIFY `pulse` INTEGER NOT NULL');
    expect(migration).toContain('MODIFY `recordedBy` VARCHAR(36) NOT NULL');
  });
});
