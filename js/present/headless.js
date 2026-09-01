export function createHeadless() {
  let last = null;
  return {
    present(snap) { last = snap; },
    last() { return last; },
  };
}
