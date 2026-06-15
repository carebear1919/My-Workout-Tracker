/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Get YouTube API key from environment variables
 * The key is loaded from .env.local (not committed to git)
 */
export const getYouTubeApiKey = (): string => {
  return import.meta.env.VITE_YOUTUBE_API_KEY || '';
};

/**
 * Check if YouTube API key is configured
 */
export const isYouTubeApiKeyConfigured = (): boolean => {
  return Boolean(getYouTubeApiKey().trim());
};
