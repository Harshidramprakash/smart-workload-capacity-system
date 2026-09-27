// services/report-service/controllers/reportController.js - Report Controller
const path = require('path');
const fs = require('fs');
const Report = require('../../../shared/models/Report');
const reportService = require('../services/reportService');
const { LOCAL_STORAGE_DIR } = require('../adapters/storageAdapter');

const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('generated_by', 'name email')
      .sort({ generated_at: -1 })
      .limit(50);
    res.json(reports);
  } catch (error) { next(error); }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('generated_by', 'name email');
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json(report);
  } catch (error) { next(error); }
};

const generateWorkloadReport = async (req, res, next) => {
  try {
    const { type, teamId, employeeId, startDate, endDate, exportCSV } = req.body;
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

    let storageResult = null;
    if (exportCSV) {
      storageResult = await reportService.exportReportToStorage(reportData.reportType, reportData);
    }

    const report = await Report.create({
      generated_by: req.user._id,
      report_type: reportData.reportType,
      parameters: { type, teamId, employeeId, startDate, endDate },
      data: reportData,
      file_path: storageResult ? storageResult.file_url : ''
    });

    res.json({
      message: 'Report generated successfully',
      report: {
        ...report.toObject(),
        data: reportData
      },
      export: storageResult
    });
  } catch (error) { next(error); }
};

const generateCapacityReport = async (req, res, next) => {
  try {
    const { exportCSV } = req.body;
    const reportData = await reportService.generateCapacityReport();

    let storageResult = null;
    if (exportCSV) {
      storageResult = await reportService.exportReportToStorage('Capacity Utilization', reportData);
    }

    const report = await Report.create({
      generated_by: req.user._id,
      report_type: 'Capacity Utilization',
      parameters: {},
      data: reportData,
      file_path: storageResult ? storageResult.file_url : ''
    });

    res.json({
      message: 'Capacity report generated successfully',
      report: {
        ...report.toObject(),
        data: reportData
      },
      export: storageResult
    });
  } catch (error) { next(error); }
};

const downloadReportFile = (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(LOCAL_STORAGE_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Export file not found.' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'text/csv');
  fs.createReadStream(filePath).pipe(res);
};

module.exports = {
  getReports,
  getReportById,
  generateWorkloadReport,
  generateCapacityReport,
  downloadReportFile
};
