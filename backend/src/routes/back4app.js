const express = require('express');

const router = express.Router();

const serverUrl = (process.env.BACK4APP_SERVER_URL || 'https://parseapi.back4app.com').replace(/\/$/, '');
const appId = process.env.BACK4APP_APP_ID;
const restApiKey = process.env.BACK4APP_REST_API_KEY;
const masterKey = process.env.BACK4APP_MASTER_KEY;
const javascriptKey = process.env.BACK4APP_JAVASCRIPT_KEY;
const timeoutMs = Number(process.env.BACK4APP_TIMEOUT_MS || 15000);

function hasBack4AppConfig() {
  return Boolean(serverUrl && appId && (restApiKey || masterKey));
}

function getAuthHeader(req) {
  const raw = req.headers.authorization || '';
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function proxyToBack4App(req, res, endpointPath) {
  if (!hasBack4AppConfig()) {
    return res.status(503).json({
      error: 'Back4App is not configured. Set BACK4APP_APP_ID and BACK4APP_REST_API_KEY (or BACK4APP_MASTER_KEY).',
    });
  }

  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = `${serverUrl}${endpointPath}${queryString}`;

  const headers = {
    'X-Parse-Application-Id': appId,
  };

  if (javascriptKey) {
    headers['X-Parse-JavaScript-Key'] = javascriptKey;
  }

  if (masterKey) {
    headers['X-Parse-Master-Key'] = masterKey;
  } else if (restApiKey) {
    headers['X-Parse-REST-API-Key'] = restApiKey;
  }

  const sessionToken = getAuthHeader(req);
  if (sessionToken) {
    headers['X-Parse-Session-Token'] = sessionToken;
  }

  const init = {
    method: req.method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(req.method.toUpperCase())) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(req.body || {});
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  init.signal = controller.signal;

  try {
    const response = await fetch(targetUrl, init);
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    clearTimeout(timer);

    if (contentType.includes('application/json')) {
      return res.status(response.status).json(payload);
    }

    return res.status(response.status).send(payload);
  } catch (error) {
    clearTimeout(timer);
    if (error && error.name === 'AbortError') {
      return res.status(504).json({ error: 'Back4App request timed out' });
    }
    return res.status(502).json({ error: 'Failed to reach Back4App' });
  }
}

router.get('/health', async (_req, res) => {
  if (!hasBack4AppConfig()) {
    return res.status(503).json({
      ok: false,
      provider: 'back4app',
      error: 'Missing Back4App env configuration',
    });
  }

  try {
    const headers = {
      'X-Parse-Application-Id': appId,
    };

    if (javascriptKey) {
      headers['X-Parse-JavaScript-Key'] = javascriptKey;
    }

    if (masterKey) {
      headers['X-Parse-Master-Key'] = masterKey;
    } else if (restApiKey) {
      headers['X-Parse-REST-API-Key'] = restApiKey;
    }

    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false, provider: 'back4app' });
    }

    const data = await response.json();
    return res.json({ ok: true, provider: 'back4app', upstream: data });
  } catch (_error) {
    return res.status(502).json({ ok: false, provider: 'back4app' });
  }
});

router.all('/*', async (req, res) => {
  const endpointPath = req.path;
  return proxyToBack4App(req, res, endpointPath);
});

module.exports = router;
