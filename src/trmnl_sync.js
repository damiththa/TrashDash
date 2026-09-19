/**
 * TRMNL API Synchronization Module for TrashDash
 * Communicates with official TRMNL API (https://trmnl.com/api)
 */
import { getWeekStatus } from './trash_logic.js';

const TRMNL_API_BASE = 'https://trmnl.com/api';

/**
 * Helper to make authenticated requests to TRMNL API
 */
async function trmnlRequest(endpoint, apiKey, options = {}) {
  const url = `${TRMNL_API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TRMNL API ${options.method || 'GET'} ${endpoint} failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * List all devices on the account
 */
export async function getDevices(apiKey) {
  const result = await trmnlRequest('/devices', apiKey);
  return result.data || [];
}

/**
 * List playlist items for a specific device
 */
export async function getDevicePlaylist(apiKey, deviceId) {
  const result = await trmnlRequest(`/devices/${deviceId}/playlist_items`, apiKey);
  return result.data || [];
}

/**
 * Read the current schedule for a playlist item
 */
export async function getPlaylistItemSchedule(apiKey, itemId) {
  const result = await trmnlRequest(`/playlists/items/${itemId}/schedule`, apiKey);
  return result.data || {};
}

/**
 * Replace the schedule for a playlist item
 * @param {Array} weekSchedules - [{ week_days: [4], start_time: "12:00", end_time: "23:59" }]
 */
export async function updatePlaylistItemSchedule(apiKey, itemId, weekSchedules) {
  return trmnlRequest(`/playlists/items/${itemId}/schedule`, apiKey, {
    method: 'PUT',
    body: JSON.stringify({
      week_schedules: weekSchedules
    })
  });
}

/**
 * Full TRMNL Sync: Discovers devices and updates TrashDash schedule dynamically
 * @param {string} apiKey - TRMNL account API key
 * @param {object} tzDate - current timezone date object
 * @param {object} options - { targetDevice: 'black' | 'grey' | 'all' }
 */
export async function syncTrashDashSchedule(apiKey, tzDate, options = {}) {
  const targetFilter = (options.targetDevice || 'black').toLowerCase();
  const status = getWeekStatus(tzDate);

  // Determine intended schedule:
  // Normal week: Thursday (day 4) 12:00 - 23:59
  // Holiday week: Thursday (day 4) & Friday (day 5) 12:00 - 23:59
  const weekDays = status.isHolidayWeek ? [4, 5] : [4];
  const desiredSchedule = [
    {
      week_days: weekDays,
      start_time: "12:00",
      end_time: "23:59"
    }
  ];

  // 1. Fetch all devices
  const devices = await getDevices(apiKey);

  // 2. Filter devices based on target (e.g. 'black' only for DEV)
  const matchedDevices = devices.filter(dev => {
    const devName = (dev.name || '').toLowerCase();
    if (targetFilter === 'all') return true;
    return devName.includes(targetFilter);
  });

  const syncResults = [];

  // 3. For each matched device, find TrashDash and update its schedule
  for (const device of matchedDevices) {
    const playlistItems = await getDevicePlaylist(apiKey, device.id);

    // Find TrashDash item: matches name or keyname containing 'trash'
    const trashItems = playlistItems.filter(item => {
      const pluginName = (item.plugin?.name || '').toLowerCase();
      const pluginKey = (item.plugin?.keyname || '').toLowerCase();
      return pluginName.includes('trash') || pluginKey.includes('trash');
    });

    for (const item of trashItems) {
      const updateRes = await updatePlaylistItemSchedule(apiKey, item.id, desiredSchedule);
      syncResults.push({
        device_id: device.id,
        device_name: device.name,
        playlist_item_id: item.id,
        plugin_name: item.plugin?.name || 'TrashDash',
        applied_schedule: desiredSchedule,
        is_holiday_week: status.isHolidayWeek,
        holiday_name: status.holidayName || null,
        success: true
      });
    }
  }

  return {
    success: true,
    target_filter: targetFilter,
    is_holiday_week: status.isHolidayWeek,
    holiday_name: status.holidayName || null,
    devices_found: devices.map(d => ({ id: d.id, name: d.name, friendly_id: d.friendly_id })),
    matched_devices: matchedDevices.map(d => ({ id: d.id, name: d.name })),
    updated_items: syncResults
  };
}
