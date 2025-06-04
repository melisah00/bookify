import { DateTime } from 'luxon';

export const DateUtils = {
  DateTime,
  
  formatEventDate(dateStr) {
    const date = DateTime.fromISO(dateStr);
    return date.toLocaleString(DateTime.DATETIME_MED);
  },
  
  formatEventTime(dateStr) {
    const date = DateTime.fromISO(dateStr);
    return date.toLocaleString(DateTime.TIME_SIMPLE);
  },
  
  formatDateRange(startDateStr, endDateStr) {
    const startDate = DateTime.fromISO(startDateStr);
    const endDate = DateTime.fromISO(endDateStr);
    
    if (startDate.hasSame(endDate, 'day')) {
      return `${startDate.toFormat('ccc, LLL d')} · ${startDate.toFormat('h:mm a')} - ${endDate.toFormat('h:mm a')}`;
    } else {
      return `${startDate.toFormat('ccc, LLL d')} - ${endDate.toFormat('ccc, LLL d')}`;
    }
  },
  
  getMonthDays(year, month) {
    const firstDay = DateTime.local(year, month, 1);
    const lastDay = firstDay.endOf('month');
    
    // Get days from previous month to fill first week
    const daysFromPrevMonth = firstDay.weekday === 7 ? 0 : firstDay.weekday;
    const prevMonth = firstDay.minus({ months: 1 });
    const prevMonthDays = [];
    
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      prevMonthDays.push({
        date: prevMonth.endOf('month').minus({ days: i }),
        isCurrentMonth: false
      });
    }
    
    // Get days from current month
    const currentMonthDays = [];
    for (let i = 0; i < lastDay.day; i++) {
      currentMonthDays.push({
        date: firstDay.plus({ days: i }),
        isCurrentMonth: true
      });
    }
    
    // Get days from next month to fill last week
    const combinedDays = [...prevMonthDays, ...currentMonthDays];
    const daysNeeded = 42 - combinedDays.length; // 6 rows of 7 days
    const nextMonth = firstDay.plus({ months: 1 });
    const nextMonthDays = [];
    
    for (let i = 0; i < daysNeeded; i++) {
      nextMonthDays.push({
        date: nextMonth.set({ day: i + 1 }),
        isCurrentMonth: false
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  },
  
  getWeekDays(date) {
    const startOfWeek = date.startOf('week');
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      weekDays.push(startOfWeek.plus({ days: i }));
    }
    
    return weekDays;
  },
  
  getHoursOfDay() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  },
  
  isToday(date) {
    const today = DateTime.now();
    return date.hasSame(today, 'day');
  },
  
  isPast(date) {
    const now = DateTime.now();
    return date < now;
  }
};