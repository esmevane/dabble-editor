import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';


export function firstLetter(use) {
  return new Plugin({
    props: {
      decorations(state) {
        if (!use) return DecorationSet.empty;
        return DecorationSet.create(state.doc, [
          Decoration.inline(1, 2, { class: 'first-letter' })
        ]);
      }
    }
  });
}
