// shared/models/index.js - Central registry for all Mongoose models
// Ensures all schemas are registered in Mongoose memory to prevent MissingSchemaError on .populate()

module.exports = {
  User: require('./User'),
  Role: require('./Role'),
  UserRole: require('./UserRole'),
  Employee: require('./Employee'),
  Team: require('./Team'),
  TeamMember: require('./TeamMember'),
  Project: require('./Project'),
  Sprint: require('./Sprint'),
  Task: require('./Task'),
  TaskAssignment: require('./TaskAssignment'),
  TimeLog: require('./TimeLog'),
  Availability: require('./Availability'),
  Workload: require('./Workload'),
  CapacityAnalysis: require('./CapacityAnalysis'),
  Notification: require('./Notification'),
  Report: require('./Report'),
  SystemSetting: require('./SystemSetting')
};
