import { wrapIn, setBlockType, chainCommands, toggleMark, exitCode } from 'prosemirror-commands';
import { selectNextCell, selectPreviousCell } from 'prosemirror-schema-table';
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { NodeSelection } from 'prosemirror-state';
import { undo, redo } from 'prosemirror-history';
import { undoInputRule } from 'prosemirror-inputrules';

const mac = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false;


export function buildKeymap(schema, mapKeys) {
  let keys = {}, type;
  function bind(key, cmd) {
    if (mapKeys) {
      let mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }

  bind("Mod-z", undo);
  bind("Shift-Mod-z", redo);
  bind("Backspace", undoInputRule);
  if (!mac) bind("Mod-y", redo);

  if (type = schema.marks.strong) {
    bind("Mod-b", toggleMark(type));
  }

  if (type = schema.marks.em){
    bind("Mod-i", toggleMark(type));
  }

  if (type = schema.marks.code) {
    bind("Mod-`", toggleMark(type));
  }

  if (type = schema.nodes.bullet_list) {
    bind("Shift-Ctrl-8", wrapInList(type));
  }

  if (type = schema.nodes.ordered_list) {
    bind("Shift-Ctrl-9", wrapInList(type));
  }

  if (type = schema.nodes.blockquote) {
    bind("Ctrl->", wrapIn(type));
  }

  if (type = schema.nodes.hard_break) {
    let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
      return true;
    });

    bind("Mod-Enter", cmd);
    bind("Shift-Enter", cmd);
    if (mac) bind("Ctrl-Enter", cmd);
  }

  bind("Delete", (state, dispatch, view) => {
    let { $cursor, $to, node } = state.selection;
    if (!$cursor || node || $to.parent.nodeSize > 2) return false;
    let atEnd = (view ? view.endOfTextblock("forward", state) : $cursor.parentOffset >= $cursor.parent.content.size);
    if (!atEnd) return false;

    dispatch(state.tr.
      setSelection(NodeSelection.create(state.doc, $to.pos - 1)).
      deleteSelection().
      scrollIntoView());
    return true;
  });

  if (type = schema.nodes.list_item) {
    bind("Enter", splitListItem(type));
    bind("Shift-Tab", chainCommands(liftListItem(type), () => true));
    bind("Tab", chainCommands(sinkListItem(type), () => true));
  } else {
    bind("Shift-Tab", () => true)
    bind("Tab", () => true)
  }

  if (type = schema.nodes.paragraph) {
    bind("Shift-Ctrl-0", setBlockType(type));
  }

  if (type = schema.nodes.code_block) {
    bind("Shift-Ctrl-\\", setBlockType(type));
  }

  if (type = schema.nodes.heading) {
    for (let i = 1; i <= 6; i++) {
      bind("Shift-Ctrl-" + i, setBlockType(type, {level: i}));
    }
  }

  if (type = schema.nodes.horizontal_rule) {
    let hr = type;
    bind("Mod-_", (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
      return true;
    });
  }

  if (schema.nodes.table_row) {
    bind("Tab", selectNextCell);
    bind("Shift-Tab", selectPreviousCell);
  }

  return keys;
}
