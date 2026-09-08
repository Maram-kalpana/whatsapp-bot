const mysql = require("mysql2/promise");
const env = require("../src/config/env");

async function main() {
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
  console.log(`Database ready: ${env.db.name}`);
}

main().catch((err) => {
  console.error(err.code || err.message);
  process.exit(1);
});
