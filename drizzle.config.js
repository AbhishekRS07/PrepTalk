/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
      url: "postgresql://neondb_owner:QABlHdEyb56W@ep-holy-scene-a1j3kc6n.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    }
  };
  