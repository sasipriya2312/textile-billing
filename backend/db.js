const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "textile_billing",
    password: "DEEPA",
    port: 5432,
});

pool.connect()
    .then(() => {
        console.log("✅ PostgreSQL Connected Successfully");
    })
    .catch((err) => {
        console.error("❌ PostgreSQL Connection Failed");
        console.error(err.message);
    });

module.exports = pool;