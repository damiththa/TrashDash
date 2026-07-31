/**
 * Leominster Trash Day & Holiday Logic for TrashDash TRMNL Plugin
 */

export function getHolidayForDate(year, month, day) {
  if (month === 1 && day === 1) return "New Year's Day";
  if (month === 7 && day === 4) return "Independence Day";
  if (month === 12 && day === 25) return "Christmas Day";

  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  const getOccurrences = (y, m, d) => {
    let count = 0;
    for (let i = 1; i <= d; i++) {
      if (new Date(y, m - 1, i).getDay() === dayOfWeek) count++;
    }
    return count;
  };

  const isLastOccurrence = (y, m, d) => {
    const d1 = new Date(y, m - 1, d);
    const d2 = new Date(y, m - 1, d + 7);
    return d1.getMonth() === m - 1 && d2.getMonth() !== m - 1;
  };

  if (month === 5 && dayOfWeek === 1 && isLastOccurrence(year, month, day)) return "Memorial Day";
  if (month === 9 && dayOfWeek === 1 && getOccurrences(year, month, day) === 1) return "Labor Day";
  if (month === 11 && dayOfWeek === 4 && getOccurrences(year, month, day) === 4) return "Thanksgiving Day";

  return null;
}

export function getObservedHoliday(year, month, day) {
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay();

  if (dayOfWeek === 1) {
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    const holidayYesterday = getHolidayForDate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate());
    if (["New Year's Day", "Independence Day", "Christmas Day"].includes(holidayYesterday)) {
      return holidayYesterday + " (Observed)";
    }
  }
  return getHolidayForDate(year, month, day);
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

export function getWeekStatus(tzDate) {
  const current = tzDate.jsDate;
  const monday = getMonday(current);
  
  let weekHoliday = null;
  
  for (let i = 0; i < 5; i++) {
    const checkDate = new Date(monday);
    checkDate.setDate(monday.getDate() + i);
    
    const holiday = getObservedHoliday(checkDate.getFullYear(), checkDate.getMonth() + 1, checkDate.getDate());
    if (holiday) {
      weekHoliday = holiday;
      break;
    }
  }

  const isHolidayWeek = weekHoliday !== null;
  const pickupDayName = isHolidayWeek ? "SATURDAY" : "FRIDAY";
  const reminderDayName = isHolidayWeek ? "Friday" : "Thursday";
  const reminderDay = isHolidayWeek ? 5 : 4; 

  return {
    isHolidayWeek,
    holidayName: weekHoliday,
    pickupDayName,
    reminderDayName,
    reminderDay
  };
}

// --- Vector / Inline SVG TRMNL Themes ---

function renderHolidayTheme(status) {
  return `
    <div style="width: 800px; height: 480px; background: #ffffff; color: #000000; border: 12px solid #000000; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
      
      <div style="background: #000000; color: #ffffff; width: 100%; text-align: center; padding: 12px 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">
        ⚠️ HOLIDAY WEEK SCHEDULE SHIFT
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;">
        <div style="font-size: 30px; font-weight: 800; border-bottom: 3px solid #000000; padding-bottom: 6px;">
          Observed Holiday: <span style="font-weight: 900; text-decoration: underline;">${status.holidayName.toUpperCase()}</span>
        </div>

        <div style="font-size: 24px; font-weight: 600; margin-top: 8px;">
          Collection is delayed by 1 day this week.
        </div>

        <div style="background: #000000; color: #ffffff; padding: 16px 40px; border-radius: 12px; margin-top: 10px; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Shifted Pickup Day</div>
          <div style="font-size: 46px; font-weight: 900;">${status.pickupDayName} MORNING</div>
        </div>
      </div>

      <div style="font-size: 22px; font-weight: 700;">
        ⏰ Reminder: Put bins out Friday night after 2 PM!
      </div>

    </div>
  `;
}

function renderRaccoonTheme(status) {
  return `
    <div style="width: 800px; height: 480px; background: #ffffff; color: #000000; border: 8px solid #000000; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 24px; font-family: system-ui, -apple-system, sans-serif;">
      
      <div style="background: #000000; color: #ffffff; padding: 8px 24px; border-radius: 999px; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
        🚨 TRASHDASH REMINDER
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;">
        <svg width="110" height="90" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          <path d="M10 11v6M14 11v6"/>
          <circle cx="17" cy="4" r="2" fill="#000000"/>
        </svg>
        
        <div style="font-size: 50px; font-weight: 900; line-height: 1.1; text-transform: uppercase; letter-spacing: -1px;">
          BEAT THE RACCOONS!
        </div>
        
        <div style="font-size: 26px; font-weight: 600;">
          Roll trash & recycling to the curb tonight.
        </div>
      </div>

      <div style="width: 100%; border-top: 4px solid #000000; padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 24px; font-weight: 700;">
          🗓️ PICKUP DAY: <span style="font-size: 32px; font-weight: 900; text-decoration: underline;">${status.pickupDayName}</span>
        </div>
        <div style="font-size: 22px; font-weight: 600;">
          Leominster, MA 🏡
        </div>
      </div>

    </div>
  `;
}

function renderGymTheme(status) {
  return `
    <div style="width: 800px; height: 480px; background: #000000; color: #ffffff; border: 8px solid #ffffff; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 24px; font-family: system-ui, -apple-system, sans-serif;">
      
      <div style="background: #ffffff; color: #000000; padding: 8px 32px; border-radius: 8px; font-size: 22px; font-weight: 900; letter-spacing: 2px;">
        ⚡ TRASHDASH ALERT ⚡
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;">
        <div style="font-size: 56px; font-weight: 900; line-height: 1.05; letter-spacing: -1px;">
          LEG DAY? NAH, BIN DAY!
        </div>
        
        <div style="display: flex; gap: 24px; align-items: center; margin: 4px 0;">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
            <path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M2 11v2M22 11v2M9.5 6.5v11M14.5 6.5v11"/>
          </svg>
          <span style="font-size: 36px; font-weight: 900;">+</span>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>

        <div style="font-size: 26px; font-weight: 700; color: #ffffff;">
          Time to heavy-lift your bins to the curb!
        </div>
      </div>

      <div style="width: 100%; border-top: 4px solid #ffffff; padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 26px; font-weight: 700;">
          NEXT PICKUP: <span style="font-size: 32px; font-weight: 900; background: #ffffff; color: #000000; padding: 2px 12px; border-radius: 6px;">${status.pickupDayName} MORNING</span>
        </div>
      </div>

    </div>
  `;
}

function renderHeroTheme(status) {
  return `
    <div style="width: 800px; height: 480px; background: #ffffff; color: #000000; border: 8px solid #000000; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 24px; font-family: system-ui, -apple-system, sans-serif;">
      
      <div style="background: #000000; color: #ffffff; padding: 8px 24px; border-radius: 999px; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
        🦸 HERO DUTY CALLS
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;">
        <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        
        <div style="font-size: 52px; font-weight: 900; line-height: 1.1; text-transform: uppercase;">
          TRASH HERO NEEDED!
        </div>
        
        <div style="font-size: 26px; font-weight: 600;">
          Your mission: curb the bins before morning.
        </div>
      </div>

      <div style="width: 100%; border-top: 4px solid #000000; padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 24px; font-weight: 700;">
          🗓️ PICKUP DAY: <span style="font-size: 32px; font-weight: 900; text-decoration: underline;">${status.pickupDayName}</span>
        </div>
        <div style="font-size: 22px; font-weight: 600;">
          Leominster, MA 🏡
        </div>
      </div>

    </div>
  `;
}

export function processRequest(tzDate) {
  const status = getWeekStatus(tzDate);
  const isReminderTime = (tzDate.dayOfWeek === status.reminderDay && tzDate.hour >= 14);

  // When NOT reminder time, return 204 No Content so TRMNL yields to other plugins
  if (!isReminderTime) {
    return {
      status: 204,
      isReminderTime: false,
      markup: ""
    };
  }

  // During reminder time, pick theme
  let markup = "";
  if (status.isHolidayWeek) {
    markup = renderHolidayTheme(status);
  } else {
    const normalThemes = [renderRaccoonTheme, renderGymTheme, renderHeroTheme];
    // Pick theme based on hour so it rotates reliably on refreshes
    const themeIndex = tzDate.hour % normalThemes.length;
    markup = normalThemes[themeIndex](status);
  }

  return {
    status: 200,
    isReminderTime: true,
    markup: markup
  };
}
