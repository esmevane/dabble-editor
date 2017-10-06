import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  emDash,
  ellipsis
} from 'prosemirror-inputrules';


export function blockQuoteRule(nodeType) {
  return textblockTypeInputRule(/^\s*>\s$/, nodeType)
}


export function orderedListRule(nodeType) {
  return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({order: +match[1]}),
                           (match, node) => node.childCount + node.attrs.order == +match[1])
}

export function bulletListRule(nodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

export function codeBlockRule(nodeType) {
  return textblockTypeInputRule(/^```$/, nodeType)
}

export function headingRule(nodeType, maxLevel) {
  return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"),
                                nodeType, match => ({level: match[1].length}))
}

export function buildInputRules(schema) {
  // if (type = schema.nodes.scene) result.push(splitRule(/^\*{3}$/, 1));
  let rules = smartQuotes.concat(ellipsis, emDash), type;
  if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type));
  if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type));
  if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type));
  if (type = schema.nodes.code_block) rules.push(codeBlockRule(type));
  if (type = schema.nodes.heading) rules.push(headingRule(type, 6));
  return inputRules({rules});
}

// function splitRule(match, depth) {
//   return new InputRule(match, (state, match, start, end) => {
//     let $start = state.doc.resolve(start - 1);
//     let $end = state.doc.resolve(end + 1);
//     let hasBefore = Boolean($start.nodeBefore);
//     let hasAfter = Boolean($end.nodeAfter);
//     // Ensure only new paragraphs that would be expected get created, and the cursor goes to the right place (the
//     // empty block if one side is empty)
//     if (hasBefore && hasAfter) {
//       // Split a block without adding any paragraphs
//       return state.tr
//         .delete(start - 1, end + 1)
//         .split(start - 1, depth);
//     } else if (hasBefore) {
//       // Add a block with a paragraph after
//       return state.tr
//         .delete(start, end)
//         .split(start - 1, depth);
//     } else if (hasAfter) {
//       // Add a block with a paragraph before
//       return state.tr
//         .delete(start, end)
//         .split(start + 1, depth);
//     } else {
//       return state.tr
//         .delete(start, end)
//         .split(start, depth + 1);
//     }
//   });
// }

