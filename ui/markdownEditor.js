(function() {
  const vscode = acquireVsCodeApi();

  vscode.postMessage({ type: 'ready' });

  let editor;
  let ignoreChange = false;

  window.addEventListener('message', e => {
    switch (e.data.type) {
      case 'init':
        ignoreChange = true;
        try {
          editor = buildEditor(e.data.payload);
        } finally {
          ignoreChange = false;
        }
        break;
      case 'updateContent':
        if (e.data.payload === editor.getValue()) {
          return; // ignore changes that are not a change actually
        }

        ignoreChange = true;
        try {
          editor.setValue(e.data.payload);
        } finally {
          ignoreChange = false;
        }
        break;
    }
  });

  function buildEditor(value) {
    const instance = new tui.Editor({
      el: document.querySelector('#editorSection'),
      initialEditType: 'markdown',
      previewStyle: 'vertical',
      height: 'auto',
      initialValue: value,
      exts: ['scrollSync', 'chart', 'uml'],
      usageStatistics: false,
      events: {
        change: () => {
          if (ignoreChange) {
            return;
          }

          vscode.postMessage({ type: 'changeContent', payload: instance.getValue() });
        },
      },
    });

    instance.getHtml();

    return instance;
  }
})();
