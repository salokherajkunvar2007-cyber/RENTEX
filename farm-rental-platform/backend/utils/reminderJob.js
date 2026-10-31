const cron = require('node-cron');
const Booking = require('../models/Booking');
const MachineHealth = require('../models/MachineHealth');
const Notification = require('../models/Notification');

// Runs every day at 07:00 server time.
// 1) Reminds farmers whose rental return date is tomorrow.
// 2) Flags machines whose next maintenance date is within 7 days.
const startReminderJob = () => {
  cron.schedule('0 7 * * *', async () => {
    try {
      const now = new Date();
      const tomorrowStart = new Date(now);
      tomorrowStart.setDate(now.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const dueBookings = await Booking.find({
        status: 'approved',
        endDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
        reminderSent: false,
      }).populate('machine', 'name');

      for (const booking of dueBookings) {
        await Notification.create({
          user: booking.farmer,
          type: 'return-reminder',
          title: 'Machine return due tomorrow',
          message: `Reminder: please return "${booking.machine?.name || 'the machine'}" by ${booking.endDate.toDateString()}.`,
          relatedBooking: booking._id,
          relatedMachine: booking.machine?._id,
        });
        booking.reminderSent = true;
        await booking.save();
      }

      const dueSoonWindow = new Date(now);
      dueSoonWindow.setDate(now.getDate() + 7);

      const healthRecords = await MachineHealth.find({
        nextMaintenanceDate: { $ne: null, $lte: dueSoonWindow },
      }).populate({ path: 'machine', populate: { path: 'owner', select: '_id' } });

      for (const record of healthRecords) {
        if (!record.machine || !record.machine.owner) continue;
        await Notification.create({
          user: record.machine.owner._id,
          type: 'maintenance-due',
          title: 'Maintenance due soon',
          message: `"${record.machine.name}" is due for maintenance on ${record.nextMaintenanceDate.toDateString()}.`,
          relatedMachine: record.machine._id,
        });
      }

      console.log(
        `[reminderJob] Processed ${dueBookings.length} return reminders and ${healthRecords.length} maintenance checks.`
      );
    } catch (error) {
      console.error('[reminderJob] Failed:', error.message);
    }
  });
};

module.exports = startReminderJob;
