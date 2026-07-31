/**
 * Leominster Trash Day & Holiday Logic
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
  const pickupDayName = isHolidayWeek ? "Saturday" : "Friday";
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

const FUN_MESSAGES = [
  "Time to take the trash out! 🏃‍♂️💨",
  "Don't forget the bins! 🗑️✨",
  "It's that time of the week! 🏡🗑️",
  "Trash & Recycling duty calls! 🦸‍♂️",
  "Roll 'em to the curb! 🛹🚮",
  "Your weekly trash mission awaits! 🕵️‍♂️"
];

export function generateMarkup(status, isReminderTime) {
  if (!isReminderTime) {
    return `
      <div class="layout layout--col flex flex-col items-center justify-center h-full w-full bg-white text-black p-4 text-center">
        <span class="title text-5xl font-bold">Trash & Recycling</span>
        <span class="description text-3xl mt-4">Next pickup is on ${status.pickupDayName}.<br>Reminder will appear on ${status.reminderDayName}.</span>
      </div>
    `;
  }

  const randomMsg = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)];
  
  let holidayNotice = "";
  if (status.isHolidayWeek) {
    holidayNotice = `
      <div class="mt-6 mb-2 p-3 border-4 border-black rounded-xl inline-block bg-white text-black">
        <span class="font-bold text-2xl">⚠️ Holiday Week: ${status.holidayName}</span>
      </div>
    `;
  }

  return `
    <div class="layout layout--col flex flex-col items-center justify-center h-full w-full bg-black text-white p-4 text-center">
      <span class="title text-5xl font-bold mb-4">${randomMsg}</span>
      <span class="description text-3xl mt-2">Pickup is tomorrow: <strong>${status.pickupDayName}</strong></span>
      ${holidayNotice}
      <div class="mt-8 text-7xl">
        🗑️ ♻️
      </div>
    </div>
  `;
}

export function processRequest(tzDate) {
  const status = getWeekStatus(tzDate);
  const isReminderTime = (tzDate.dayOfWeek === status.reminderDay && tzDate.hour >= 14);

  return {
    status,
    isReminderTime,
    markup: generateMarkup(status, isReminderTime)
  };
}
