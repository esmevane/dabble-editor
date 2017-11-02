// import { wrapItem, blockTypeItem, Dropdown, DropdownSubmenu, joinUpItem, liftItem,
//        selectParentNodeItem, undoItem, redoItem, icons, MenuItem } from 'prosemirror-menu';
import { Plugin, Selection, NodeSelection } from 'prosemirror-state';
import { toggleMark, setBlockType } from 'prosemirror-commands';


class Menu {

  constructor(view) {
    this.view = view;
    this.blurred = false;
    this.onClose = null;
    this.element = createMenu(this);
    if (!this.element.items.children.length) {
      // Don't do anything if the menu is empty
      this.update = () => {};
      return;
    }
    let dom = view.dom;
    let doc = dom.ownerDocument;
    dom.addEventListener('focus', () => {
      this.blurred = false;
      this.update();
    });
    dom.addEventListener('blur', () => {
      setTimeout(() => {
        this.hide();
        this.blurred = true;
      });
    });
    this.element.input.addEventListener('blur', () => {
      setTimeout(() => {
        if (doc.activeElement !== dom && !this.element.contains(doc.activeElement)) {
          this.hide();
          this.blurred = true;
        }
      });
    });
    doc.addEventListener('mousedown', (event) => {
      if (event.which !== 1) return;
      this.mouseDown = true;
      this.update();
    });
    doc.addEventListener('mouseup', (event) => {
      if (event.which !== 1) return;
      this.mouseDown = false;
      this.update();
    });
    this.element.items.addEventListener('mousedown', (event) => {
      event.preventDefault();
      let button = event.target.closest('button');
      if (button && button.options && button.options.command) {
        button.options.command(view.state, view.dispatch);
      }
    })
  }

  show() {
    if (!this.element.parentNode) this.view.dom.ownerDocument.body.appendChild(this.element);
    this.reposition();
    requestAnimationFrame(() => this.element.classList.add('active'));
  }

  hide() {
    if (this.element.parentNode) {
      this.element.remove();
      this.element.classList.remove('active');
      if (this.onClose) {
        this.onClose();
        this.onClose = null;
      }
    }
  }

  update() {
    if (!this.mouseDown && !this.blurred) {
      let {from, to} = this.view.state.selection;
      if (from === to) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  reposition() {
    var container = this.element.parentNode;
    if (!container || !this.view.docView) return;
    this.updateState();
    var { from, to } = this.view.state.selection;
    let { node: fromNode, offset: fromOffset } = this.view.domAtPos(from);
    let { node: toNode, offset: toOffset } = this.view.domAtPos(to);
    let range = document.createRange();
    range.setStart(fromNode, fromOffset)
    range.setEnd(toNode, toOffset);
    let rect = range.getBoundingClientRect();
    this.element.style.left = Math.floor(rect.left +
      container.scrollLeft - (this.element.offsetWidth - rect.width)/2) + 'px';
    this.element.style.top = (rect.top +
      container.scrollTop - this.element.offsetHeight - 6) + 'px';
  }

  updateState() {
    Array.from(this.element.items.children).forEach(item => {
      if (item.options && item.options.isActive) {
        if (item.options.isActive(this.view.state)) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
      if (item.options && item.options.isAvailable) {
        if (item.options.isAvailable(this.view.state)) {
          item.removeAttribute('disabled');
        } else {
          item.setAttribute('disabled', '');
        }
      }
    });
  }
}

export function menuPlugin() {
  return new Plugin({
    view(view) {
      view.menu = new Menu(view);
      return {
        update() {
          view.menu.update();
        }
      };
    }
  });
}




function createMenu(menu) {
  let element = document.createElement('div');
  element.id = 'editable-menu';
  element.innerHTML = '<div class="editable-menu-items"></div>' +
    '<div class="editable-menu-input"><input placeholder="http://example.com/"><i class="close">×</i></div>';
  element.items = element.firstChild;
  element.input = element.lastChild.firstChild;
  element.inputClose = element.lastChild.lastChild;
  element.items.appendChild(createMenuItemsFromSchema(menu, element));
  return element;
}

function createMenuItemsFromSchema(menu, element) {
  let schema = menu.view.state.schema;
  let container = document.createDocumentFragment();
  if (schema.marks.strong) {
    container.appendChild(createMenuItem('bold', markItem(schema.marks.strong)));
  }
  if (schema.marks.em) {
    container.appendChild(createMenuItem('italic', markItem(schema.marks.em)));
  }

  if (schema.marks.link) {
    let {input, inputClose} = element;
    let item = markItem(schema.marks.link);
    let origCommand = item.command;
    item.command = function(state, dispatch) {
      if (this.isActive(state)) {
        origCommand(state, dispatch);
      } else {
        element.classList.add('input');
        element.input.focus();
        let state = menu.view.state;
        menu.onClose = () => {
          let selection = menu.view.state.selection;
          applyInput(state);
          menu.view.dispatch(menu.view.state.tr.setSelection(selection));
        };
      }
    };
    container.appendChild(createMenuItem('link', item));

    function closeInput() {
      menu.onClose = null;
      element.classList.remove('input');
      menu.view.focus();
      input.value = '';
    }

    function applyInput(state) {
      toggleMark(schema.marks.link, { href: input.value })(state, menu.view.dispatch);
      closeInput();
    }

    input.addEventListener('keydown', (event) => {
      if (event.keyCode === 27) {
        closeInput();
      } else if (event.keyCode === 13) {
        event.preventDefault();
        applyInput(menu.view.state);
      }
    });

    inputClose.addEventListener('mousedown', (event) => {
      event.preventDefault();
      closeInput();
    });
  }

  if (schema.nodes.heading) {
    if (container.children.length) {
      container.appendChild(createSeparator());
    }
    container.appendChild(createMenuItem('heading1', blockItem(schema.nodes.paragraph, schema.nodes.heading, { level: 2 })));
    container.appendChild(createMenuItem('heading2', blockItem(schema.nodes.paragraph, schema.nodes.heading, { level: 3 })));
  }
  if (schema.nodes.blockquote) {
    container.appendChild(createMenuItem('quote', blockItem(schema.nodes.paragraph, schema.nodes.blockquote)));
  }
  return container;
}

function createMenuItem(icon, options) {
  let item = document.createElement('button');
  item.className = 'editor-menu-' + icon;
  item.innerHTML = '<i class="icon editable-' + icon + '"></i>';
  item.options = options;
  return item;
}

function createSeparator() {
  var separator = document.createElement('div');
  separator.className = 'editable-menu-separator';
  return separator;
}


function markItem(type, attrs) {
  return {
    command: toggleMark(type, attrs),
    isAvailable: canToggleMark(type, attrs),
    isActive: markActive(type, attrs)
  }
}

function blockItem(defaultType, type, attrs) {
  return {
    command: blockCmd(defaultType, type, attrs),
    isAvailable: canSetBlock(type, attrs),
    isActive: blockActive(type, attrs)
  }
}

function markActive(type) {
  return function(state) {
    let {from, $from, to, empty} = state.selection
    if (empty) return type.isInSet(state.storedMarks || $from.marks());
    else return state.doc.rangeHasMark(from, to, type);
  };
}

function blockActive(type, attrs) {
  return function(state) {
    let {$from, to, node} = state.selection;
    if (node) return node.hasMarkup(type, attrs);
    return to <= $from.end() && $from.parent.hasMarkup(type, attrs);
  };
}

function blockCmd(defaultType, type, attrs) {
  let cmd = setBlockType(type, attrs);
  let defaultCmd = setBlockType(defaultType);
  return function(state, dispatch) {
    if (this.isActive(state)) {
      defaultCmd(state, dispatch);
    } else {
      cmd(state, dispatch);
    }
  };
}


function canToggleMark(type, attrs) {
  return function(state) {
    let {empty, $cursor, ranges} = state.selection;
    if ((empty && !$cursor) || !markApplies(state.doc, ranges, type)) return false;
    return true;
  }
}

function canSetBlock(type, attrs) {
  return function(state) {
    let {$from, $to} = state.selection, depth, target;
    if (state.selection instanceof NodeSelection) {
      depth = $from.depth;
      target = state.selection.node;
    } else {
      if (!$from.depth || $to.pos > $from.end()) return false;
      depth = $from.depth - 1;
      target = $from.parent;
    }
    if (!target.isTextblock) return false;
    let index = $from.index(depth);
    if (!$from.node(depth).canReplaceWith(index, index + 1, type)) return false;
    return true;
  }
}

function markApplies(doc, ranges, type) {
  for (let i = 0; i < ranges.length; i++) {
    let {$from, $to} = ranges[i]
    let can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false
    doc.nodesBetween($from.pos, $to.pos, node => {
      if (can) return false
      can = node.inlineContent && node.type.allowsMarkType(type)
    })
    if (can) return true
  }
  return false
}
