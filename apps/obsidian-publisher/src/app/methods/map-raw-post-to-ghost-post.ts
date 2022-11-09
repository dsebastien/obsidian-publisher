import { OPublisherRawPost } from '../types';
import { GhostPost } from '@tryghost/admin-api';

/**
 * Maps a Raw post (Obsidian) to a Ghost Post
 * @param post the post to convert
 * @param htmlContent the content of the post rendered as HTML to include in the Ghost post
 */
export const mapRawPostToGhostPost = (
  post: OPublisherRawPost,
  htmlContent: string
): GhostPost => ({
  id: post.id,
  slug: post.metadata.slug,
  tags: post.metadata.tags,
  title: post.title,
  og_title: post.title,
  meta_title: post.title,
  twitter_title: post.title,
  meta_description: post.metadata.excerpt,
  og_description: post.metadata.excerpt,
  twitter_description: post.metadata.excerpt,
  excerpt: post.metadata.excerpt,
  custom_excerpt: post.metadata.excerpt,
  status: post.metadata.status,
  email_only: false,
  featured: false,
  visibility: 'public',
  html: htmlContent,
  canonical_url: undefined,
  frontmatter: undefined,
  updated_at: post.updated_at,
  og_image: undefined,
  feature_image: undefined,
  feature_image_alt: undefined,
  feature_image_caption: undefined,
  twitter_image: undefined,
  codeinjection_foot: undefined,
  codeinjection_head: undefined,
  custom_template: undefined,
  email_subject: undefined,
});
