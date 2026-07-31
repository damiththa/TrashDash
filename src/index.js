import { processRequest } from './trash_logic.js';

export default {
  async fetch(request, env, ctx) {
    // 1. Get current date/time in Leominster (America/New_York timezone)
    const now = new Date();
    const tzDate = getTzDateParts(now, 'America/New_York');

    // 2. Run the trash schedule logic
    const { status, isReminderTime, markup } = processRequest(tzDate);

    // 3. Return JSON payload expected by TRMNL
    return new Response(JSON.stringify({
      status: 200,
      markup: markup
    }), {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
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
