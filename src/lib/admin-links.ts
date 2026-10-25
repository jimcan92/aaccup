// A program's visits and sections are subpages of its Documents tab:
// /admin/programs/<program>/documents/<visit>/<section>.
export const documentsHref = (programId: string) => `/admin/programs/${programId}/documents`;
export const visitHref = (programId: string, visitId: string) => `${documentsHref(programId)}/${visitId}`;
export const sectionHref = (programId: string, visitId: string, sectionId: string) => `${visitHref(programId, visitId)}/${sectionId}`;
