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
export const GHOST_API_VERSION = 'v5.53';

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
 * Front matter key for Ghost post ID
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_ID =
  'opublisher_ghost_id';

/**
 * Front matter key for Ghost post URL
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL =
  'opublisher_ghost_url';

/**
 * Front matter key for Ghost post updated_at
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_UPDATED_AT =
  'opublisher_ghost_updated_at';

/**
 * Front matter key for note hash
 */
export const OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_NOTE_HASH = 'opublisher_hash';

/**
 * Whether to trace HTTP requests to Ghost
 */
export const DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST = false;
/**
 * Whether to trace the Ghost publishing process
 */
export const DEBUG_TRACE_GHOST_PUBLISHING = false;
/**
 * Whether to trace the publishing preparation process
 */
export const DEBUG_TRACE_PUBLISHING_PREPARATION = false;
/**
 * Whether to trace the handling of publishing results (e.g., update of notes metadata)
 */
export const DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING = true;
/**
 * Whether to skip the publish action for Ghost posts (only useful for debugging)
 */
export const DEBUG_SKIP_GHOST_PUBLISH_ACTION = false;
/**
 * Regex that can be used to identify images
 * WARNING: With /gmi, the regex is stateful, and lastIndex must be reset each time
 */
export const IMAGE_REGEX = /(?<filename>.*)\.(?<extension>png|webp|jpg|jpeg|gif|bmp|svg)/gmi;
/**
 * Regex that can be used to extract embedded images
 * WARNING: With /gmi, the regex is stateful, and lastIndex must be reset each time
 * Reference: https://help.obsidian.md/Advanced+topics/Accepted+file+formats
 */
export const IMAGE_EMBED_REGEX =
  /!\[\[(?<filename>.*)\.(?<extension>png|webp|jpg|jpeg|gif|bmp|svg)\]\]/gmi;

export const MARKDOWN_EXTENSION = "md";
/**
 * Regex that can be used to identify (Obsidian) Markdown links
 * WARNING: With /gmi, the regex is stateful, and lastIndex must be reset each time
 */
export const MARKDOWN_LINK_REGEX = /^\[(.+)\]\((.+)\)$/gmi;
