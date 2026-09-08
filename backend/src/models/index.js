const { Sequelize } = require("sequelize");
const env = require("../config/env");
const defineModels = require("./definitions");

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: false,
});

const models = defineModels(sequelize);

async function connectDb() {
  await sequelize.authenticate();
}

module.exports = { sequelize, connectDb, ...models };
