// Minimal dependency-free replacement for the `nanoid` customAlphabet API,
// avoids pulling in an extra package just for short room codes.
export function customAlphabet(alphabet, size) {
  return function generate() {
    let id = '';
    for (let i = 0; i < size; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  };
}
