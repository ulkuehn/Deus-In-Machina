/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for time strings
 */

const translationTime = {
  // German
  de: {
    // months long
    time_januaryLong: "Januar",
    time_februaryLong: "Februar",
    time_marchLong: "März",
    time_aprilLong: "April",
    time_mayLong: "Mai",
    time_juneLong: "Juni",
    time_julyLong: "Juli",
    time_augustLong: "August",
    time_septemberLong: "September",
    time_octoberLong: "Oktober",
    time_novemberLong: "November",
    time_decemberLong: "Dezember",
    // months short
    time_januaryShort: "Jan",
    time_februaryShort: "Feb",
    time_marchShort: "Mrz",
    time_aprilShort: "Apr",
    time_mayShort: "Mai",
    time_juneShort: "Jun",
    time_julyShort: "Jul",
    time_augustShort: "Aug",
    time_septemberShort: "Sep",
    time_octoberShort: "Okt",
    time_novemberShort: "Nov",
    time_decemberShort: "Dez",
    // weekdays long
    time_sundayLong: "Sonntag",
    time_mondayLong: "Montag",
    time_tuesdayLong: "Dienstag",
    time_wednesdayLong: "Mittwoch",
    time_thursdayLong: "Donnerstag",
    time_fridayLong: "Freitag",
    time_saturdayLong: "Samstag",
    // weekdays short
    time_sundayShort: "So",
    time_mondayShort: "Mo",
    time_tuesdayShort: "Di",
    time_wednesdayShort: "Mi",
    time_thursdayShort: "Do",
    time_fridayShort: "Fr",
    time_saturdayShort: "Sa",
    // time since (seconds up to days)
    time_timePassed: "vor %{time}",
    time_timeToNowJoin: ", ", // Text between e.g. hours and minutes
    time_timeToNowSeconds: [
      [0, 0, "0 Sekunden"],
      [1, 1, "1 Sekunde"],
      [2, null, "%{seconds} Sekunden"],
    ],
    time_timeToNowMinutes: [
      [0, 0, "0 Minuten"],
      [1, 1, "1 Minute"],
      [2, null, "%{minutes} Minuten"],
    ],
    time_timeToNowHours: [
      [0, 0, "0 Stunden"],
      [1, 1, "1 Stunde"],
      [2, null, "%{hours} Stunden"],
    ],
    time_timeToNowDays: [
      [0, 0, "0 Tagen"],
      [1, 1, "1 Tag"],
      [2, null, "%{days} Tagen"],
    ],
    // time since (days, weeks, years)
    time_ywdHuman: "Zeitspanne: ",
    time_yearsHuman: [
      [1, 1, "1 Jahr, "],
      [2, null, "%{years} Jahre, "],
    ],
    time_weeksHuman: [
      [0, 0, "0 Wochen, "],
      [1, 1, "1 Woche, "],
      [2, null, "%{weeks} Wochen, "],
    ],
    time_daysHuman: [
      [0, 0, "0 Tage"],
      [1, 1, "1 Tag"],
      [2, null, "%{days} Tage"],
    ],
  },
  // English
  en: {
    // months long
    time_januaryLong: "January",
    time_februaryLong: "February",
    time_marchLong: "March",
    time_aprilLong: "April",
    time_mayLong: "May",
    time_juneLong: "June",
    time_julyLong: "July",
    time_augustLong: "August",
    time_septemberLong: "September",
    time_octoberLong: "October",
    time_novemberLong: "November",
    time_decemberLong: "December",
    // months short
    time_januaryShort: "Jan",
    time_februaryShort: "Feb",
    time_marchShort: "Mar",
    time_aprilShort: "Apr",
    time_mayShort: "May",
    time_juneShort: "Jun",
    time_julyShort: "Jul",
    time_augustShort: "Aug",
    time_septemberShort: "Sep",
    time_octoberShort: "Oct",
    time_novemberShort: "Nov",
    time_decemberShort: "Dec",
    // weekdays long
    time_sundayLong: "Sunday",
    time_mondayLong: "Monday",
    time_tuesdayLong: "Tueday",
    time_wednesdayLong: "Wednesday",
    time_thursdayLong: "Thursday",
    time_fridayLong: "Friday",
    time_saturdayLong: "Saturday",
    // weekdays short
    time_sundayShort: "Sun",
    time_mondayShort: "Mon",
    time_tuesdayShort: "Tue",
    time_wednesdayShort: "Wed",
    time_thursdayShort: "Thu",
    time_fridayShort: "Fri",
    time_saturdayShort: "Sat",
    // time since
    time_timePassed: "%{time} ago",
    time_timeToNowJoin: " ", // Text between e.g. hours and minutes
    time_timeToNowSeconds: [
      [0, 0, "0 seconds"],
      [1, 1, "1 second"],
      [2, null, "%{seconds} seconds"],
    ],
    time_timeToNowMinutes: [
      [0, 0, "0 minutes"],
      [1, 1, "1 minute"],
      [2, null, "%{minutes} minutes"],
    ],
    time_timeToNowHours: [
      [0, 0, "0 hours"],
      [1, 1, "1 hour"],
      [2, null, "%{hours} hours"],
    ],
    time_timeToNowDays: [
      [0, 0, "0 days"],
      [1, 1, "1 day"],
      [2, null, "%{days} days"],
    ],
    // time since (days, weeks, years)
    time_ywdHuman: "Duration: ",
    time_yearsHuman: [
      [1, 1, "1 year, "],
      [2, null, "%{years} years, "],
    ],
    time_weeksHuman: [
      [0, 0, "0 weeks, "],
      [1, 1, "1 week, "],
      [2, null, "%{weeks} weeks, "],
    ],
    time_daysHuman: [
      [0, 0, "0 days"],
      [1, 1, "1 day"],
      [2, null, "%{days} days"],
    ],
  },
};

module.exports = { translationTime };
