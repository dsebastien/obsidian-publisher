import { OPublisherPostStatus } from '../methods/is-valid-opublisher-post-status';

/**
 * Reference: https://ghost.org/docs/admin-api/
 */

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
  slug?: string;
  id?: string;
  uuid?: string;
  /**
   * The HTML of the post
   */
  html: string;
  feature_image?: string;
  feature_image_alt?: string;
  feature_image_caption?: string;
  featured: boolean;
  status: OPublisherPostStatus;
  visibility: GhostPostVisibility;
  published_at?: string;
  codeinjection_head?: string;
  codeinjection_foot?: string;
  custom_template?: string;
  canonical_url?: string;
  tags: string[]; // FIXME validate
  // authors
  // primary_author
  // primary_tag
  url?: string;
  custom_excerpt?: string;
  excerpt: string;
  og_image?: string;
  og_title: string;
  og_description: string;
  twitter_image?: string;
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
