/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for guided tour
 */

const translationTour = {
  // German
  de: {
    tour_start: "Rundgang beginnen",
    tour_continue: "Weiter >>>",
    tour_back: "<<< Zurück",
    tour_abort: "Tour beenden",
    tour_end: "Rundgang abschließen",
    tour_All:
      "Herzlich willkommen zu <b>%{programName}</b>!<br>Dieser Rundgang führt durch die wichtigsten Teile der Programmoberfläche und erläutert deren Funktion und Möglichkeiten.<br>Die Tour kann jederzeit durch die Escape-Taste beendet werden.",

    tour_SplitGutter1:
      "Die verschiedenen Bereiche der Programmoberfläche sind mittels verschiebbarer Leisten in ihrer Größe veränderbar. Die Oberfläche kann so auf die eigenen Bedürfnisse und den jeweiligen Bearbeitungsfokus angepasst werden.",
    tour_SplitGutter2:
      "Durch Doppelklick auf die Leiste kann der entsprechende Bereich vollständig ausgeblendet werden, um mehr Platz für die anderen Bereiche zu gewinnen. Ausgeblendete Bereiche können durch Doppelklick am jeweiligen Fensterrand wieder eingeblendet werden. Das Aus- und Einblenden von Bereichen ist auch über das Programmmenü möglich.",
    tour_SplitGutter3:
      "Farbe und Stärke der Leisten können in den Einstellungen angepasst werden, ebenso wie die Hintergrundfarben der verschiedenen Bereiche und eine Vielzahl anderer Parameter, die das Aussehen und das Verhalten des Programms verändern.",

    tour_TT1:
      "In diesem Bereich werden die <b>Texte</b> eines Projekts aufgelistet. Hierfür steht eine baumartige Struktur zur Verfügung, um Texte in übergeordnete (z.B. Überschriften, Kapitel) und untergeordnete Teile (z.B. Szenen, Unterkapitel) zu sortieren. Wenn sich ein Projekt weiterentwickelt, kann die Struktur jederzeit geeignet angepasst werden.<br>Soll die Position eines Texts im Gesamtgefüge des Projekts verändert werden, wird er einfach innerhalb der Baumstruktur verschoben. Dies funktioniert auch für ganze Zweige des Baums, wenn z.B. komplette Kapitel oder Bereiche verschoben werden müssen.",
    tour_TT2:
      "Das Aktivieren von Texten mittels einer Checkbox holt sie zur Bearbeitung in den Editor. Dies kann für mehrere Texte zugleich erfolgen, die dann gemeinsam im Editor angezeigt werden. Zum Schutz gegen unerwünschte Veränderung lassen sich Texte sperren. Sie werden dann im Editor zwar angezeigt, können aber nicht editiert werden. Weitere Funktionen für Texte sind über das Kontextmenü erreichbar.",

    tour_TCL1:
      "Hier werden <b>Textlisten</b> angezeigt. Textlisten fassen Mengen von Texten zusammen und ermöglichen dadurch eine flexiblere Organisation der vorhandenen Texte. Zum Beispiel könnten alle Kapitelüberschriften in einer Textliste versammelt werden, um einen schnellen Überblick über die Kapitel zu erhalten. Wenn eine Textliste aktiviert wird, werden ihre Texte gemeinsam im Editor angezeigt und alle anderen Texte im Textbaum ausgeblendet.",
    tour_TCL2:
      "Textlisten entstehen auch, wenn Texte gesucht und gefiltert werden. Sie enthalten dann all diejenigen Texte, die entsprechende Suchbegriffe enthalten oder bestimmte Kriterien erfüllen, z.B. in Bezug auf ihre Länge, wann sie angelegt oder zuletzt verändert worden sind.",

    tour_OT1:
      "Dieser Bereich zeigt die <b>Objekte</b>, die zu einem Projekt gehören. Objekte bündeln Informationen über all das, was von Bedeutung für ein Projekt ist - Personen, Gegenstände, Orte oder anderes mehr. Objekte können baumartig organsiert werden. Zum Beispiel könnten in einem Zweig des Baums alle Personen zusammengefasst werden, unterteilt in Hauptpersonen und Nebenpersonen. Die einzelnen konkreten Personen würden dann in eine dieser beiden Kategorien einsortiert.",
    tour_OT2:
      "Objekte können mit flexiblen Sets von Eigenschaften versehen werden, mit denen die jeweils relevanten Informationen festgehalten werden. Diese Eigenschaften werden entlang der Objekthierarchie vererbt. Hat z.B. das Objekt <i>Person</i> die Eigenschaft <i>Name</i>, dann hat auch die Unterkategorie <i>Hauptperson</i> dieses Merkmal und entsprechend auch eine konkrete Person in diesem Zweig.",
    tour_OT3:
      "Das Besondere an Objekten ist, dass sie sich mit Textpassagen verknüpfen lassen. Auf diese Weise entsteht eine semantische Kennzeichnung von Texten, und die Textstellen, die sich auf ein bestimmtes Objekt beziehen, können schnell aufgefunden und im Editor hervorgehoben werden. Einem Objekt wird dafür ein Darstellungsstil zugewiesen, mit dem die mit diesem Objekt verbundenen Textstellen im Editor formatiert werden, wenn das Objekt aktiviert ist. Durch Aktivierung bzw. Deaktivierung von Objekten kann die Aufmerksamkeit im Editor jederzeit auf die gewünschten Objekte gelenkt werden.",

    tour_TEE1:
      "In diesem zentralen Bereich befindet sich der <b>Editor</b>. Anders als gewöhnliche Texteditoren kann hier nicht nur ein einzelner Text, sondern mehrere Texte hintereinander angezeigt und auch bearbeitet werden. Dies wird durch Aktivierung der gewünschten Texte im Textbaum festgelegt.",
    tour_TEE2:
      "Texte können absatzweise mit Formatvorlagen verknüpft werden, die an zentraler Stelle für das gesamte Projekt festgelegt werden. Veränderungen an diesen Vorlagen wirken sich dadurch auf alle entsprechenden Absätze aus.<br>Auch Bilder lassen sich in Texte einbetten, und im Kontextmenü des Editors ist eine Vielzahl von Funktionen verfügbar, die das Schreiben und Editieren erleichtern.",
    tour_TEE3:
      "Der Editor lässt sich bei Bedarf auch bildschirmfüllend anzeigen. Dadurch lenkt nichts vom Schreiben ab. Das fokussierte Arbeiten wird durch zusätzliche Elemente wie Hintergrundbilder und einstellbare Soundeffekte unterstützt.",

    tour_MB:
      "Oberhalb des Editors sind Schaltflächen zu finden, um Text zu formatieren. Die direkte Formatierung ist auf wenige Standardmöglichkeiten (fett, kursiv usw.) begrenzt. Das Aussehen auf Absatzebene kann über projektweite Formatvorlagen festgelegt werden.<br>Zudem ist hier das Suchen und Ersetzen in den angezeigten Texten möglich. Für komplizierte Suchanfragen stehen reguläre Ausdrücke zur Verfügung.",

    tour_SB:
      "Unterhalb des Editors befindet sich die Statusleiste, in der aktuelle Informationen über den gerade bearbeiteten Text angezeigt werden. Dazu gehören z.B. die Anzahl der Zeichen und Wörter.<br>Hier lässt sich zudem der Zoomfaktor des Editors einstellen sowie die Art und Weise, wie Textstellen angezeigt werden, die mit Objekten im Editor verbunden sind. Dies kann mit dem vollen Objektstil erfolgen oder lediglich hervorgehoben, während der nicht mit den aktivierten Objekten verbundene Text blasser angezeigt wird.",

    tour_OR:
      "Dieser Bereich listet die <b>Objektreferenzen</b> auf. Dabei handelt es sich um alle Textstellen der aktuell aktivierten Texte, die mit den aktuell aktivierten Objekten verbunden sind. Diese Textpassagen sind dadurch leicht zu überblicken. Durch Klick auf eines der wiedergegebenene Textstücke wird die entsprechende Passage des Texts im Editor selektiert.",
  },
  // English
  en: {
    tour_start: "Start the tour",
    tour_continue: "Continue >>>",
    tour_back: "<<< Back",
    tour_abort: "End Tour",
    tour_end: "Finish the tour",
    tour_All:
      "Welcome to <b>%{programName}</b>!<br>This tour takes you through the most important parts of the program interface and explains their functions and options.<br>The tour can be ended at any time by pressing the Escape key.",

    tour_SplitGutter1:
      "The various areas of the program interface can be resized using sliding rulers. The interface can thus be adapted to your own needs and the respective editing focus.",
    tour_SplitGutter2:
      "By double-clicking on the ruler, the corresponding area can be completely collapsed to create more space for the other areas. Hidden areas will reappear when double-clicking on the respective window edge. It is also possible to hide and show areas via the program menu.",
    tour_SplitGutter3:
      "The color and thickness of the rulers can be adjusted in the settings, as can the background colors of the various areas and a variety of other parameters that change the appearance and behavior of the program.",

    tour_TT1:
      "The <b>texts</b> of a project are listed in this area. A tree-like structure is available for sorting texts into superordinate (e.g. headings, chapters) and subordinate parts (e.g. scenes, sub-chapters). When a project develops, the structure can be adapted at any time. If the position of a text in the overall structure of the project is to be changed, simply move it within the tree structure. This also works for entire branches of the tree, e.g. if complete chapters or sections need to be moved.",
    tour_TT2:
      "By checking a checkbox texts are activated which brings them into the editor. This can be done for several texts at a time, which are displayed together in the editor. Texts can be locked to prevent unwanted changes. They can be displayed in the editor but cannot be edited. Further functions for texts can be accessed via the context menu.",

    tour_TCL1:
      "<b>Text lists</b> are displayed here. Text lists combine sets of texts and thus enable a more flexible organization of the project's texts. For example, all chapter headings could be collected in a text list to provide a quick overview of the chapters. When a text list is activated, its texts are opened in the editor and all other texts in the text tree are hidden.",
    tour_TCL2:
      "Text lists are also created when texts are searched for and filtered. Such lists contain all those texts that match the corresponding search terms or fulfill certain criteria, e.g. regarding their length, when they were created or last changed.",

    tour_OT1:
      "This area shows the <b>objects</b> that belong to a project. Objects bundle information about everything that is important for a project - people, items, locations and more. Objects can be organized tree-like. For example, all characters could be grouped together in one branch of the tree, divided into main characters and secondary characters. The individual characters would then be sorted into one of these two categories.",
    tour_OT2:
      "Objects can be provided with flexible sets of properties to represent the relevant information. These properties are inherited along the object hierarchy. If, for example, the <i>Character</i> object has the <i>Name</i> property, then the <i>Main Character</i> subcategory also has this property and, accordingly, a specific character in this branch.",
    tour_OT3:
      "Importantly, objects can be linked to text passages, adding a semantic level to texts. The text passages that refer to a specific object can be found quickly and highlighted in the editor. For this purpose a visual style is assigned to an object, which is used to format the relevant text passages in the editor when the object is activated. By activating or deactivating objects, attention can be drawn to the desired objects in the editor at any time.",

    tour_TEE1:
      "The <b>editor</b> is located in this central area. Unlike regular editors, several texts can be displayed and edited in a row. This is acheived by activating the desired texts in the text tree.",
    tour_TEE2:
      "Project wide defined style sheets can be applied to texts on paragraph level. Changes to these styles apply to all corresponding paragraphs.<br>Also, images can be embedded in texts, and a variety of functions are available in the editor's context menu to facilitate writing and editing.",
    tour_TEE3:
      "The editor can also be displayed full screen so that nothing distracts you from writing. Focused editing is supported by additional elements such as background images and variable sound effects.",

    tour_MB:
      "Text formatting buttons can be found above the editor. Direct formatting is limited to a few basic options (bold, italics, etc.). The formatting at paragraph level is done using project-wide templates.<br>It is also possible to search and replace within the displayed texts. Regular expressions are available for complex search queries.",

    tour_SB:
      "Below the editor you find the status bar, which displays information about the text currently being edited. This includes, for example, the number of characters and words.<br>The zoom factor of the editor can also be set here, as well as the display mode of text passages that are linked to objects. They can be displayed using the full object style or just being highlighted, while the text not linked to objects is shown in a lighter color.",

    tour_OR:
      "This area lists the <b>object references</b>. These are all text passages of the currently activated texts that are linked to the currently activated objects. By this those text passages are easy to keep track of. Clicking on one of the displayed text passages selects the corresponding area in the editor.",
  },
};

if (typeof module != "undefined") {
  module.exports = { translationTour };
}
