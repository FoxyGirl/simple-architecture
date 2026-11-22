// Email-scoped backend probes for the favorites specs. Every call logs in
// through the real auth API and replays the returned session cookie, so the
// probes never depend on the request fixture's cookie jar and every email
// reads only its own list.

const BACKEND = 'http://localhost:3001';

const cookies = new Map();

const cookieOf = (response) => {
  const header = response
    .headersArray()
    .find(({ name }) => name.toLowerCase() === 'set-cookie');

  return header ? header.value.split(';')[0] : '';
};

export const sessionCookie = async (request, email) => {
  const known = cookies.get(email);
  if (known) return known;

  const response = await request.post(`${BACKEND}/api/auth/login`, {
    data: { email },
  });
  const cookie = cookieOf(response);

  cookies.set(email, cookie);

  return cookie;
};

export const summaryIds = async (request, email) => {
  const cookie = await sessionCookie(request, email);
  const response = await request.get(`${BACKEND}/api/favorites/count`, {
    headers: { Cookie: cookie },
  });

  return (await response.json()).ids;
};

export const clearFavorites = async (request, email) => {
  const cookie = await sessionCookie(request, email);

  for (const id of await summaryIds(request, email)) {
    await request.delete(`${BACKEND}/api/favorites/${id}`, {
      headers: { Cookie: cookie },
    });
  }
};
