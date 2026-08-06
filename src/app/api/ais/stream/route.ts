import { WebSocket } from 'ws';
import {
  AKTAU_AIS_BBOX,
  AISSTREAM_MESSAGE_TYPES,
  parseAisMessage,
  type AisStreamEvent,
} from '@/lib/ais';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream';
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;
const FIRST_MESSAGE_TIMEOUT_MS = 20_000;
const SUBSCRIPTION_UPDATE_DELAY_MS = 1_100;
const WORLD_AIS_BBOX: [[number, number], [number, number]] = [
  [-90, -180],
  [90, 180],
];
const POSITION_MESSAGE_TYPES = AISSTREAM_MESSAGE_TYPES.slice(0, 3);

function sse(data: AisStreamEvent): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const apiKey = process.env.AISSTREAM_API_KEY?.trim();

  if (!apiKey) {
    return new Response(
      sse({
        type: 'status',
        status: 'unavailable',
        message:
          'Нет AISSTREAM_API_KEY. Создайте ключ на https://aisstream.io и добавьте в .env.local',
      }) +
        sse({
          type: 'error',
          message: 'AISSTREAM_API_KEY missing',
        }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      },
    );
  }

  const encoder = new TextEncoder();
  let closed = false;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let firstMessageTimer: ReturnType<typeof setTimeout> | null = null;
  let subscriptionUpdateTimer: ReturnType<typeof setTimeout> | null = null;
  let ws: WebSocket | null = null;
  let reconnectAttempt = 0;

  const staticTypes = new Map<string, number>();
  const staticNames = new Map<string, string>();
  const seen = new Map<string, number>();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: AisStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sse(event)));
        } catch {
          closed = true;
        }
      };

      const clearFirstMessageTimer = () => {
        if (!firstMessageTimer) return;
        clearTimeout(firstMessageTimer);
        firstMessageTimer = null;
      };

      const clearSubscriptionUpdateTimer = () => {
        if (!subscriptionUpdateTimer) return;
        clearTimeout(subscriptionUpdateTimer);
        subscriptionUpdateTimer = null;
      };

      const subscribe = (
        socket: WebSocket,
        boundingBox: [[number, number], [number, number]],
        messageTypes: readonly string[],
      ) => {
        socket.send(
          JSON.stringify({
            APIKey: apiKey,
            BoundingBoxes: [boundingBox],
            FilterMessageTypes: messageTypes,
          }),
        );
      };

      const scheduleReconnect = (message: string) => {
        if (closed || reconnectTimer) return;
        clearFirstMessageTimer();
        clearSubscriptionUpdateTimer();

        const current = ws;
        ws = null;
        if (
          current &&
          current.readyState !== WebSocket.CLOSED &&
          current.readyState !== WebSocket.CLOSING
        ) {
          current.close();
        }

        const delay = Math.min(
          RECONNECT_BASE_MS * 2 ** reconnectAttempt,
          RECONNECT_MAX_MS,
        );
        reconnectAttempt += 1;
        send({
          type: 'status',
          status: 'error',
          message: `${message} · повтор через ${Math.ceil(delay / 1000)} с`,
          count: seen.size,
        });

        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, delay);
      };

      const connect = () => {
        if (closed) return;
        send({
          type: 'status',
          status: 'connecting',
          message:
            reconnectAttempt === 0
              ? 'Подключение к AISStream…'
              : 'Переподключение к AISStream…',
          count: seen.size,
        });

        const socket = new WebSocket(AISSTREAM_URL);
        ws = socket;
        let subscription: 'probe' | 'switching' | 'caspian' = 'probe';

        socket.on('open', () => {
          if (closed || ws !== socket) return;

          // Probe the documented world bbox first: the Caspian can be silent even
          // while the upstream service is healthy. The probe frame is never sent
          // to the browser; after it arrives we replace the subscription with the
          // Aktau/Caspian bbox on the same socket.
          subscribe(socket, WORLD_AIS_BBOX, POSITION_MESSAGE_TYPES);
          send({
            type: 'status',
            status: 'connecting',
            message: 'Проверяем поток AISStream…',
            count: seen.size,
          });

          clearFirstMessageTimer();
          firstMessageTimer = setTimeout(() => {
            if (subscription === 'probe' && ws === socket) {
              scheduleReconnect('AISStream подключён, но не отдаёт данные');
            }
          }, FIRST_MESSAGE_TIMEOUT_MS);
        });

        socket.on('message', (buf) => {
          if (closed || ws !== socket) return;

          try {
            const raw = JSON.parse(buf.toString()) as Record<string, unknown>;
            if (raw.error || raw.Error) {
              scheduleReconnect(String(raw.error ?? raw.Error));
              return;
            }

            if (!raw.MessageType || !raw.Message) return;

            if (subscription === 'probe') {
              subscription = 'switching';
              reconnectAttempt = 0;
              clearFirstMessageTimer();
              send({
                type: 'status',
                status: 'connecting',
                message: 'AISStream отвечает · включаем зону Каспия…',
                count: seen.size,
              });

              subscriptionUpdateTimer = setTimeout(() => {
                subscriptionUpdateTimer = null;
                if (closed || ws !== socket) return;
                subscription = 'caspian';
                subscribe(socket, AKTAU_AIS_BBOX, AISSTREAM_MESSAGE_TYPES);
                send({
                  type: 'status',
                  status: 'live',
                  message: 'AISStream Live · ждём суда в Каспийском море',
                  count: seen.size,
                });
              }, SUBSCRIPTION_UPDATE_DELAY_MS);
              return;
            }

            // Ignore frames queued by the world probe while the subscription is
            // being replaced, otherwise an unrelated vessel could reach the map.
            if (subscription !== 'caspian') return;

            const snap = parseAisMessage(raw, staticTypes, staticNames);
            if (!snap) return;
            seen.set(snap.mmsi, snap.updatedAt);
            send({ type: 'vessel', vessel: snap, count: seen.size });
          } catch {
            // Ignore malformed upstream frames; a valid next frame keeps the stream alive.
          }
        });

        socket.on('error', (err) => {
          if (ws !== socket) return;
          scheduleReconnect(err.message || 'Ошибка AISStream WebSocket');
        });

        socket.on('close', (code, reason) => {
          if (closed || ws !== socket) return;
          const detail = reason.toString().trim();
          scheduleReconnect(
            detail
              ? `AISStream закрыл соединение: ${detail}`
              : `AISStream закрыл соединение (${code})`,
          );
        });
      };

      connect();

      pingTimer = setInterval(() => {
        send({ type: 'ping', count: seen.size });
      }, 15000);

      request.signal.addEventListener(
        'abort',
        () => {
          closed = true;
          clearFirstMessageTimer();
          clearSubscriptionUpdateTimer();
          if (pingTimer) clearInterval(pingTimer);
          if (reconnectTimer) clearTimeout(reconnectTimer);
          ws?.close();
        },
        { once: true },
      );
    },
    cancel() {
      closed = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (firstMessageTimer) clearTimeout(firstMessageTimer);
      if (subscriptionUpdateTimer) clearTimeout(subscriptionUpdateTimer);
      ws?.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
