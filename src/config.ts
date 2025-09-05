export const config = {
  app: {
    version: import.meta.env.PACKAGE_VERSION || '1.0.0',
    baseUrl: import.meta.env.BASE_URL || '/',
    env: import.meta.env.VITE_ENV || 'development',
    lastCommitSha: import.meta.env.VITE_LAST_COMMIT_SHA || '',
  },
};
