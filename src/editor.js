import { EventDispatcher } from './events';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { EditorState, Selection } from 'prosemirror-state';
import { getSchema } from './schema';
import { plugins } from './plugins/index';
const styles = require('!css-loader!./editor.css').toString();


export class Editor extends EventDispatcher {

  constructor(options = {}) {
    super();
    this.options = options;
    this.view = null;
    this.titleTagName = undefined;
    this.state = getEditorState(this.options);
    this._lastSelection = this.state.selection;
    this.apply = this.apply.bind(this);
  }

  mount(element) {
    if (this.view) this.unmount();
    addStylesIfNeeded(element.ownerDocument);

    this.view = new EditorView(element, {
      state: this.state,
      dispatchTransaction: this.apply,
      onFocus: (view, event) => {
        Editor.active = this;
      },
      onBlur: (view, event) => {
        if (Editor.active === this) {
          if (!this.view || this.view.dom.ownerDocument.activeElement !== this.view.dom) {
            Editor.active = null;
          }
        }
      }
    });

    this.view.dom.pmView = this.view;

    let update = this.view.updateState;
    this.view.updateState = state => {
      this.state = state;
      return update.call(this.view, state);
    };
  }

  unmount() {
    if (!this.view) return;
    this.view.destroy();
    this.view = null;
  }

  get html() {
    let state = this.state;
    let div = document.createElement('div');
    div.appendChild(DOMSerializer.fromSchema(state.schema).serializeFragment(state.doc.content));
    return div.innerHTML;
  }

  set html(value) {
    let state = this.state;
    let div = document.createElement('div');
    div.innerHTML = value;
    let fragment = DOMParser.fromSchema(state.schema).parse(div).content;
    this.apply(this.tr.replaceWith(0, state.doc.nodeSize - 2, fragment));
  }

  get text() {
    let doc = this.state.doc;
    return doc.textBetween(0, doc.content.size, '\n');
  }

  set text(value) {
    let state = this.state;
    let tr = state.tr.replaceWith(1, state.doc.content.size, value ? state.schema.text(value) : null);
    this.apply(tr);
  }

  refresh() {
    this.view.updateState(this.view.state);
  }

  focus() {
    if (this.state.selection.type === 'node') {
      this.selection = { type: 'text', anchor: 1, head: 1 };
    }
    this.view.focus();
  }

  get selection() {
    return this.state.selection.toJSON();
  }

  set selection(value) {
    this.apply(this.tr.setSelection(Selection.fromJSON(this.state.doc, value)));
  }

  selectAll() {
    this.selection = { type: 'text', anchor: 1, head: this.state.doc.nodeSize - 3 };
  }

  get selectionRect() {
    return this.state.selection.toJSON();
  }

  get tr() {
    return this.state.tr;
  }

  apply(tr) {
    this.state = this.state.apply(tr);
    if (this.view) this.view.updateState(this.state);
    if (tr.docChanged) this.dispatchEvent('change');
    if (!this._lastSelection.eq(this.state.selection)) {
      this.dispatchEvent('selectionchange');
      this._lastSelection = this.state.selection;
    }
  }

}

function getEditorState(options) {
  let schema = getSchema(options);

  if (options.html || options.text) {
    let div = document.createElement('div');
    options.html ? (div.innerHTML = options.html) : (div.textContent = options.text);
    options.doc = DOMParser.fromSchema(schema).parse(div);
  }

  return EditorState.create({
    schema: schema,
    plugins: plugins(schema, options),
    doc: options.doc
  });
}

const styleId = 'dabble-editor-styles';

function addStylesIfNeeded(doc) {
  if (doc.getElementById(styleId)) return;
  let style = doc.createElement('style');
  style.id = styleId;
  style.textContent = styles;
  doc.head.appendChild(style);
}
