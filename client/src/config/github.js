/**
 * Centralized GitHub configuration.
 * Change the VITE_GITHUB_USERNAME in .env to update the profile across the entire app.
 */
export const GITHUB_USERNAME = import.meta.env.VITE_GITHUB_USERNAME || 'Nancypaul08';

export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;

export const GITHUB_AVATAR_URL = `https://github.com/${GITHUB_USERNAME}.png?size=80`;

export const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_USERNAME}/issues`;