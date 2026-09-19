const cron = require('node-cron');
const backupService = require('../services/backup.service');

// Runs once a day at 2 AM server time (spec section 57: daily automated backup).
function scheduleDailyBackup() {
  cron.schedule('0 2 * * *', () => {
    backupService.runBackup('SCHEDULED', null).catch((err) => {
      console.error('Scheduled backup failed:', err.message);
    });
  });
}

module.exports = { scheduleDailyBackup };
