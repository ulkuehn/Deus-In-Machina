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

See DIM's webpage linked above.


## Building

### Windows

Make sure you have git (install from github.com), node (install from node.js) and python 3.10 (from python.org - do not use a higher version than 3.10). You also need Visual Studio (from visualstudio.microsoft.com, Community edition will do fine), having the "Desktop development with C++" workload (include Windows 10 or 11 SDK, MSVC, and C++ CMake Tools). Next, clone the repo, install the dependencies and run:

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

#### Python 3.12

When running or building the application with Python 3.12, you may encounter the
following error:

> ...  
> npm ERR! ModuleNotFoundError: No module named 'distutils'  
> npm ERR! gyp ERR! configure error  
> npm ERR! gyp ERR! stack Error: `gyp` failed with exit code: 1  
> ...

This is due to `distutils` being removed in Python v3.12. To fix this, simply
install setuptools: `pip install setuptools`

#### chrome-sandbox configuration

You may encounter the following error while running the app:

> The SUID sandbox helper binary was found, but is not configured correctly. Rather than run without sandboxing I'm aborting now. You need to make sure that /path/to/node_modules/electron/dist/chrome-sandbox is owned by root and has mode 4755.

This can be fixed by changing ownership for `chrome-sandbox` to root:

```
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

#### AppImage

Note that trying to launch the AppImage in Ubuntu 24.04 (or later) will fail
with the following error:

> The SUID sandbox helper binary was found, but is not configured correctly.
> Rather than run without sandboxing I'm aborting now.

This is a known issue with AppImages compiled from Electron: https://github.com/electron/electron/issues/42510

We recommend installing the `.deb` package instead, which does not face this
issue and works properly.


## Future Enhancements

There is a lot on my to-do and wish list, including:
- Support for tables in text processor
- Support for notes/comments in text processor
- Writing goals and statistics
- Project or single text snapshots/history
- Mirror a webpage as object property (for research)
- Links between texts
- Text bookmarks
- Syntactical objects (connected text passages not manually set but determined by regexp)
- Custom sounds in focus mode
- Whiteboard/outline mode for rearranging texts
- Storyline

There is no specific ordering intended in this list. Also, it's just ideas, and whether the project will develop in any of these directions or some other (or maybe not at all) is totally open.


## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See the [LICENSE](./LICENSE.md) file for license rights and limitations.
