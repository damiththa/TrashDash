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

// --- Fun Rotating Themes ---

const THEMES = [
  {
    headline: "BEAT THE RACCOONS!",
    subtext: "They're plotting. You're faster. Bins out NOW.",
    badge: "RACCOON ALERT"
  },
  {
    headline: "LEG DAY? NAH, BIN DAY!",
    subtext: "Deadlift those bins to the curb. No excuses.",
    badge: "GYM BRO MODE"
  },
  {
    headline: "MISSION: CURBSIDE",
    subtext: "T-minus tonight. Launch sequence: grab, roll, deploy.",
    badge: "HOUSTON, WE HAVE TRASH"
  },
  {
    headline: "YOUR BINS MISS THE CURB",
    subtext: "It's been a whole week. Reunite them tonight.",
    badge: "EMOTIONAL SUPPORT BINS"
  },
  {
    headline: "TRASH TALK",
    subtext: "Your garbage called. It wants out. Tonight.",
    badge: "INCOMING CALL"
  },
  {
    headline: "CURB YOUR ENTHUSIASM",
    subtext: "...and your trash. Larry David would approve.",
    badge: "HBO PRESENTS"
  },
  {
    headline: "WANTED: TRASH HERO",
    subtext: "Cape optional. Bins mandatory. Curb by tonight.",
    badge: "HERO DUTY CALLS"
  },
  {
    headline: "PLOT TWIST:",
    subtext: "Tomorrow is trash day. You're the main character.",
    badge: "BREAKING NEWS"
  },
  {
    headline: "THIS IS YOUR SIGN",
    subtext: "The universe says: take the bins out tonight.",
    badge: "COSMIC REMINDER"
  },
  {
    headline: "DON'T BE THAT NEIGHBOR",
    subtext: "You know the one. Bins out tonight, legend.",
    badge: "NEIGHBORHOOD WATCH"
  }
];

// --- Fun Rotating Idle Themes (non-reminder days) ---

const IDLE_THEMES = [
  {
    headline: "BINS CAN CHILL",
    subtext: "No action needed. Enjoy your day!",
    badge: "OFF DUTY"
  },
  {
    headline: "RACCOONS: 0  YOU: 1",
    subtext: "Last pickup was a success. Standing by until Thursday.",
    badge: "STANDBY MODE"
  },
  {
    headline: "NOTHING TO HAUL",
    subtext: "Your curb is clean. Your conscience is clear. See you Thursday.",
    badge: "ZEN MODE"
  },
  {
    headline: "MISSION ACCOMPLISHED",
    subtext: "Trash: collected. Bins: stored. You: legend.",
    badge: "DEBRIEFING"
  },
  {
    headline: "THE CURB IS QUIET",
    subtext: "No bins needed. The neighborhood sleeps.",
    badge: "ALL CLEAR"
  },
  {
    headline: "TRASH FREE ZONE",
    subtext: "Nothing to see here. Move along, citizen.",
    badge: "PATROL REPORT"
  }
];


export function processRequest(tzDate) {
  const status = getWeekStatus(tzDate);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Determine display mode: "reminder", "holiday_delay", "holiday_action", or "idle"
  let mode = "idle";
  let theme = null;
  let bannerLabel = "NEXT PICKUP";
  let bannerValue = status.pickupDayName;

  if (status.isHolidayWeek) {
    if (tzDate.dayOfWeek === 4) {
      // Thursday of Holiday Week: Delay Notice
      mode = "holiday_delay";
      theme = {
        headline: "NO TRASH TONIGHT!",
        subtext: `Collection delayed 1 day for ${status.holidayName}. Bins stay off the curb tonight!`,
        badge: "⚠️ HOLIDAY DELAY"
      };
      bannerLabel = "BINS GO OUT FRIDAY NIGHT";
      bannerValue = "PICKUP: SATURDAY MORNING";
    } else if (tzDate.dayOfWeek === 5) {
      // Friday of Holiday Week: Action Night
      mode = "holiday_action";
      theme = {
        headline: "BINS OUT TONIGHT!",
        subtext: `Collection delayed 1 day for ${status.holidayName}. Roll bins to curb tonight!`,
        badge: "⚠️ SCHEDULE ALERT"
      };
      bannerLabel = "SHIFTED PICKUP DAY";
      bannerValue = "SATURDAY MORNING";
    }
  } else {
    if (tzDate.dayOfWeek === 4) {
      // Normal Thursday: Fun rotating themes
      mode = "reminder";
      const themeIndex = tzDate.hour % THEMES.length;
      theme = THEMES[themeIndex];
      bannerLabel = "PICKUP DAY";
      bannerValue = status.pickupDayName;
    }
  }

  // Idle screen: shown on all non-reminder days (rotates hourly)
  if (mode === "idle") {
    const idleIndex = tzDate.hour % IDLE_THEMES.length;
    theme = IDLE_THEMES[idleIndex];
    bannerLabel = "NEXT PICKUP";
    bannerValue = status.pickupDayName;
  }

  const debugInfo = `${dayNames[tzDate.dayOfWeek]} ${tzDate.month}/${tzDate.day}/${tzDate.year} ${tzDate.hour}:00 ET | dow=${tzDate.dayOfWeek} | mode=${mode} | isHolidayWeek=${status.isHolidayWeek} (${status.holidayName || 'None'})`;

  return {
    isReminderTime: mode !== "idle",
    data: {
      is_reminder: "yes",
      display_mode: mode,
      pickup_day: status.pickupDayName,
      reminder_day: status.reminderDayName,
      is_holiday_week: status.isHolidayWeek ? "yes" : "no",
      holiday_name: status.holidayName || "",
      headline: theme.headline,
      subtext: theme.subtext,
      badge: theme.badge,
      banner_label: bannerLabel,
      banner_value: bannerValue,
      debug_info: debugInfo
    }
  };
}
