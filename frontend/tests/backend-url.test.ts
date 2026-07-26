import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeBackendOrigin } from '../src/shared/auth/backend-url';

describe('normalizeBackendOrigin', () => {
  it('keeps backend config as an origin without requiring /api/v1 in env', () => {
    assert.equal(normalizeBackendOrigin('http://localhost:4000'), 'http://localhost:4000');
    assert.equal(normalizeBackendOrigin('http://localhost:4000/'), 'http://localhost:4000');
  });

  it('removes a legacy /api/v1 suffix so old env values do not double-prefix URLs', () => {
    assert.equal(
      normalizeBackendOrigin('http://localhost:4000/api/v1'),
      'http://localhost:4000',
    );
    assert.equal(
      normalizeBackendOrigin('https://hms-api.example.com/api/v1/'),
      'https://hms-api.example.com',
    );
  });
});
