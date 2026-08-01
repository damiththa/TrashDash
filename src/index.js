import { processRequest, getWeekStatus } from './trash_logic.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const testMode = url.searchParams.get('test');

    let tzDate;

    if (testMode === 'reminder') {
      // Simulate a normal Thursday at 3 PM for preview
      tzDate = {
        year: 2026, month: 8, day: 6,
        hour: 15, dayOfWeek: 4, // Thursday
        jsDate: new Date(2026, 7, 6)
      };
    } else if (testMode === 'holiday') {
      // Simulate Thanksgiving Friday at 3 PM for preview
      tzDate = {
        year: 2026, month: 11, day: 27,
        hour: 15, dayOfWeek: 5, // Friday after Thanksgiving
        jsDate: new Date(2026, 10, 27)
      };
    } else {
      // Real production mode
      const now = new Date();
      tzDate = getTzDateParts(now, 'America/New_York');
    }

    // Run the trash schedule logic
    const result = processRequest(tzDate);

    // If not reminder time, return empty markup so TRMNL skips this plugin
    if (!result.isReminderTime) {
      return new Response(JSON.stringify({
        status: 0,
        markup: ""
      }), {
        headers: { "content-type": "application/json;charset=UTF-8" },
      });
    }

    // Return the reminder markup
    return new Response(JSON.stringify({
      status: 200,
      markup: result.markup
    }), {
      headers: { "content-type": "application/json;charset=UTF-8" },
    });
  },
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
