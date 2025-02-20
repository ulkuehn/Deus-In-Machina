# Deus In Machina - DIM

DIM is a writing tool intended for small, medium and large projects such as novels, short stories, and non-fiction. 

While offering editing and formatting tools well known from other text editors DIM features powerful methods to add a semantic level to your project. It is as much a world building and research tool as it is a writing tool. 

The real magic happens when you connect both levels, syntactic (text) and semantic (world). You can tag any text passage with any world item (called object), resulting in a list of quotes that are connected to that item. When you edit one of these text passages the respective quote is updated automatically.

In the text editor you can easily inspect what objects are connected to a text. Just activate the objects you are interested in and they get highlighted by their fully customizable individual style.

## Features

- Organize your writing project in as many small and large text chunks you want
- Reorder texts, scenes, and chapters at any time as needed
- Format paragraphs using project wide templates
- Lock texts to protect them against accidential changes
- Organize your world and research items in any appropriate structure
- Assign properties to items such as checkboxes or colors or more complex fields like editors, files of any kind or geographical maps
- Distraction free writing mode
- Language support for English and German
- Optionally protect your projects with a password and state of the art encryption
- Import from various file formats, from web pages or selectively from other DIM projects
- Export a project as a whole or in parts to various file formats
- 100% AI free ;-)

## FAQ

- [General](./faq/general.md)
- [Texts](./faq/texts.md)
- [Editing and Formatting Texts](./faq/editing.md)
- [Paragraph formats](./faq/formats.md)
- [Spellchecking](./faq/spellcheck.md)
- [Images](./faq/Images.md)
- [Editing in Focus Mode](./faq/focus.md)
- [Text Collections](./faq/collections.md)
- [Objects](./faq/objects.md)
- [Object Schemes and Properties](./faq/scheme.md)
- [Object References](./faq/references.md)
- [Projects](./faq/project.md)
- [Imports](./faq/import.md)
- [Export](./faq/export.md)
- [Program settings](./faq/settings.md)

## Building

### Windows

Make sure you have git (install from github.com), node (install from node.js) and python 3.10 (from python.org - do not use a higher version than 3.10). You also need Visual Studio (from visualstudio.microsoft.com,  Community edition will do fine), having the "Desktop development with C++" workload (include Windows 10 or 11 SDK, MSVC, and C++ CMake Tools). Next, clone the repo, install the dependencies and run:
```
git clone https://github.com/ulkuehn/DeusInMachina.git
npm install
npm run dim       <-- run directly from repo 
npm run windows   <-- create an installable exe file in dist folder
```

### Linux

Make sure you have git and node. You also need node-gyp and a supported python version. For details see https://www.npmjs.com/package/node-gyp.

Clone the repo, install the dependencies and run:
```
git clone https://github.com/ulkuehn/DeusInMachina.git
npm install
npm run dim     <-- run directly from repo
npm run linux   <-- create AppImage and deb packages in dist folder  
```

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See the [LICENSE](./LICENSE.md) file for license rights and limitations.