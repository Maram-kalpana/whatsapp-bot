const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const { createApp } = require("./app");
const env = require("./config/env");
const { connectDb, BusinessUser } = require("./models");
const { startJobWorker } = require("./jobs/worker");
const { setIo } = require("./lib/realtime");

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
}

async function main() {
  await ensureDatabase();
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  setIo(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const payload = jwt.verify(token, env.jwtAccessSecret);
      if (payload.typ && payload.typ !== "access") {
        next(new Error("Invalid access token"));
        return;
      }
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.emit("ready", { ok: true });
    socket.on("join-business", async (businessId) => {
      const id = Number(businessId);
      if (!id || !socket.userId) return;
      const row = await BusinessUser.findOne({
        where: { business_id: id, user_id: socket.userId },
      });
      if (row) socket.join(`business:${id}`);
    });
  });

  startJobWorker();

  server.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`MySQL connected: ${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name}`);
  });
}

main().catch((err) => {
  const detail = err?.message || err?.code || String(err);
  console.error("Failed to start API. Is XAMPP MySQL running?", detail);
  if (err?.cause) console.error(err.cause);
  process.exit(1);
});
