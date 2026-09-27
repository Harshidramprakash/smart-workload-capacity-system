// services/capacity-service/adapters/calendarAdapter.js
// Google Calendar / Microsoft Outlook Integration Adapter
// ----------------------------------------------------------
// This adapter provides a clean interface for calendar integration.
// Currently uses a LOCAL MOCK provider.
// Replace with real Google Calendar API or Microsoft Graph API
// by implementing the same interface with real SDK calls.
// ----------------------------------------------------------

const PROVIDER = process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_ID !== 'your_google_client_id' ? 'google' : 'mock';

/**
 * Fetch meeting hours for an employee on a given date.
 * In production, this calls Google Calendar API / Microsoft Graph API.
 *
 * @param {string} employeeEmail - Employee's email address
 * @param {Date} date - Date to fetch meetings for
 * @returns {Promise<{meetingHours: number, meetings: Array}>}
 */
const getMeetingHours = async (employeeEmail, date) => {
  if (PROVIDER === 'mock') {
    // MOCK: Return empty — real meetings must come from Google Calendar / Outlook
    console.log(`[Calendar Adapter] MOCK MODE — no real calendar data for ${employeeEmail}`);
    return { meetingHours: 0, meetings: [], synced: false, provider: 'mock' };
  }

  // Production Google Calendar:
  //   const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  //   const events = await calendar.events.list({
  //     calendarId: employeeEmail,
  //     timeMin: startOfDay.toISOString(),
  //     timeMax: endOfDay.toISOString(),
  //     singleEvents: true,
  //     orderBy: 'startTime'
  //   });
  //   ... calculate total hours from events ...

  return { meetingHours: 0, meetings: [], synced: false, provider: PROVIDER };
};

/**
 * Get OAuth URL to connect employee's calendar.
 * @returns {string|null}
 */
const getCalendarAuthURL = () => {
  if (PROVIDER === 'mock') {
    console.log('[Calendar Adapter] MOCK MODE — no OAuth URL available');
    return null;
  }
  // Production: return Google/Microsoft OAuth URL
  return null;
};

/**
 * Handle OAuth callback and store tokens.
 * @param {string} code - Authorization code
 * @param {string} userId - User ID to associate tokens with
 */
const handleCalendarCallback = async (code, userId) => {
  if (PROVIDER === 'mock') {
    console.log('[Calendar Adapter] MOCK MODE — no real callback handling');
    return { success: false, provider: 'mock' };
  }
  return { success: false, provider: PROVIDER };
};

module.exports = { getMeetingHours, getCalendarAuthURL, handleCalendarCallback, PROVIDER };
