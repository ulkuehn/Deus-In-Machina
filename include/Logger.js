/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Logger class
 */

/**
 * @classdesc Loggers do logging, console based and/or file based
 */
class Logger {
  static #formatFile = `[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}`;
  static #formatConsole = `[{level}] {text}`;

  #electronLog;
  #level;
  #file;

  /**
   * class constructor
   *
   * @param {electron-log} eLog
   * @param {String} level
   * @param {Boolean} doConsole
   * @param {String} logFile
   */
  constructor(eLog, level, doConsole, logDir, logFile) {
    this.#electronLog = eLog;
    this.#level = level;
    this.#file = logFile;

    if (doConsole) {
      eLog.transports.console.level = level;
      eLog.transports.console.format = Logger.#formatConsole;
    } else {
      eLog.transports.console.level = false;
    }

    if (logFile) {
      eLog.transports.file.fileName = logFile;
      eLog.transports.file.level = level;
      eLog.transports.file.format = Logger.#formatFile;
      eLog.transports.file.maxSize = 0;
    } else {
      eLog.transports.file.level = false;
    }

    eLog.initialize();
    eLog.errorHandler.startCatching();
  }

  get file() {
    return this.#file;
  }

  get level() {
    return this.#level;
  }

  set level(v) {
    this.#level = v;
    this.#electronLog.transports.console.level &&
      (this.#electronLog.transports.console.level = v);
    this.#electronLog.transports.file.level &&
      (this.#electronLog.transports.file.level = v);
  }

  error(...x) {
    this.#electronLog.error(...x);
  }
  warn(...x) {
    this.#electronLog.warn(...x);
  }
  info(...x) {
    this.#electronLog.info(...x);
  }
  verbose(...x) {
    this.#electronLog.verbose(...x);
  }
  debug(...x) {
    this.#electronLog.debug(...x);
  }
  silly(...x) {
    this.#electronLog.silly(...x);
  }
}

module.exports = { Logger };
