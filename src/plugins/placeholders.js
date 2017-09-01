import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';


export function placeholders(placeholder) {
  return new Plugin({
    props: {
      decorations(state) {
        if (!placeholder) return DecorationSet.empty;
        let text = typeof placeholder === 'function' ? placeholder() : placeholder;
        let empty = state.doc.textContent ? undefined : 'empty';
        return DecorationSet.create(state.doc, [
          Decoration.node(0, state.doc.firstChild.nodeSize, { placeholder: text, class: empty })
        ]);
        return decorations;
      }
    }
  });
}
