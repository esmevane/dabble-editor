import { Selection } from 'prosemirror-state';

/**
 * Moves the cursor from one editable field to the next/previous by arrow keys and Enter/Backspace.
 */
export function navKeymap(options) {
  let container = options.container;
  if (!container) return {};

  return {
    ArrowRight: getNext({ container, cursorOnly: true, atBoundary: true, boundary: 'end' }),
    Enter: getNext({ container, cursorOnly: true, atBoundary: true, nodes: [ 'title' ], boundary: 'end' }),
    ArrowDown: getNext({ container, boundary: 'end' }),
    'Meta-ArrowDown': getNext({ container, boundary: 'end' }),
    ArrowLeft: getNext({ container, cursorOnly: true, atBoundary: true, boundary: 'start' }),
    Backspace: getNext({ container, cursorOnly: true, atBoundary: true, boundary: 'start' }),
    'ArrowUp': getNext({ container, boundary: 'start' }),
    'Meta-ArrowUp': getNext({ container, boundary: 'start' })
  };
}

// let marker = document.createElement('div');

function getNext(options) {
  return (state, dispatch, view) => {
    let selPos = options.boundary === 'end' ? '$to' : '$from';
    let selOtherPos = options.boundary === 'end' ? '$from' : '$to';
    let boundaryChildProp = options.boundary === 'end' ? 'lastChild' : 'firstChild';
    let nodePos = options.boundary === 'end' ? 'first' : 'last';
    let indexMod = options.boundary === 'end' ? 1 : -1;
    let selMethod = options.boundary === 'end' ? 'atStart' : 'atEnd';
    let direction1 = options.boundary === 'end' ? 'forward' : 'backward';
    let direction2 = options.boundary === 'end' ? 'down' : 'up';

    let $pos = state.selection[selPos];
    let selNode = $pos.node();
    let boundaryChild = state.doc;
    let isAtBoundary = false;

    while (boundaryChild) {
      if (boundaryChild === selNode) {
        isAtBoundary = selNode === state.doc || view.endOfTextblock(options.atBoundary ? direction1 : direction2);
        break;
      }
      boundaryChild = boundaryChild[boundaryChildProp];
    }

    if (!isAtBoundary) return;
    if (options.cursorOnly && $pos.pos !== state.selection[selOtherPos].pos) return;
    if (options.nodes && options.nodes.indexOf(selNode.type.name) === -1) return;

    let container = view.dom.closest(options.container);
    let editors = Array.from(container.querySelectorAll('.ProseMirror'));
    let index = editors.indexOf(view.dom);
    let nextIndex = index + indexMod;
    if (index === -1 || nextIndex === editors.length || nextIndex === -1) return;
    let nextView = editors[index + indexMod].pmView;
    nextView.focus();

    let selection = Selection[selMethod](nextView.state.doc);
    nextView.dispatch(nextView.state.tr.setSelection(selection).scrollIntoView());

    if (!options.atBoundary) {
      let coords = view.coordsAtPos($pos.pos);
      coords.top = Math.round(getTextTop(nextView.dom, nodePos));
      coords.left = Math.round(coords.left);
      let posInfo = nextView.posAtCoords(coords);
      // let project = document.getElementById('project');
      // project.appendChild(marker);
      // let offset = project.getBoundingClientRect();
      // marker.innerHTML = `<div style="position:absolute;left:${coords.left - offset.left}px;` +
      //   `top:${coords.top - offset.top}px;width:2px;height:10px;background:blue;pointer-events:none"></div>`;
      selection = posInfo ?
        Selection.near(nextView.state.doc.resolve(posInfo.pos)) :
        Selection[selMethod](nextView.state.doc);

      nextView.dispatch(nextView.state.tr.setSelection(selection));
    }


    return true;
  };
}


function getTextNode(node, position) {
  const textNodeFinder = node.ownerDocument.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  return textNodeFinder[position + 'Child']();
}

function getTextTop(node, position) {
  let text = getTextNode(node, position);
  if (!text || !text.data.length) return 0;
  let range = node.ownerDocument.createRange();
  if (position === 'first') {
    range.setStart(text, 0);
    range.setEnd(text, 1);
  } else {
    range.setStart(text, text.data.length - 1);
    range.setEnd(text, text.data.length);
  }
  let rect = range.getBoundingClientRect();
  return rect.top + rect.height/2;
}
