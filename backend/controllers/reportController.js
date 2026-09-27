// controllers/reportController.js - Report Controller
const Report = require('../models/Report');
const reportService = require('../services/reportService');

/**
 * GET /api/reports - Get generated reports
 */
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('generated_by', 'name email')
      .sort({ generated_at: -1 })
      .limit(50);
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reports/workload - Generate workload report
 */
const generateWorkloadReport = async (req, res, next) => {
  try {
    const { type, teamId, employeeId, startDate, endDate } = req.body;
    let reportData;

    switch (type || 'employee') {
      case 'team':
        reportData = await reportService.generateTeamWorkloadReport(teamId);
        break;
      case 'historical':
        reportData = await reportService.generateHistoricalReport({ startDate, endDate, employeeId });
        break;
      default:
        reportData = await reportService.generateEmployeeWorkloadReport({ employeeId });
    }

    // Save report record
    const report = await Report.create({
      generated_by: req.user._id,
      report_type: reportData.reportType,
      parameters: { type, teamId, employeeId, startDate, endDate },
      data: reportData
    });

    res.json({ message: 'Report generated successfully', report: { ...report.toObject(), data: reportData } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reports/capacity - Generate capacity report
 */
const generateCapacityReport = async (req, res, next) => {
  try {
    const reportData = await reportService.generateCapacityReport();
    const report = await Report.create({
      generated_by: req.user._id,
      report_type: 'Capacity Utilization',
      parameters: {},
      data: reportData
    });
    res.json({ message: 'Report generated successfully', report: { ...report.toObject(), data: reportData } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReports, generateWorkloadReport, generateCapacityReport };
