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

class TuiEditor extends Component {
  constructor(props) {
    super(props);
    this.el = React.createRef();
    this.onPreviewBeforeHook = this.onPreviewBeforeHook.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.contentSet = false;
    this.contentPath = null;
    this.wysiwygScroll = {};

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
      exts: ['scrollSync', 'chart', 'uml'],
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

    editor.on('previewBeforeHook', this.onPreviewBeforeHook);

    editor.addHook('scroll', this.onScroll.bind(this));

    window.addEventListener('message', this.handleMessage);

    this.setState({ editor });
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
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage.bind(this));
  }

  setContent(data) {
    this.state.editor.setMarkdown(data.content, false);
    this.contentSet = true;
    const isSamePath = this.contentPath === data.contentPath;
    this.contentPath = data.contentPath;
    if (!isSamePath) {
      const scrolls = this.state.editor.isWysiwygMode() ? this.wysiwygScroll : '';
      let sTop = scrolls[this.contentPath];
      if (!sTop) {
        sTop = 0;
      }
      this.state.editor.sc(sTop);
    }
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
      content: this.state.editor.getValue(),
    });
  };

  render() {
    return <div className={this.state.settings.display2X ? 'display2X' : 'display1X'} id="editor" ref={this.el} />;
  }
}

export default TuiEditor;
