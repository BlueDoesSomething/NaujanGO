import db from './db.js';
import passport from './config/passport.js';

let io = null;

async function initSocket(server, opts = {}) {
  if (io) return io;
  // dynamic import so server can start even if socket.io isn't installed yet
  const mod = await import('socket.io');
  const Server = mod.Server || mod.default;
  io = new Server(server, {
    cors: {
      origin: opts.origin || (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'),
      credentials: true
    }
  });

  const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

  if (opts.sessionMiddleware) {
    io.use(wrap(opts.sessionMiddleware));
  }
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  io.on('connection', (socket) => {
    try {
      socket.on('join', async (room) => {
        if (!room || typeof room !== 'string') return;
        const user = socket.request.user;
        const isStaffModerator = user?.role === 'admin' || user?.role === 'agent';
        const isAdmin = user?.role === 'admin';

        if (room.startsWith('conv_')) {
          const conversationId = Number(room.replace('conv_', ''));
          if (!Number.isFinite(conversationId)) return;

          if (isAdmin) {
            socket.join(room);
            return;
          }

          const userId = user?.user_id;
          if (!userId) return;

          db.query(
            'SELECT conversation_id FROM chatbot_conversations WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId],
            (err, rows) => {
              if (!err && rows && rows.length > 0) {
                socket.join(room);
              }
            }
          );
          return;
        }

        if (room === 'moderation' && isStaffModerator) {
          socket.join(room);
          return;
        }
      });

      socket.on('leave', (room) => { if (room) socket.leave(room); });
      socket.on('disconnect', () => {});
    } catch (e) {
      console.error('Socket error:', e);
    }
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export { initSocket, getIo };
