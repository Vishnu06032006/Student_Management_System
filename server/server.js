require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { scheduleDailyBackup } = require('./jobs/backupJob');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  scheduleDailyBackup();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
