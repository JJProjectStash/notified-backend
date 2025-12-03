/**
 * Background Jobs
 * Cron jobs for automated tasks like alert scanning and email scheduling
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const {
  Alert,
  AlertConfig,
  Student,
  Attendance,
  ScheduledEmail,
  EmailBounce,
  Unsubscribe,
} = require('../models');
const emailUtil = require('../utils/emailUtil');

/**
 * Alert Scanner Job
 * Scans for consecutive absences and low attendance
 * Runs daily at 6 AM
 */
async function scanAlerts() {
  logger.info('Running scheduled alert scan...');

  try {
    const config = (await AlertConfig.findOne()) || {
      consecutiveAbsenceThreshold: 3,
      lowAttendanceThreshold: 80,
      enableConsecutiveAlerts: true,
      enableLowAttendanceAlerts: true,
    };

    let newAlerts = 0;
    const students = await Student.find({ status: 'active' });

    // Scan for consecutive absences
    if (config.enableConsecutiveAlerts) {
      for (const student of students) {
        const records = await Attendance.find({ student: student._id })
          .sort({ date: -1 })
          .limit(config.consecutiveAbsenceThreshold + 10);

        let consecutive = 0;
        let startDate = null;
        let endDate = null;

        for (const record of records) {
          if (record.status === 'absent') {
            consecutive++;
            if (!endDate) endDate = record.date;
            startDate = record.date;
          } else {
            break;
          }
        }

        if (consecutive >= config.consecutiveAbsenceThreshold) {
          // Check if similar alert exists (not acknowledged)
          const existing = await Alert.findOne({
            student: student._id,
            type: 'consecutive_absence',
            acknowledged: false,
            'details.consecutiveDays': { $gte: consecutive - 1 },
          });

          if (!existing) {
            await Alert.create({
              type: 'consecutive_absence',
              severity: consecutive >= 5 ? 'critical' : 'warning',
              student: student._id,
              message: `${student.firstName} ${student.lastName} has been absent for ${consecutive} consecutive days`,
              details: {
                consecutiveDays: consecutive,
                startDate,
                endDate,
                threshold: config.consecutiveAbsenceThreshold,
              },
            });
            newAlerts++;
          }
        }
      }
    }

    // Scan for low attendance
    if (config.enableLowAttendanceAlerts) {
      const stats = await Attendance.aggregate([
        {
          $group: {
            _id: '$student',
            total: { $sum: 1 },
            attended: {
              $sum: {
                $cond: [{ $in: ['$status', ['present', 'late', 'excused']] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            rate: { $multiply: [{ $divide: ['$attended', '$total'] }, 100] },
            total: 1,
            attended: 1,
          },
        },
        {
          $match: {
            rate: { $lt: config.lowAttendanceThreshold },
            total: { $gte: 10 },
          },
        },
      ]);

      for (const stat of stats) {
        const student = await Student.findById(stat._id);
        if (!student || student.status !== 'active') continue;

        const existing = await Alert.findOne({
          student: stat._id,
          type: 'low_attendance',
          acknowledged: false,
        });

        if (!existing) {
          await Alert.create({
            type: 'low_attendance',
            severity: stat.rate < 60 ? 'critical' : 'warning',
            student: stat._id,
            message: `${student.firstName} ${student.lastName}'s attendance rate is ${Math.round(stat.rate)}%`,
            details: {
              attendanceRate: Math.round(stat.rate),
              threshold: config.lowAttendanceThreshold,
            },
          });
          newAlerts++;
        }
      }
    }

    logger.info(`Alert scan complete: ${newAlerts} new alerts generated`);
    return newAlerts;
  } catch (error) {
    logger.error('Alert scanner error:', error);
    throw error;
  }
}

/**
 * Scheduled Email Worker
 * Processes pending scheduled emails
 * Runs every minute
 */
async function processScheduledEmails() {
  try {
    const now = new Date();

    const emailsToSend = await ScheduledEmail.find({
      status: 'pending',
      scheduledAt: { $lte: now },
    }).limit(10);

    if (emailsToSend.length === 0) return;

    logger.info(`Processing ${emailsToSend.length} scheduled emails...`);

    for (const email of emailsToSend) {
      try {
        // Filter out bounced and unsubscribed emails
        const validRecipients = [];
        for (const recipient of email.to) {
          const normalizedEmail = recipient.toLowerCase().trim();

          // Check unsubscribe list
          const unsubscribed = await Unsubscribe.findOne({
            email: normalizedEmail,
            status: 'unsubscribed',
          });
          if (unsubscribed) {
            logger.info(`Skipping unsubscribed email: ${normalizedEmail}`);
            continue;
          }

          // Check hard bounce list
          const bounced = await EmailBounce.findOne({
            email: normalizedEmail,
            type: 'hard',
          });
          if (bounced) {
            logger.info(`Skipping hard-bounced email: ${normalizedEmail}`);
            continue;
          }

          validRecipients.push(normalizedEmail);
        }

        if (validRecipients.length === 0) {
          email.status = 'failed';
          email.error = 'All recipients are unsubscribed or bounced';
          await email.save();
          continue;
        }

        await emailUtil.sendEmail({
          to: validRecipients,
          subject: email.subject,
          html: email.html,
          text: email.text,
          attachments: email.attachments,
        });

        email.status = 'sent';
        email.sentAt = new Date();
        logger.info(`Scheduled email ${email._id} sent successfully`);
      } catch (error) {
        logger.error(`Failed to send scheduled email ${email._id}:`, error);

        email.retryCount = (email.retryCount || 0) + 1;

        if (email.retryCount >= (email.maxRetries || 3)) {
          email.status = 'failed';
          email.error = error.message;

          // Track bounce if applicable
          if (
            error.message.includes('bounce') ||
            error.message.includes('invalid') ||
            error.message.includes('rejected')
          ) {
            for (const recipient of email.to) {
              await EmailBounce.findOneAndUpdate(
                { email: recipient.toLowerCase() },
                {
                  $set: { type: 'soft', reason: error.message, lastBounceAt: new Date() },
                  $inc: { bounceCount: 1 },
                },
                { upsert: true }
              );
            }
          }
        }
        // If not max retries, leave as pending to retry next cycle
      }

      await email.save();
    }
  } catch (error) {
    logger.error('Scheduled email worker error:', error);
  }
}

/**
 * Initialize all background jobs
 */
function initializeJobs() {
  logger.info('Initializing background jobs...');

  // Alert scanner - runs daily at 6 AM
  cron.schedule('0 6 * * *', async () => {
    try {
      await scanAlerts();
    } catch (error) {
      logger.error('Scheduled alert scan failed:', error);
    }
  });
  logger.info('Alert scanner job scheduled (daily at 6 AM)');

  // Scheduled email worker - runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledEmails();
    } catch (error) {
      logger.error('Scheduled email processing failed:', error);
    }
  });
  logger.info('Email worker job scheduled (every minute)');

  logger.info('All background jobs initialized successfully');
}

module.exports = {
  initializeJobs,
  scanAlerts,
  processScheduledEmails,
};
