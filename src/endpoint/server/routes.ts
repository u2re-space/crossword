// =========================
// HTTP Routes
// =========================

import { readClipboard, writeClipboard, setBroadcasting } from './clipboard.ts';
import config from '../config.js';

function setUtf8Plain(reply: any) {
  reply.header('Content-Type', 'text/plain; charset=utf-8');
}

function isAuthorized(request: any): boolean {
  const secret = (config as any)?.secret || '';
  if (!secret) return true;

  const headerToken =
    request?.headers?.['x-auth-token'] ||
    request?.headers?.['X-Auth-Token'] ||
    request?.headers?.['x-auth_token'];

  if (typeof headerToken === 'string' && headerToken === secret) return true;

  const auth = request?.headers?.authorization || request?.headers?.Authorization;
  if (typeof auth === 'string') {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m && m[1] === secret) return true;
  }

  return false;
}

export function registerRoutes(app: any) {
  // POST /clipboard  (Fastify-style)
  app.post('/clipboard', async (request: any, reply: any) => {
    if (!isAuthorized(request)) {
      setUtf8Plain(reply);
      return reply.code(401).send('Unauthorized');
    }

    setBroadcasting(true);
    try {
      let text = '';

      if (typeof request.body === 'object' && request.body !== null && 'text' in request.body) {
        text = String(request.body.text);
      } else if (typeof request.body === 'string') {
        text = request.body;
      }

      if (!text) {
        setBroadcasting(false);
        setUtf8Plain(reply);
        return reply.code(400).send('No text provided');
      }

      const current = await readClipboard();
      if (text !== '' && text != null && current !== text) {
        await writeClipboard(text);
      }

      app.log.info('Copied to clipboard');
      setBroadcasting(false);
      setUtf8Plain(reply);
      return reply.code(200).send('OK');
    } catch (err) {
      app.log.error({ err }, 'Clipboard error');
      setBroadcasting(false);
      setUtf8Plain(reply);
      return reply.code(500).send('Clipboard error');
    }
  });
}
