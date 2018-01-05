import { buildInputRules } from './input';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { placeholders } from './placeholders';
import { firstLetter } from './first-letter';
import { history, customizeHistory } from './history';
import { buildKeymap } from './keymap';
import { navKeymap } from './navigation';
import { menuPlugin } from './menu';
import { spaces } from './spaces';

baseKeymap.Escape = (state, dispatch, view) => {
  view.dom.blur();
};

export function plugins(schema, options) {
  let plugins = [
    buildInputRules(schema),
    keymap(navKeymap(options)),
    keymap(buildKeymap(schema)),
    keymap(baseKeymap),
    placeholders(options.placeholder),
    firstLetter(options.styleFirstLetter),
    customizeHistory(),
    history({
      depth: 400, // number of history items to keep (default is 100)
      newGroupDelay: 3000, // ms since last edit before breaking history, the customizeHistory plugin breaks it usually
      preserveItems: true // must be true when using collab plugin
    }),
    spaces(),
    menuPlugin(),
    dropCursor(),
  ];

  return plugins;
}

