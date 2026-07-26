import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { shouldResetSelectedRecord } from '../src/modules/doctor/pages/workspace/doctor-workspace.state';

const createWorklist = (recordIds: string[]) => ({
  data: recordIds.map((recordId) => ({ recordId })),
});

describe('shouldResetSelectedRecord', () => {
  it('keeps the current screen while no record is selected or worklist is still loading', () => {
    assert.equal(shouldResetSelectedRecord(null, createWorklist(['record-1'])), false);
    assert.equal(shouldResetSelectedRecord('record-1', undefined), false);
    assert.equal(shouldResetSelectedRecord('record-1', null), false);
  });

  it('keeps the selected record when it still belongs to the current doctor worklist', () => {
    assert.equal(shouldResetSelectedRecord('record-2', createWorklist(['record-1', 'record-2'])), false);
  });

  it('resets the selected record when the current doctor worklist no longer contains it', () => {
    assert.equal(shouldResetSelectedRecord('record-3', createWorklist(['record-1', 'record-2'])), true);
    assert.equal(shouldResetSelectedRecord('record-3', createWorklist([])), true);
  });
});
