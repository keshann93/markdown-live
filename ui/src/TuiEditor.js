import React, { Component } from 'react';
import Editor from 'tui-editor/dist/tui-editor-Editor-all';
import 'tui-editor/dist/tui-editor.css';
import 'tui-editor/dist/tui-editor-contents.css';
import 'codemirror/lib/codemirror.css';
import 'highlight.js/styles/github.css';
import './override-light.css';
import './override-contents-light.css';
import './override.css';
import './override-contents.css';
import './override-codemirror.css';
import './override-codemirror-light.css';
import './override-hljs.css';
import { debounce } from 'debounce';

// root for local images
var img_root = '';

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|[]\/\\])/g, '\\$1');
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

Editor.defineExtension('markdown', function() {
  const defaultRenderer = Editor.markdownit.renderer.rules.image;
  const httpRE = /^https?:\/\/|^data:/;
  const imgFunc = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');
    const altIndex = token.attrIndex('alt');
    const ttlIndex = token.attrIndex('title');
    if (srcIndex < 0 || httpRE.test(token.attrs[srcIndex][1])) {
      return defaultRenderer(tokens, idx, options, env, self);
    }
    const src = ' src="' + img_root + token.attrs[srcIndex][1] + '"';
    // check for empty alt but a content string
    let altstr = altIndex >= 0 ? token.attrs[altIndex][1] : '';
    if (!altstr && token.content) altstr = token.content; // replace with content
    const alt = ' alt="' + altstr + '"';
    const ttl = ' title="' + (ttlIndex >= 0 ? token.attrs[ttlIndex][1] : '') + '"';
    const img = `<img${src}${alt}${ttl} />`;
    return img;
  };

  Editor.markdownit.renderer.rules.image = imgFunc;
  Editor.markdownitHighlight.renderer.rules.image = imgFunc;
});

class TuiEditor extends Component {
  constructor(props) {
    super(props);
    this.el = React.createRef();
    this.previewElement = document.getElementById('root');
    this.handleResizeMessage = debounce(this.handleResizeMessage.bind(this), 1000);
    this.onHtmlBefore = this.onHtmlBefore.bind(this);
    this.onPreviewBeforeHook = this.onPreviewBeforeHook.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.contentSet = false;
    this.contentPath = null;
    this.wysiwygScroll = {};
    this.currentLine = -1;
    this.previewScrollDelay = 0;
    this.scrollMap = [];
    this.uri = null;
    this.visibleRange = {};

    this.state = {
      settings: {
        display2X: false,
      },
    };
  }

  componentDidMount() {
    let editor = new Editor({
      el: this.el.current,
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      previewStyle: 'vertical',
      height: window.innerHeight - 20,
      events: {
        change: debounce(this.onChange.bind(this), 400),
      },
      usageStatistics: false,
      useCommandShortcut: false,
      exts: ['scrollSync', 'chart', 'uml', 'markdown'],
      toolbarItems: [
        'heading',
        'bold',
        'italic',
        'strike',
        'divider',
        'hr',
        'quote',
        'divider',
        'ul',
        'ol',
        'task',
        'indent',
        'outdent',
        'divider',
        'table',
        'image',
        'link',
        'divider',
        'code',
        'codeblock',
      ],
    });

    editor.on('convertorBeforeHtmlToMarkdownConverted', this.onHtmlBefore);

    editor.on('previewBeforeHook', this.onPreviewBeforeHook);

    editor.on('addImageBlobHook', this.onPaste.bind(this));

    editor.addHook('scroll', this.onScroll.bind(this));

    window.addEventListener('message', this.handleMessage);

    window.addEventListener('resize', this.handleResizeMessage);

    this.setState({ editor });
  }

  onHtmlBefore(e) {
    return replaceAll(e, img_root, '');
  }

  onPreviewBeforeHook(e) {
    console.log(e);
    return e;
  }

  onScroll(e) {
    if (!this.contentPath) return;

    // save the scroll positions
    if (this.state.editor.isWysiwygMode() && e.data) {
      this.wysiwygScroll[this.contentPath] = this.state.editor.getCurrentModeEditor().scrollTop();
      this.visibleRange[this.contentPath] = this.state.editor.getCurrentModeEditor().getRange();
      window.vscode.postMessage({
        command: 'revealLine',
        data: { uri: this.uri, line: this.visibleRange[this.contentPath] },
      });
    }
  }

  onPaste(e) {
    const toBase64 = file =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

    if (!this.state.settings.convertPastedImages) {
      return;
    }

    return toBase64(e).then(result => {
      window.vscode.postMessage({
        command: 'convertImage',
        data: result,
      });
      return null;
    });
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage.bind(this));
    window.removeEventListener('resize', this.handleResizeMessage);
  }

  handleResizeMessage(e) {
    window.vscode.postMessage({
      command: 'resized',
      data: this.uri,
    });
  }

  setContent(data) {
    console.log('set content reached');
    img_root = data.folderPath + '/';
    this.state.editor.setMarkdown(data.content, false);
    this.contentSet = true;
    const isSamePath = this.contentPath === data.contentPath;
    this.contentPath = data.contentPath;
    this.uri = data.uri;
    if (!isSamePath) {
      const scrolls = this.state.editor.isWysiwygMode() ? this.wysiwygScroll : '';
      let sTop = scrolls[this.contentPath];
      if (!sTop) {
        sTop = 0;
      }
      this.state.editor.getCurrentModeEditor().scrollTop(sTop);
    }
  }

  changeTextEditorSelection(data) {
    if (this.state.settings.scrollSync) {
      const line = parseInt(data.line, 10);
      let topRatio = parseFloat(data.topRatio);
      if (isNaN(topRatio)) {
        topRatio = 0.372;
      }
      this.scrollToRevealSourceLine(line, topRatio);
    }
  }

  scrollToRevealSourceLine(line, topRatio = 0.372) {
    if (line === this.currentLine) {
      return;
    } else {
      this.currentLine = line;
    }

    // disable preview onscroll
    this.previewScrollDelay = Date.now() + 500;

    this.scrollSyncToLine(line, topRatio);
  }

  scrollSyncToLine(line, topRatio = 0.372) {
    if (line + 1 === this.totalLineCount) {
      // last line
      this.scrollToPos(this.previewElement.scrollHeight || 1);
    } else {
      this.scrollToPos(Math.max(this.previewElement.offsetHeight || 2 * topRatio, 0));
    }
  }

  scrollToPos(scrollTop) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    if (scrollTop < 0) {
      return;
    }

    const delay = 10;

    const helper = (duration = 0) => {
      this.scrollTimeout = setTimeout(() => {
        if (duration <= 0) {
          this.previewScrollDelay = Date.now() + 500;
          this.previewElement.scrollTop = scrollTop;
          this.wysiwygScroll[this.contentPath] = this.previewElement.scrollTop;
          this.state.editor.getCurrentModeEditor().scrollTop(this.previewElement.scrollTop);
          return;
        }

        const difference = scrollTop - this.previewElement.scrollTop;

        const perTick = (difference / duration) * delay;

        // disable preview onscroll
        this.previewScrollDelay = Date.now() + 500;

        this.previewElement.scrollTop += perTick;
        if (this.previewElement.scrollTop === scrollTop) {
          return;
        }

        helper(duration - delay);
      }, delay);
    };

    const scrollDuration = 120;
    helper(scrollDuration);
  }

  handleMessage(e) {
    switch (e.data.command) {
      case 'setContent':
        this.setContent(e.data);
        break;
      case 'exec':
        this.state.editor.exec(...e.data.args);
        break;
      case 'settings':
        this.setState({ settings: e.data.settings });
        break;
      case 'changeTextEditorSelection':
        this.changeTextEditorSelection(e.data);
        break;
      default:
    }
  }

  onChange = event => {
    if (this.contentSet) {
      // prevent saving empty file
      console.log('Prevented saving empty file.');
      this.contentSet = false;
      return;
    }
    window.vscode.postMessage({
      command: 'applyChanges',
      data: { content: this.state.editor.getValue(), uri: this.uri },
    });
  };

  render() {
    return <div className={this.state.settings.display2X ? 'display2X' : 'display1X'} id="editor" ref={this.el} />;
  }
}

export default TuiEditor;
