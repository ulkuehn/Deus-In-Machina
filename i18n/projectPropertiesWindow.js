/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for project properties window
 */

const { translationGeneral } = require("./include/general.js");
const { translationTime } = require("./include/time.js");
const { translationStatistics } = require("./include/statistics.js");
const { translationDataTables } = require("./include/dataTables.js");
const { translationCategories } = require("./include/categories.js");
const { translationColorPicker } = require("./include/colorpicker.js");
const { translationUnits } = require("./include/units.js");
const { translationWordcloud } = require("./include/wordcloud.js");

const translationProjectPropertiesWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationTime.de,
      ...translationStatistics.de,
      ...translationDataTables.de,
      ...translationCategories.de,
      ...translationColorPicker.de,
      ...translationUnits.de,
      ...translationWordcloud.de,

      projectPropertiesWindow_titleTab: "Titeldaten",
      projectPropertiesWindow_categoriesTab: "Textkategorien",
      projectPropertiesWindow_projectTab: "Projektinformationen",

      projectPropertiesWindow_title: "Titel",
      projectPropertiesWindow_subtitle: "Untertitel",
      projectPropertiesWindow_author: "Autor:in",
      projectPropertiesWindow_info: "Anmerkungen und Hinweise",

      projectPropertiesWindow_created: "Projektbeginn",
      projectPropertiesWindow_changed: "zuletzt geändert",
      projectPropertiesWindow_projectVersion: "Speicherversion",
      projectPropertiesWindow_location: "Dateipfad",
      projectPropertiesWindow_exploreFileTitle: "Dateiordner anzeigen",
      projectPropertiesWindow_size: "Dateigröße",
      projectPropertiesWindow_programVersion: "Software-Version",
      projectPropertiesWindow_timeSince: "vor %{time}",
      projectPropertiesWindow_password: "Passwort",
      projectPropertiesWindow_confirmPassword: "Passwortbestätigung",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationTime.en,
      ...translationStatistics.en,
      ...translationDataTables.en,
      ...translationCategories.en,
      ...translationColorPicker.en,
      ...translationUnits.en,
      ...translationWordcloud.en,

      projectPropertiesWindow_titleTab: "Cover data",
      projectPropertiesWindow_categoriesTab: "Text Categories",
      projectPropertiesWindow_projectTab: "Project Information",

      projectPropertiesWindow_title: "Title",
      projectPropertiesWindow_subtitle: "Subtitle",
      projectPropertiesWindow_author: "Author",
      projectPropertiesWindow_info: "Comments",

      projectPropertiesWindow_created: "Created",
      projectPropertiesWindow_changed: "Last changed",
      projectPropertiesWindow_projectVersion: "Current Version",
      projectPropertiesWindow_location: "Project path",
      projectPropertiesWindow_exploreFileTitle: "Open folder",
      projectPropertiesWindow_size: "File size",
      projectPropertiesWindow_programVersion: "Software Version",
      projectPropertiesWindow_timeSince: "%{time} ago",
      projectPropertiesWindow_password: "Password",
      projectPropertiesWindow_confirmPassword: "Comfirm Password",
    },
  }),
};

function __(lang, ...x) {
  return translationProjectPropertiesWindow[lang](...x);
}

module.exports = { __ };
