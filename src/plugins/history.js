import { history, closeHistory } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';

export { history };

export function customizeHistory() {
  return new Plugin({
    filterTransaction(tr, state) {
      let type, slice;
      if (!tr.docChanged || !tr.steps.length) {
        type = 'selection';
      } else if (tr.steps.length > 1) {
        type = 'other';
      } else if ((slice = tr.steps[0].slice) && slice.content.size) {
        type = 'input';
        let text = slice.content.firstChild.text;
        if (!text || /^[.?!;]$/.test(text)) {
          this.cancelNext = true;
          if (!text) closeHistory(tr); // newlines
        }
      } else if (slice) {
        type = 'delete';
      } else {
        type = 'other';
      }

      if (this.cancelNext) {
        this.cancel = true;
        this.cancelNext = false;
      } else if (this.cancel) {
        closeHistory(tr);
        this.cancel = false;
      } else if (this.lastType !== type || type === 'other') {
        closeHistory(tr);
      }

      this.lastType = type;

      return true;
    }
  });
}
