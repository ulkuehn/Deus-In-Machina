/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for about window
 */

const { translationTime } = require("./include/time.js");

const translationAboutWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationTime.de,
      aboutWindow_infoTab: "Allgemein",
      aboutWindow_version: "Version %{version}",
      aboutWindow_copyright: "Copyright &copy; Ulrich Kühn 2024, 2025",
      aboutWindow_licenseTab: "Lizenz",
      aboutWindow_license:
        `<p>%{name} Copyright &copy; Ulrich Kühn 2024, 2025</p>` +
        `<p>Dieses Programm ist freie Software. Du kannst es unter den Bedingungen der <span style='cursor:pointer;text-decoration:underline' onclick="ipcRenderer.invoke('mainProcess_openURL','https://www.gnu.org/licenses/gpl-3.0.html#license-text');">GNU General Public License</span>, wie von der Free Software Foundation veröffentlicht, weitergeben und/oder modifizieren, entweder gemäß Version 3 der Lizenz oder (nach deiner Option) jeder späteren Version.</p>` +
        `<p>Wenn dir %{name} gefällt, freue ich mich über ein Dankeschön auf <span style='cursor:pointer;text-decoration:underline' onclick="ipcRenderer.invoke('mainProcess_openURL','https://buymeacoffee.com/deusinmachina');">Buy me a coffee</span></p>`,
      aboutWindow_softwareTab: "Inhalte Dritter",
      aboutWindow_software:
        "%{name} wäre nicht möglich ohne folgende Software Dritter:",
      aboutWindow_media: "%{name} verwendet folgende Multimediainhalte:",
      aboutWindow_fonts: "%{name} nutzt diese Schriftarten:",
      aboutWindow_credits: "Vielen Dank an %{credits}",
      aboutWindow_thanks: "Zusätzlicher Dank an",
      aboutWindow_runtimeTab: "Laufzeitinfos",
      aboutWindow_softwareVersion: "Software-Version",
      aboutWindow_schemeVersion: "Datenbankschema",
      aboutWindow_chromeVersion: "Chrome-Version",
      aboutWindow_electronVersion: "Electron-Version",
      aboutWindow_startTime: "Programmstart",
      aboutWindow_runTime: "läuft seit",
      aboutWindow_operatingSystem: "Betriebssystem",
      aboutWindow_logFile: "Protokolldatei",
      aboutWindow_userPath: "Konfigurationsverzeichnis",
      aboutWindow_tmpDir: "Temporäres Verzeichnis",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationTime.en,
      aboutWindow_infoTab: "General",
      aboutWindow_version: "Version %{version}",
      aboutWindow_copyright: "Copyright &copy; Ulrich Kühn 2024, 2025",
      aboutWindow_licenseTab: "License",
      aboutWindow_license:
        `<p>%{name} Copyright &copy; Ulrich Kühn 2024, 2025</p>` +
        `<p>This program is free software: you can redistribute it and/or modify it under the terms of the <span style='cursor:pointer;text-decoration:underline' onclick="ipcRenderer.invoke('mainProcess_openURL','https://www.gnu.org/licenses/gpl-3.0.html#license-text');">GNU General Public License</span> as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>` +
        `<p>If you like %{name} I would appreciate a thank you on <span style='cursor:pointer;text-decoration:underline' onclick="ipcRenderer.invoke('mainProcess_openURL','https://buymeacoffee.com/deusinmachina');">Buy me a coffee</span></p>`,
      aboutWindow_softwareTab: "Third party content",
      aboutWindow_software: "%{name} depends on this software:",
      aboutWindow_media: "%{name} includes this Multi Media Content:",
      aboutWindow_fonts: "%{name} relies on these fonts:",
      aboutWindow_credits: "Many Thanks to %{credits}",
      aboutWindow_thanks: "Additional Thanks to",
      aboutWindow_runtimeTab: "Runtime info",
      aboutWindow_softwareVersion: "Software version",
      aboutWindow_schemeVersion: "Database scheme",
      aboutWindow_chromeVersion: "Chrome version",
      aboutWindow_electronVersion: "Electron version",
      aboutWindow_startTime: "Started on",
      aboutWindow_runTime: "Running for",
      aboutWindow_operatingSystem: "Operating system",
      aboutWindow_logFile: "Log file",
      aboutWindow_userPath: "Configuration files",
      aboutWindow_tmpDir: "Temporary files",
    },
  }),
};

function __(lang, ...x) {
  return translationAboutWindow[lang](...x);
}

module.exports = { __ };
