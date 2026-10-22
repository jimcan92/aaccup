/**
 * Admin shell state shared between pages and the layout. A block editor with its side preview
 * open sets `compact`, and the sidebar shrinks to icons to give the editor and preview room.
 * Only set in the browser (from effects), so the server always renders the full sidebar.
 */
export const adminUi = $state({ compact: false });
