import { defaultSchema } from './schema';
import { Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';


export function nodeFromJSON(json) {
  return Node.fromJSON(defaultSchema, json);
}

export function stepFromJSON(json) {
  return Step.fromJSON(defaultSchema, json);
}
