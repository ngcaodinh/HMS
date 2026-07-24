import axios from 'axios';

const DEV_NURSE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMDMwMzAzMC0zMDMwLTQwMzAtODAzMC0zMDMwMzAzMDMwMzAiLCJ1c2VybmFtZSI6IkREVEVTVDAxIiwicm9sZSI6Im51cnNlIiwicGVybWlzc2lvbnMiOlsiaW5wYXRpZW50LnJlYWQiLCJiZWQuYXNzaWduIiwiYmVkLmNoYW5nZSIsInRyZWF0bWVudF9vcmRlci5yZWFkIiwidHJlYXRtZW50X29yZGVyLmV4ZWN1dGUiLCJ0cmVhdG1lbnRfb3JkZXIuY2FuY2VsIiwiZGlzY2hhcmdlX3N1bW1hcnkuc2lnbiIsImRpc2NoYXJnZS5leGVjdXRlIl0sImRlcGFydG1lbnRJZCI6IjIyMjIyMjIyLTIyMjItNDIyMi04MjIyLTIyMjIyMjIyMjIyMiIsImlhdCI6MTc4NDkyNzAzMiwiZXhwIjoxNzg1NTMxODMyfQ.GNjnum4Iuwc8Rgvam84Enb2TWOUuOh6mVEmN2pnVMAQ';

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
