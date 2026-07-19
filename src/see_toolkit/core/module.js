// Module contract (documentation + optional runtime guard):
//   { id: string, title: string,
//     plan(state) -> { writes: {label, send}[], view: object },
//     render?(view, sectionEl) }
export function isModule(m) {
  return m && typeof m.id === 'string' && typeof m.plan === 'function';
}
