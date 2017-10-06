import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema, Node } from 'prosemirror-model';


const titles = {
  h1: createTitle('h1'),
  h2: createTitle('h2'),
  h3: createTitle('h3'),
  h4: createTitle('h4')
}

function createTitle(tag) {
  return {
    content: 'text*',
    group: 'block',
    defining: true,
    parseDOM: [{tag: `${tag}.title`}],
    toDOM(node) { return [ tag, { class: 'title' }, 0 ] }
  };
}


export function getSchema(options = {}) {
  if (options.title) {
    return new Schema({ nodes: { doc: { content: 'title' }, title: titles[options.title.toLowerCase()], text: {} }});
  }

  let nodes = addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block');
  nodes.get('blockquote').content = 'inline*';
  let marks = basicSchema.spec.marks;

  if (options.nodes) nodes = getOrderedMap(nodes, options.nodes);
  if (options.marks) marks = getOrderedMap(marks, options.marks);

  return new Schema({ nodes, marks });
}

export const defaultSchema = getSchema();

// can be an array of item [ 'title' ] or an object with include/exclude { exclude: [ 'code' ] } or
// { include: ['title' ] }. An array is the same as {include:[]}
function getOrderedMap(map, options) {
  if (!options) return map;
  let toRemove = {};
  if (Array.isArray(options.exclude)) {
    options.exclude.forEach(key => toRemove[key] = true);
  }
  let include = Array.isArray(options.include) ? options.include : Array.isArray(options) ? options : null;
  if (include) {
    let toInclude = {doc: true, text: true};
    include.forEach(key => toInclude[key] = true);
    map.forEach(key => toInclude[key] ? null : toRemove[key] = true);
    if (toInclude.title) map = map.addBefore('heading', 'title', titles.h1);
  }
  return map.subtract(toRemove);
}

export function nodeFromJSON(json) {
  return json ? defaultSchema.nodeFromJSON(json) : defaultSchema.topNodeType.createAndFill();
}
