globalThis.fetch = async (url, init = {}) => {
  const method = init.method ?? 'GET';
  if (String(url).includes('raw.githubusercontent.com/beachdevs/apicat/refs/heads/master/.apicat')) {
    return new Response('published.get:\n  url: "https://example.com"\n  method: "GET"\n  headers: {}\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'X-Mock-Fetch': '1'
      }
    });
  }
  if (String(url).includes('invalid-json')) {
    return new Response('not valid json', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'X-Mock-Fetch': '1'
      }
    });
  }
  if (String(url).includes('ndjson')) {
    return new Response('{"value":1}\n{"value":2}\n', {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'X-Mock-Fetch': '1'
      }
    });
  }
  const payload = {
    url: String(url),
    method,
    body: init.body ?? null
  };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-Fetch': '1'
    }
  });
};
