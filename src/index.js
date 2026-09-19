import { processRequest } from './trash_logic.js';
import { syncTrashDashSchedule, getDevices, getDevicePlaylist } from './trmnl_sync.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const testMode = url.searchParams.get('test');
    const now = new Date();
    const tzDate = getTzDateParts(now, 'America/New_York');

    const apiKey = env.TRMNL_API_KEY || url.searchParams.get('key') || request.headers.get('x-trmnl-key');

    // --- Manual / Diagnostic TRMNL Sync Endpoint ---
    if (url.pathname === '/sync-schedule' || url.searchParams.has('sync')) {
      if (!apiKey) {
        return new Response(JSON.stringify({
          error: "TRMNL_API_KEY secret is not configured in Cloudflare environment."
        }, null, 2), {
          status: 400,
          headers: { "content-type": "application/json;charset=UTF-8" }
        });
      }

      const target = url.searchParams.get('target') || 'black'; // default: DEV / Black only
      try {
        const syncResult = await syncTrashDashSchedule(apiKey, tzDate, { targetDevice: target });
        return new Response(JSON.stringify(syncResult, null, 2), {
          status: 200,
          headers: { "content-type": "application/json;charset=UTF-8" }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          error: err.message
        }, null, 2), {
          status: 500,
          headers: { "content-type": "application/json;charset=UTF-8" }
        });
      }
    }

    // --- Diagnostic TRMNL Status Endpoint (read-only inspection) ---
    if (url.pathname === '/trmnl-status') {
      const envKeys = Object.keys(env || {});
      if (!apiKey) {
        return new Response(JSON.stringify({
          configured: false,
          message: "TRMNL_API_KEY secret not found in environment.",
          env_keys: envKeys
        }, null, 2), {
          status: 200,
          headers: { "content-type": "application/json;charset=UTF-8" }
        });
      }

      try {
        const devices = await getDevices(apiKey);
        const deviceDetails = [];
        for (const dev of devices) {
          const items = await getDevicePlaylist(apiKey, dev.id);
          deviceDetails.push({
            device_id: dev.id,
            device_name: dev.name,
            friendly_id: dev.friendly_id,
            playlist_items: items.map(it => ({
              id: it.id,
              plugin_setting_id: it.plugin_setting_id,
              plugin_name: it.plugin?.name,
              plugin_key: it.plugin?.keyname,
              configuration_state: it.configuration_state,
              visible: it.visible
            }))
          });
        }
        return new Response(JSON.stringify({
          configured: true,
          env_configured: !!env.TRMNL_API_KEY,
          devices: deviceDetails
        }, null, 2), {
          status: 200,
          headers: { "content-type": "application/json;charset=UTF-8" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }, null, 2), {
          status: 500,
          headers: { "content-type": "application/json;charset=UTF-8" }
        });
      }
    }

    // --- Normal Polling / Screen Payload ---
    let renderTzDate = tzDate;

    if (testMode === 'reminder') {
      // Simulate a normal Thursday at 3 PM for preview
      renderTzDate = {
        year: 2026, month: 8, day: 6,
        hour: 15, dayOfWeek: 4,
        jsDate: new Date(2026, 7, 6)
      };
    } else if (testMode === 'holiday_thu') {
      // Simulate Thanksgiving Thursday (Delay Notice) for preview
      renderTzDate = {
        year: 2026, month: 11, day: 26,
        hour: 15, dayOfWeek: 4,
        jsDate: new Date(2026, 10, 26)
      };
    } else if (testMode === 'holiday' || testMode === 'holiday_fri') {
      // Simulate Thanksgiving Friday (Action Night) for preview
      renderTzDate = {
        year: 2026, month: 11, day: 27,
        hour: 15, dayOfWeek: 5,
        jsDate: new Date(2026, 10, 27)
      };
    }

    const result = processRequest(renderTzDate);

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "content-type": "application/json;charset=UTF-8" },
    });
  },

  // --- Daily Cron Trigger Handler ---
  async scheduled(event, env, ctx) {
    if (!env.TRMNL_API_KEY) {
      console.warn("Scheduled cron ran, but TRMNL_API_KEY is not configured.");
      return;
    }

    const now = new Date();
    const tzDate = getTzDateParts(now, 'America/New_York');

    try {
      // Default to 'black' DEV device initially; can be expanded to 'all' once approved
      const syncResult = await syncTrashDashSchedule(env.TRMNL_API_KEY, tzDate, { targetDevice: 'black' });
      console.log("Daily TRMNL Schedule Sync executed:", JSON.stringify(syncResult));
    } catch (err) {
      console.error("Daily TRMNL Schedule Sync failed:", err.message);
    }
  }
};


// --- Timezone Helper ---
function getTzDateParts(dateObj, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    weekday: 'long'
  });
  
  const parts = formatter.formatToParts(dateObj);
  const p = {};
  for (const part of parts) {
    p[part.type] = part.value;
  }
  
  const dayNames = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };
  
  return {
    year: parseInt(p.year, 10),
    month: parseInt(p.month, 10),
    day: parseInt(p.day, 10),
    hour: parseInt(p.hour, 10),
    dayOfWeek: dayNames[p.weekday],
    jsDate: new Date(p.year, p.month - 1, p.day)
  };
}
