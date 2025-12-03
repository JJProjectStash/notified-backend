/**
 * Alert Controller
 * Handles HTTP requests for attendance alerts and smart triggers
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const { Alert, AlertConfig, Student, Subject, Attendance, Enrollment } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

/**
 * @route   GET /api/v1/alerts
 * @desc    Get alerts with optional filters
 * @access  Private
 */
const getAlerts = asyncHandler(async (req, res) => {
  const { type, severity, acknowledged, studentId, subjectId, page = 1, limit = 20 } = req.query;

  const query = {};

  if (type) query.type = type;
  if (severity) query.severity = severity;
  if (acknowledged !== undefined) query.acknowledged = acknowledged === 'true';
  if (studentId) query.student = studentId;
  if (subjectId) query.subject = subjectId;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await Alert.countDocuments(query);

  const alerts = await Alert.find(query)
    .populate('student', 'studentNumber firstName lastName email')
    .populate('subject', 'subjectCode subjectName')
    .populate('acknowledgedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  // Transform alerts to expected format
  const transformedAlerts = alerts.map((alert) => ({
    id: alert._id.toString(),
    type: alert.type,
    severity: alert.severity,
    studentId: alert.student?._id?.toString(),
    studentName: alert.student ? `${alert.student.firstName} ${alert.student.lastName}` : 'Unknown',
    studentNumber: alert.student?.studentNumber || 'N/A',
    subjectId: alert.subject?._id?.toString(),
    subjectName: alert.subject?.subjectName,
    message: alert.message,
    details: alert.details,
    acknowledged: alert.acknowledged,
    acknowledgedAt: alert.acknowledgedAt,
    acknowledgedBy: alert.acknowledgedBy?.name,
    notificationSent: alert.notificationSent,
    createdAt: alert.createdAt,
  }));

  return res.json({
    success: true,
    data: transformedAlerts,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

/**
 * @route   GET /api/v1/alerts/summary
 * @desc    Get alert summary statistics
 * @access  Private
 */
const getSummary = asyncHandler(async (req, res) => {
  const [total, critical, warning, unacknowledged, byType] = await Promise.all([
    Alert.countDocuments(),
    Alert.countDocuments({ severity: 'critical' }),
    Alert.countDocuments({ severity: 'warning' }),
    Alert.countDocuments({ acknowledged: false }),
    Alert.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);

  const byTypeFormatted = {};
  byType.forEach((item) => {
    byTypeFormatted[item._id] = item.count;
  });

  return res.json({
    success: true,
    data: {
      total,
      critical,
      warning,
      unacknowledged,
      byType: byTypeFormatted,
    },
  });
});

/**
 * @route   PUT /api/v1/alerts/:alertId/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private
 */
const acknowledge = asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  const alert = await Alert.findByIdAndUpdate(
    alertId,
    {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user._id,
    },
    { new: true }
  );

  if (!alert) {
    return ApiResponse.error(res, 'Alert not found', 404);
  }

  return res.json({
    success: true,
    message: 'Alert acknowledged',
    data: alert,
  });
});

/**
 * @route   PUT /api/v1/alerts/acknowledge-multiple
 * @desc    Acknowledge multiple alerts
 * @access  Private
 */
const acknowledgeMultiple = asyncHandler(async (req, res) => {
  const { alertIds } = req.body;

  if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
    return ApiResponse.error(res, 'Alert IDs array is required', 400);
  }

  const result = await Alert.updateMany(
    { _id: { $in: alertIds } },
    {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user._id,
    }
  );

  return res.json({
    success: true,
    message: `${result.modifiedCount} alerts acknowledged`,
    data: { modifiedCount: result.modifiedCount },
  });
});

/**
 * @route   DELETE /api/v1/alerts/:alertId
 * @desc    Dismiss/delete an alert
 * @access  Private
 */
const dismiss = asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  const alert = await Alert.findByIdAndDelete(alertId);

  if (!alert) {
    return ApiResponse.error(res, 'Alert not found', 404);
  }

  return res.json({
    success: true,
    message: 'Alert dismissed',
  });
});

/**
 * @route   GET /api/v1/alerts/consecutive-absences
 * @desc    Get students with consecutive absences
 * @access  Private
 */
const getConsecutiveAbsences = asyncHandler(async (req, res) => {
  const { threshold = 3 } = req.query;
  const thresholdNum = parseInt(threshold, 10);

  const students = await Student.find({ status: 'active' }).lean();
  const results = [];

  for (const student of students) {
    const records = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(thresholdNum + 10)
      .populate('subject', 'subjectName')
      .lean();

    let consecutive = 0;
    let startDate = null;
    let endDate = null;
    const subjects = new Set();

    for (const record of records) {
      if (record.status === 'absent') {
        consecutive++;
        if (!endDate) endDate = record.date;
        startDate = record.date;
        if (record.subject?.subjectName) {
          subjects.add(record.subject.subjectName);
        }
      } else {
        break;
      }
    }

    if (consecutive >= thresholdNum) {
      results.push({
        studentId: student._id.toString(),
        studentName: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentNumber,
        consecutiveDays: consecutive,
        startDate,
        endDate,
        subjects: Array.from(subjects),
      });
    }
  }

  return res.json({
    success: true,
    data: results,
  });
});

/**
 * @route   GET /api/v1/alerts/low-attendance
 * @desc    Get students with low attendance rate
 * @access  Private
 */
const getLowAttendance = asyncHandler(async (req, res) => {
  const { threshold = 80 } = req.query;
  const thresholdNum = parseInt(threshold, 10);

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
    { $match: { rate: { $lt: thresholdNum }, total: { $gte: 5 } } },
    { $sort: { rate: 1 } },
  ]);

  const results = [];

  for (const stat of stats) {
    const student = await Student.findById(stat._id).lean();
    if (!student || student.status !== 'active') continue;

    results.push({
      studentId: stat._id.toString(),
      studentName: `${student.firstName} ${student.lastName}`,
      studentNumber: student.studentNumber,
      attendanceRate: Math.round(stat.rate),
      totalClasses: stat.total,
      attendedClasses: stat.attended,
    });
  }

  return res.json({
    success: true,
    data: results,
  });
});

/**
 * @route   GET /api/v1/alerts/config
 * @desc    Get alert configuration
 * @access  Private
 */
const getConfig = asyncHandler(async (req, res) => {
  let config = await AlertConfig.findOne().lean();

  if (!config) {
    // Return defaults if no config exists
    config = {
      consecutiveAbsenceThreshold: 3,
      lowAttendanceThreshold: 80,
      enableConsecutiveAlerts: true,
      enableLowAttendanceAlerts: true,
      enablePatternAlerts: true,
      autoSendEmail: false,
      emailRecipients: ['guardian'],
    };
  }

  return res.json({
    success: true,
    data: config,
  });
});

/**
 * @route   PUT /api/v1/alerts/config
 * @desc    Update alert configuration
 * @access  Private (Admin)
 */
const updateConfig = asyncHandler(async (req, res) => {
  const {
    consecutiveAbsenceThreshold,
    lowAttendanceThreshold,
    enableConsecutiveAlerts,
    enableLowAttendanceAlerts,
    enablePatternAlerts,
    autoSendEmail,
    emailRecipients,
  } = req.body;

  const updateData = { updatedBy: req.user._id };

  if (consecutiveAbsenceThreshold !== undefined) {
    updateData.consecutiveAbsenceThreshold = consecutiveAbsenceThreshold;
  }
  if (lowAttendanceThreshold !== undefined) {
    updateData.lowAttendanceThreshold = lowAttendanceThreshold;
  }
  if (enableConsecutiveAlerts !== undefined) {
    updateData.enableConsecutiveAlerts = enableConsecutiveAlerts;
  }
  if (enableLowAttendanceAlerts !== undefined) {
    updateData.enableLowAttendanceAlerts = enableLowAttendanceAlerts;
  }
  if (enablePatternAlerts !== undefined) {
    updateData.enablePatternAlerts = enablePatternAlerts;
  }
  if (autoSendEmail !== undefined) {
    updateData.autoSendEmail = autoSendEmail;
  }
  if (emailRecipients !== undefined) {
    updateData.emailRecipients = emailRecipients;
  }

  const config = await AlertConfig.findOneAndUpdate({}, updateData, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  return res.json({
    success: true,
    message: 'Alert configuration updated',
    data: config,
  });
});

/**
 * @route   POST /api/v1/alerts/scan
 * @desc    Manually trigger alert generation
 * @access  Private (Admin)
 */
const runScan = asyncHandler(async (req, res) => {
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

  return res.json({
    success: true,
    data: {
      newAlerts,
      scannedStudents: students.length,
    },
  });
});

/**
 * @route   POST /api/v1/alerts/:alertId/notify
 * @desc    Send notification email for an alert
 * @access  Private
 */
const sendNotification = asyncHandler(async (req, res) => {
  const { alertId } = req.params;
  const { recipients = ['guardian'] } = req.body;

  const alert = await Alert.findById(alertId)
    .populate('student', 'firstName lastName email guardianEmail guardianName')
    .populate('subject', 'subjectName');

  if (!alert) {
    return ApiResponse.error(res, 'Alert not found', 404);
  }

  const student = alert.student;
  if (!student) {
    return ApiResponse.error(res, 'Student not found', 404);
  }

  const emailAddresses = [];

  if (recipients.includes('guardian') && student.guardianEmail) {
    emailAddresses.push(student.guardianEmail);
  }
  if (recipients.includes('student') && student.email) {
    emailAddresses.push(student.email);
  }

  if (emailAddresses.length === 0) {
    return ApiResponse.error(res, 'No valid email addresses found for recipients', 400);
  }

  // Send notification email
  const emailSubject = `Attendance Alert: ${student.firstName} ${student.lastName}`;
  const emailContent = `
    <h2>Attendance Alert</h2>
    <p>Dear Parent/Guardian,</p>
    <p>${alert.message}</p>
    ${alert.details?.consecutiveDays ? `<p>Consecutive absences: ${alert.details.consecutiveDays} days</p>` : ''}
    ${alert.details?.attendanceRate !== undefined ? `<p>Current attendance rate: ${alert.details.attendanceRate}%</p>` : ''}
    <p>Please contact the school if you have any questions.</p>
    <p>Regards,<br>School Administration</p>
  `;

  try {
    for (const email of emailAddresses) {
      await emailService.sendSingleEmail({
        to: email,
        subject: emailSubject,
        message: emailContent,
        userId: req.user._id,
      });
    }

    // Update alert
    alert.notificationSent = true;
    alert.notificationSentAt = new Date();
    await alert.save();

    return res.json({
      success: true,
      message: `Notification sent to ${emailAddresses.length} recipient(s)`,
      data: {
        sentTo: emailAddresses,
      },
    });
  } catch (error) {
    logger.error('Failed to send alert notification:', error);
    return ApiResponse.error(res, 'Failed to send notification email', 500);
  }
});

module.exports = {
  getAlerts,
  getSummary,
  acknowledge,
  acknowledgeMultiple,
  dismiss,
  getConsecutiveAbsences,
  getLowAttendance,
  getConfig,
  updateConfig,
  runScan,
  sendNotification,
};
