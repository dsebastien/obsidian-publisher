/**
 * How many milliseconds to wait before executing another action (e.g., time between publishing two posts)
 */
export const DELAY_BETWEEN_ACTIONS = 300;

/**
 * How many milliseconds to wait before hiding notices
 */
export const NOTICE_TIMEOUT = 5000;

/**
 * The version of the Ghost API we have tested against
 */
export const GHOST_API_VERSION = 'v5.15';

/**
 * Front matter key for post status
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS = 'opublisher_status';

/**
 * Front matter key for post title
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TITLE = 'opublisher_title';

/**
 * Front matter key for post slug
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_SLUG = 'opublisher_slug';

/**
 * Front matter key for post excerpt
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_EXCERPT = 'opublisher_excerpt';

/**
 * Front matter key for post tags
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TAGS = 'opublisher_tags';

/**
 * Front matter key for Ghost post URL
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL =
  'opublisher_ghost_url';

/**
 * Whether to trace HTTP requests to Ghost
 */
export const DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST = false;