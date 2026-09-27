// services/capacity-service/adapters/hrmsAdapter.js
// HRMS / Leave Management System Integration Adapter
// ----------------------------------------------------------
// This adapter provides a clean interface for HRMS/Leave integration.
// Currently uses a LOCAL MOCK provider.
// Replace with real HRMS API calls by implementing the same interface.
// ----------------------------------------------------------

const PROVIDER = process.env.HRMS_API_URL && process.env.HRMS_API_URL !== 'http://localhost:9090/api/hrms' ? 'external' : 'mock';

/**
 * Fetch leave hours for an employee on a given date.
 * In production, this calls the HRMS / Leave Management API.
 *
 * @param {string} employeeEmail - Employee's email
 * @param {Date} date - Date to check
 * @returns {Promise<{leaveHours: number, leaveType: string|null, isOnLeave: boolean}>}
 */
const getLeaveData = async (employeeEmail, date) => {
  if (PROVIDER === 'mock') {
    // MOCK: Return no leave — real leave data must come from HRMS
    console.log(`[HRMS Adapter] MOCK MODE — no real leave data for ${employeeEmail}`);
    return { leaveHours: 0, leaveType: null, isOnLeave: false, synced: false, provider: 'mock' };
  }

  // Production HRMS API call:
  //   const response = await fetch(`${process.env.HRMS_API_URL}/leave`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'X-API-Key': process.env.HRMS_API_KEY
  //     },
  //     body: JSON.stringify({ email: employeeEmail, date: date.toISOString() })
  //   });
  //   const data = await response.json();
  //   return { leaveHours: data.hours, leaveType: data.type, isOnLeave: data.hours > 0 };

  return { leaveHours: 0, leaveType: null, isOnLeave: false, synced: false, provider: PROVIDER };
};

/**
 * Get non-project activity hours (training, admin work, etc.)
 * @param {string} employeeEmail
 * @param {Date} date
 * @returns {Promise<{nonProjectHours: number}>}
 */
const getNonProjectHours = async (employeeEmail, date) => {
  if (PROVIDER === 'mock') {
    console.log(`[HRMS Adapter] MOCK MODE — no real non-project data for ${employeeEmail}`);
    return { nonProjectHours: 0, synced: false, provider: 'mock' };
  }
  return { nonProjectHours: 0, synced: false, provider: PROVIDER };
};

/**
 * Get employee's standard working hours from HRMS
 * @param {string} employeeEmail
 * @returns {Promise<{workingHours: number}>}
 */
const getWorkingHours = async (employeeEmail) => {
  if (PROVIDER === 'mock') {
    return { workingHours: 8, synced: false, provider: 'mock' };
  }
  return { workingHours: 8, synced: false, provider: PROVIDER };
};

module.exports = { getLeaveData, getNonProjectHours, getWorkingHours, PROVIDER };
