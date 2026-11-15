import http from 'node:http';
import { runSiCopilotChat, runSiSynthesisQuery } from './backend/si-synthesis-engine.ts';

const PORT = Number(process.env.PORT) || 4000;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  // Health check endpoint for Render
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    sendJson(res, 200, {
      status: 'ok',
      service: 'AstroFlame SI Backend Engine',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // SI Copilot Chat endpoint
  if (req.method === 'POST' && url.pathname === '/api/si/chat') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const message = String(payload.message || '').trim();
        const personaRole = payload.personaRole || 'engineer';
        const history = Array.isArray(payload.history) ? payload.history : [];
        const chamberContext = {
          activeDatasetId: String(payload.chamberContext?.activeDatasetId || 'bass-ii-psi-25'),
          gravityG: Number(payload.chamberContext?.gravityG ?? 0.0),
          oxygenPercent: Number(payload.chamberContext?.oxygenPercent ?? 21),
          airflowCmPerSec: Number(payload.chamberContext?.airflowCmPerSec ?? 2.5),
          eFieldKv: Number(payload.chamberContext?.eFieldKv ?? 0.0),
          coolFlameMode: Boolean(payload.chamberContext?.coolFlameMode),
          provenanceMode: String(payload.chamberContext?.provenanceMode || '3d_illustration'),
        };

        if (!message) {
          sendJson(res, 400, { error: 'Please provide a question for the SI Copilot.' });
          return;
        }

        const result = await runSiCopilotChat({
          message,
          history,
          personaRole,
          chamberContext,
        });

        sendJson(res, 200, result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'SI Copilot synthesis failed';
        sendJson(res, 500, { error: msg });
      }
    });
    return;
  }

  // SI Synthesis query endpoint
  if (req.method === 'POST' && url.pathname === '/api/si-synthesis') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const prompt = String(payload.prompt || '').trim();
        const personaRole = payload.personaRole || 'engineer';

        if (!prompt) {
          sendJson(res, 400, { error: 'Prompt is required' });
          return;
        }

        const result = await runSiSynthesisQuery(prompt, personaRole);
        sendJson(res, 200, result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Synthesis request failed';
        sendJson(res, 500, { error: msg });
      }
    });
    return;
  }

  sendJson(res, 404, { error: 'Endpoint not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AstroFlame SI Backend running on port ${PORT}`);
});
