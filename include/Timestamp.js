/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file provide Timestamp Class
 */

/**
 * Creates a new Timestamp
 * @class
 */
class Timestamp {
  /**
   * epoch seconds of the Timestamp in milliseconds
   * @private
   */
  #now;

  /**
   * unabbreviated weekday constants for i18n
   * @static
   */
  static #weekdayLong = [
    "time_sundayLong",
    "time_mondayLong",
    "time_tuesdayLong",
    "time_wednesdayLong",
    "time_thursdayLong",
    "time_fridayLong",
    "time_saturdayLong",
  ];

  /**
   * abbreviated weekday constants for i18n
   * @static
   */
  static #weekdayShort = [
    "time_sundayShort",
    "time_mondayShort",
    "time_tuesdayShort",
    "time_wednesdayShort",
    "time_thursdayShort",
    "time_fridayShort",
    "time_saturdayShort",
  ];

  /**
   * unabbreviated month constants for i18n
   * @static
   */
  static #monthLong = [
    "time_januaryLong",
    "time_februaryLong",
    "time_marchLong",
    "time_aprilLong",
    "time_mayLong",
    "time_juneLong",
    "time_julyLong",
    "time_augustLong",
    "time_septemberLong",
    "time_octoberLong",
    "time_novemberLong",
    "time_decemberLong",
  ];

  /**
   * abbreviated weekday constants for i18n
   * @static
   */
  static #monthShort = [
    "time_januaryShort",
    "time_februaryShort",
    "time_marchShort",
    "time_aprilShort",
    "time_mayShort",
    "time_juneShort",
    "time_julyShort",
    "time_augustShort",
    "time_septemberShort",
    "time_octoberShort",
    "time_novemberShort",
    "time_decemberShort",
  ];

  /**
   * @constructs Timestamp
   * @param {Number} epochSeconds Unix time value in millisconds
   */
  constructor(epochSeconds = new Date().getTime()) {
    this.#now = epochSeconds;
  }

  /**
   * getter for epoch second value
   * @returns Unix time value in milliseconds
   */
  get epochSeconds() {
    return this.#now;
  }

  /**
   * Provide a i18n human readable value of a Timestamp taking account of the Timezone
   * @param {String} format
   * @returns {String} formatted Timestamp
   */
  toLocalString(format = "[YYYY]-[MM]-[DD], [hh]:[mm]:[ss]") {
    let localDate = new Date(
      this.#now - 60000 * new Date().getTimezoneOffset(),
    );
    let result = "";
    format.split(/(\[.*?\])/).forEach((item) => {
      let m = item.match(/\[\s*(.*?)\s*\]/);
      if (m) {
        switch (m[1]) {
          case "YY":
            result += localDate.getUTCFullYear().toString().slice(-2);
            break;
          case "YYYY":
            result += localDate.getUTCFullYear();
            break;
          case "M":
            result += localDate.getUTCMonth() + 1;
            break;
          case "MM":
            result += `0${localDate.getUTCMonth() + 1}`.slice(-2);
            break;
          case "MMM":
            result += _(Timestamp.#monthShort[localDate.getUTCMonth()]);
            break;
          case "MMMM":
            result += _(Timestamp.#monthLong[localDate.getUTCMonth()]);
            break;
          case "D":
            result += localDate.getUTCDate();
            break;
          case "DD":
            result += `0${localDate.getUTCDate()}`.slice(-2);
            break;
          case "DDD":
            result += _(Timestamp.#weekdayShort[localDate.getUTCDay()]);
            break;
          case "DDDD":
            result += _(Timestamp.#weekdayLong[localDate.getUTCDay()]);
            break;
          case "h":
            result += localDate.getUTCHours();
            break;
          case "hh":
            result += `0${localDate.getUTCHours()}`.slice(-2);
            break;
          case "h12":
            result += localDate.getUTCHours() % 12 || 12;
            break;
          case "mm":
            result += `0${localDate.getUTCMinutes()}`.slice(-2);
            break;
          case "ss":
            result += `0${localDate.getUTCSeconds()}`.slice(-2);
            break;
          case "ap":
            result += localDate.getUTCHours() >= 12 ? "pm" : "am";
            break;
          case "AP":
            result += localDate.getUTCHours() >= 12 ? "PM" : "AM";
            break;
        }
      } else {
        result += item;
      }
    });

    return result;
  }

  /**
   * calculate time difference to right now in i18n human readable form
   * @returns {String}
   */
  timeToNow() {
    let secondsPassed = Math.floor((new Date().getTime() - this.#now) / 1000);
    if (secondsPassed < 60) {
      return _("time_timeToNowSeconds", secondsPassed, {
        seconds: secondsPassed,
      });
    }
    let minutesPassed = Math.floor(secondsPassed / 60);
    secondsPassed -= minutesPassed * 60;
    if (minutesPassed < 60) {
      return _("time_timeToNowMinutes", minutesPassed, {
        minutes: minutesPassed,
      });
    }
    let hoursPassed = Math.floor(minutesPassed / 60);
    minutesPassed -= hoursPassed * 60;
    if (hoursPassed < 24) {
      return (
        _("time_timeToNowHours", hoursPassed, {
          hours: hoursPassed,
        }) +
        _("time_timeToNowJoin") +
        _("time_timeToNowMinutes", minutesPassed, { minutes: minutesPassed })
      );
    }
    let daysPassed = Math.floor(hoursPassed / 24);
    hoursPassed -= daysPassed * 24;
    return (
      _("time_timeToNowDays", daysPassed, { days: daysPassed }) +
      (daysPassed >= 3
        ? ""
        : _("time_timeToNowJoin") +
          _("time_timeToNowHours", hoursPassed, {
            hours: hoursPassed,
          }))
    );
  }
}

module.exports = { Timestamp };
