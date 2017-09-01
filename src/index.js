import { Editor } from './editor';
export { Editor };

export function createEditor(options) {
  return new Editor(options);
}

export { nodeFromJSON, stepFromJSON } from './from-json';
