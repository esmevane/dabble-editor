import { Plugin, Selection } from 'prosemirror-state';

export function spaces() {
  return new Plugin({
    props: {
      handleTextInput(view, from, to, text) {
        if (text !== ' ') return;
        let state = view.state;
        let before = state.doc.textBetween(from - 1, to);
        let after = state.doc.textBetween(from, to + 1);
        if (after === ' ') {
          let $pos = state.doc.resolve(from + 1);
          view.dispatch(state.tr.setSelection(Selection.findFrom($pos)));
        }
        if (before === ' ' || after === ' ') return true;
      }
    }
  });
}
