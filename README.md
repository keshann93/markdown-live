<h1 align="center">📝 Markdown Editor &amp; Previewer
</h1>

##### Markdown-live introduces a Markdown editor & previewer into Visual Studio Code.

![intro](https://raw.githubusercontent.com/keshann93/markdown-live/master/banner.png)

![Visual Studio Marketplace Version](https://vsmarketplacebadge.apphb.com/version/keshan.markdown-live.svg)
![Visual Studio Marketplace Installs](https://vsmarketplacebadge.apphb.com/installs/keshan.markdown-live.svg)
![Visual Studio Marketplace Downloads](https://vsmarketplacebadge.apphb.com/downloads/keshan.markdown-live.svg)

## Introduction

- Markdown Live is an extension that provides you with many useful functionalities including a live editor with useful options
- A lot of its ideas are inspired by [Markdown Preview Style](https://github.com/mjbvz/vscode-github-markdown-preview-style) and [Unotes](https://github.com/ryanmcalister/unotes).
- Feel free to ask questions, [post issues](https://github.com/keshann93/issues), submit pull request, and request new features.
- For more information about this project and how to use this extension, please check out our Functionalities section⬇︎

## Features

Markdown-live supports the followings

- 💅 Renders instantly any `markdown/.md` document with its content.
- 🎨 markdown-live editor comes with supportive tools/extension accompanied to edit markdown content in an efficient manner
- 🌈 Supports rendering of multiple `.md` files
- 🌏 Instantly syncs the changes made in either of two panels (markdown editor and text-document) across seamlessly
- 🌟 Editor supports shortcut keys for the toolbar, please check the Keybindgs section for more information
- 🌟 Editor supports set a configurations defined, please check the Workspace configuration section for more information
- 🌟 auto scroll syn support is been added
- 🌟 copy & paste of image support is been additionally added along with other functionalities that comes with tui-editor
- 💥 lightweight custom editor extension for markdown: [![Only 883 Kb](https://badge-size.herokuapp.com/keshann93/markdown-live/master/markdown-live-1.2.1.vsix)](https://github.com/keshann93/markdown-live/blob/master/markdown-live-1.2.1.vsix)
- ⚡️ Check [tui.editor](https://github.com/nhn/tui.editor) for more information and config changes.

## Getting started

- Install the [Markdown-live](https://marketplace.visualstudio.com/items?itemName=keshan.markdown-live) extension in VS Code
- After opening a `markdown/.md` file, click on the <img src="https://raw.githubusercontent.com/keshann93/markdown-live/master/icons/tiny-icon.png" width="20px"> icon to toggle the side-bar
- Place your cursor in the markdown content
- You should see the sidebar tries to render the markdown content

###### Functionality Demo

<img src="https://raw.githubusercontent.com/keshann93/markdown-live/master/assets/markdown-live-demo.gif">

###### Themes Demo

<img src="https://raw.githubusercontent.com/keshann93/markdown-live/master/assets/markdown-live-demo1.gif">

###### Multi Document Render Demo

<img src="https://raw.githubusercontent.com/keshann93/markdown-live/master/assets/markdown-live-demo2.gif">

## Command Configurations

| Command            | Description             |
| ------------------ | ----------------------- |
| `showMarkdown`     | Toggle Markdown panel   |
| `toggleScrollSync` | Toggle Scroll Sync Mode |

- can be executed by opening the command pallete (ctr+shift+p) and type the command to select it and execute

## Workspace Configurations

| Name                                 | Description                                                                    | Default value  |
| ------------------------------------ | ------------------------------------------------------------------------------ | -------------- |
| `automaticallyShowPreviewOfMarkdown` | Automatically shows preview once the markdown/.md file gets opened up          | true(boolean)  |
| `syncScroll`                         | Automatically sync the scroll of both editor and doc                           | true(booelan)  |
| `display2X`                          | Display toolbar buttons of the editor at 2X size                               | false(boolean) |
| `convertPastedImages`                | Convert pasted images to local files, if not it will show in base64 format     | true(boolean)  |
| `mediaFolder`                        | The folder where images are saved relative to the markdown file project folder | .media(string) |

- above values are easily configurable through `File -> Preferrences -> settings`

## Keybindings

| Shortcuts                                              | Functionality           |
| ------------------------------------------------------ | ----------------------- |
| <kbd>ctrl + alt + 1</kbd>/<br><kbd>cmd + alt + 1</kbd> | Heading 1               |
| <kbd>ctrl + alt + 2</kbd>/<br><kbd>cmd + alt + 2</kbd> | Heading 2               |
| <kbd>ctrl + alt + 3</kbd>/<br><kbd>cmd + alt + 3</kbd> | Heading 3               |
| <kbd>ctrl + alt + 4</kbd>/<br><kbd>cmd + alt + 4</kbd> | Heading 4               |
| <kbd>ctrl + alt + 5</kbd>/<br><kbd>cmd + alt + 5</kbd> | Heading 5               |
| <kbd>ctrl + alt + 6</kbd>/<br><kbd>cmd + alt + 6</kbd> | Heading 6               |
| <kbd>ctrl + alt + 0</kbd>/<br><kbd>cmd + alt + 0</kbd> | Normal                  |
| <kbd>ctrl + alt + b</kbd>/<br><kbd>cmd + alt + b</kbd> | Bold                    |
| <kbd>ctrl + alt + i</kbd>/<br><kbd>cmd + alt + i</kbd> | Italic                  |
| <kbd>ctrl + alt + r</kbd>/<br><kbd>cmd + alt + r</kbd> | Strike                  |
| <kbd>ctrl + alt + t</kbd>/<br><kbd>cmd + alt + r</kbd> | Task                    |
| <kbd>ctrl + alt + u</kbd>/<br><kbd>cmd + alt + u</kbd> | Unordered List          |
| <kbd>ctrl + alt + o</kbd>/<br><kbd>cmd + alt + o</kbd> | Ordered List            |
| <kbd>ctrl + alt + q</kbd>/<br><kbd>cmd + alt + q</kbd> | BlockQuote              |
| <kbd>ctrl + alt + h</kbd>/<br><kbd>cmd + alt + h</kbd> | Inline Code (highlight) |
| <kbd>ctrl + alt + c</kbd>/<br><kbd>cmd + alt + c</kbd> | Code Block              |
| <kbd>ctrl + alt + l</kbd>/<br><kbd>cmd + alt + l</kbd> | Horizontal Line         |
| <kbd>ctrl + alt + n</kbd>/<br><kbd>cmd + alt + n</kbd> | Indent                  |
| <kbd>ctrl + alt + m</kbd>/<br><kbd>cmd + alt + m</kbd> | Outdent                 |

## Acknowledgment

[tui.editor](https://github.com/nhn/tui.editor) is integrated as the markdown editor

## Changelog

Please check the [Releases](./CHANGELOG.md) \| [Github](https://github.com/keshann93/releases) page of this project.

## Contributing

Have a look at our [contribution guide](./contributing.md).

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<table>
<tbody><tr><td align="center"><a href="http://keshann93.github.io"><img src="https://avatars3.githubusercontent.com/u/12506034?v=4" width="100px;" alt=""><br>
<sub><b>Keshan Nageswaran</b></sub></a><a href="https://github.com/keshann93/semantic-live/commits?author=keshann93" title="Code">💻</a> <a href="#design-keshann93" title="Design">🎨</a></td></tr></tbody></table>

## License

[MIT License](./LICENSE)
