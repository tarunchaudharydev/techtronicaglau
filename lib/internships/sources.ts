export type AuthorizedInternshipAdapter = {
  name: string;
  run: () => Promise<unknown>;
};

/**
 * Keep this registry empty until a company documents an authorized API/feed and
 * its terms permit this use. Manual review remains available in /manage.
 */
export const authorizedInternshipAdapters: AuthorizedInternshipAdapter[] = [];
