import { OPublisherPostStatus } from '../methods/is-valid-opublisher-post-status';

/**
 * Reference: https://ghost.org/docs/admin-api/
 */

export const GHOST_API_VERSION = 'v4.0';
export const GHOST_ADMIN_API_PATH = 'ghost/api/admin';
export const GHOST_POSTS_ENDPOINT = 'posts';

/**
 * Ghost post object
 */
export interface GhostPost {
  /**
   * Title of the post. Mandatory.
   */
  title: string;
  /**
   * Slug of the post. If not provided, Ghost will generate one based on the post title
   */
  slug: string | undefined;
  /**
   * The HTML of the post
   */
  html: string;
  feature_image: string | undefined;
  feature_image_alt: string | undefined;
  feature_image_caption: string | undefined;
  featured: boolean;
  status: OPublisherPostStatus;
  visibility: GhostPostVisibility;
  published_at: string | undefined;
  codeinjection_head?: string;
  codeinjection_foot?: string;
  custom_template?: string;
  canonical_url: string | undefined;
  tags: string[]; // FIXME validate
  // authors
  // primary_author
  // primary_tag
  custom_excerpt: string | undefined;
  excerpt: string;
  og_image: string | undefined;
  og_title: string;
  og_description: string;
  twitter_title: string;
  twitter_description: string;
  meta_title: string;
  meta_description: string;
  email_only: boolean;
  // newsletter
  // email
}

/**
 * Wrapper object for Ghost posts
 */
export interface GhostPostWrapper {
  posts: [GhostPost];
}

const GhostPostVisibilities = ['public', 'paid', 'members'] as const;
export type GhostPostVisibility = typeof GhostPostVisibilities[number];

/**
 * Details we care about in the response of a Ghost post creation
 */
export interface GhostPostCreationResponsePostDetails {
  id: string;
  uuid: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  url: string;
  title: string;
}

export interface GhostPostCreationResponseErrorDetail {
  message: string;
  params: {
    allowedValues: string;
  }
}

export interface GhostPostCreationResponseError {
  context: string;
  message: string;
  details: GhostPostCreationResponseErrorDetail[];
}

export interface GhostPostCreationResponse {
  posts: GhostPostCreationResponsePostDetails[];
  errors?: GhostPostCreationResponseError[];
}
