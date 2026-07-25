import axios from 'axios';

const DEV_NURSE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItbnVyc2UtMDEiLCJ1c2VybmFtZSI6IkREVEVTVDAxIiwicm9sZSI6Im51cnNlIiwicGVybWlzc2lvbnMiOlsiaW5wYXRpZW50LnJlYWQiLCJiZWQuYXNzaWduIiwiYmVkLmNoYW5nZSIsInRyZWF0bWVudF9vcmRlci5yZWFkIiwidHJlYXRtZW50X29yZGVyLmV4ZWN1dGUiLCJ0cmVhdG1lbnRfb3JkZXIuY2FuY2VsIiwiZGlzY2hhcmdlX3N1bW1hcnkuc2lnbiIsImRpc2NoYXJnZS5leGVjdXRlIiwicXVldWVfdGlja2V0LmNhbGwiLCJ2aXRhbF9zaWducy5yZWNvcmQiLCJzcGVjaW1lbi5yZWFkIiwic3BlY2ltZW4uY3JlYXRlIiwic3BlY2ltZW4uY29sbGVjdCIsInNwZWNpbWVuLmhhbmRvZmYiLCJwYXRpZW50X2lkZW50aXR5LnN0YW5kYXJkaXplIl0sImRlcGFydG1lbnRJZCI6ImRlcHQtaW5wYXRpZW50LTAxIiwiZXhwIjoxNzg1NTU4NDExfQ.bv0RpYKrcep2EsesbCh72M1RO-g3dCtz77vUzZDc1Ms';

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DEV_NURSE_TOKEN}`,
  },
});

// Extract response data (which is { data, meta } in standard envelope)
httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || error)
);
