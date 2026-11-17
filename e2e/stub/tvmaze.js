import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Minimal local stand-in for the TVmaze REST API used by the Playwright E2E
// harness. Serves `search/shows?q=` from fixtures, counts upstream hits per
// query so specs can assert backend caching (`GET /__hits`) and can arm a
// one-shot upstream failure (`POST /__fail-next`) for deterministic error
// flows.

const PORT = 3002;

const fixtures = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./fixtures.json', import.meta.url)),
    'utf8',
  ),
);

// Per-query upstream hit counter, e.g. { office: 2 }.
const hitsByQuery = {};

// Armed by `POST /__fail-next`; the next search/shows call answers 500 once.
let failNext = false;

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/__hits') {
    sendJson(res, 200, hitsByQuery);
    return;
  }

  if (url.pathname === '/__fail-next' && req.method === 'POST') {
    failNext = true;
    sendJson(res, 200, { armed: true });
    return;
  }

  if (url.pathname.endsWith('/search/shows')) {
    const query = (url.searchParams.get('q') ?? '').toLowerCase();
    hitsByQuery[query] = (hitsByQuery[query] ?? 0) + 1;

    if (failNext) {
      failNext = false;
      sendJson(res, 500, {
        error: 'upstream failure (armed via /__fail-next)',
      });
      return;
    }

    const shows = fixtures[query] ?? fixtures.default;
    sendJson(
      res,
      200,
      shows.map((show) => ({ score: 1, show })),
    );
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`TVmaze E2E stub listening on http://localhost:${PORT}`);
});
