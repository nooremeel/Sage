import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 10 },  // Ramp-up to 10 VUs
    { duration: '20s', target: 20 }, // Steady load at 20 VUs
    { duration: '5s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'], // 95% of requests must finish within 150ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api';

export default function () {
  // 1. Catalog listing with locale & category filter
  const catalogRes = http.get(`${BASE_URL}/courses?locale=ar&categorySlug=software-engineering`, {
    headers: { 'Accept': 'application/json' },
  });

  check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
    'catalog has etag': (r) => r.headers['Etag'] !== undefined || r.headers['ETag'] !== undefined,
  });

  // 2. Full-text search with Arabic diacritic query
  const searchRes = http.get(`${BASE_URL}/courses/search?q=%D8%A8%D9%8E%D8%B1%D9%92%D9%85%D9%8E%D8%AC%D9%8E%D8%A9&locale=ar`, {
    headers: { 'Accept': 'application/json' },
  });

  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}

