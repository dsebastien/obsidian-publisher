import { sign } from 'jsonwebtoken';
import { Notice, request } from 'obsidian';
import { marked } from 'marked';

import { OPublisherRawPost } from '../types';
import { log } from '../utils/log';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';
import { GhostPostWrapper } from '../types/ghost-api';
import {delay} from "../utils/delay";

const GHOST_API_VERSION = 'v4.0';
const GHOST_ADMIN_API_PATH = 'ghost/api/admin';
const GHOST_POSTS_ENDPOINT = 'posts';

/**
 * Publish the provided posts to Ghost.
 * Assumes that the configuration has been validated already!
 * @param posts the posts to publish
 * @param settings
 */
export const publishToGhost = async (
  posts: OPublisherRawPost[],
  settings: OPublisherGhostSettings
): Promise<number> => {
  log(
    `Publishing ${posts.length} post(s) to Ghost Website (${settings.baseUrl})`,
    'info'
  );

  // Extract the id and secret from the Admin token
  const [keyid, secret] = settings.adminToken.split(':');

  // Create the API token
  const apiToken = sign({}, Buffer.from(secret, 'hex'), {
    keyid,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: `/admin/`,
  });

  /**
   * Simple index. Could not for a `forEach` loop because of the await
   */
  let currentPost = 1;
  for (const post of posts) {
    log(`Publishing post ${post.title} to Ghost`, 'debug');
    new Notice(
      `Publishing post ${currentPost++}/${posts.length}`
    );

    // Temporary (will later be rewritten as the content gets processed (e.g., for embeds)
    const postProcessedContent = post.content;

    const ghostPost: GhostPostWrapper = createGhostPost(
      post,
      postProcessedContent
    );

    const result = await request({
      url: `${settings.baseUrl}/${GHOST_ADMIN_API_PATH}/${GHOST_POSTS_ENDPOINT}/?source=html`,
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Accept-Version': GHOST_API_VERSION,
        Authorization: `Ghost ${apiToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(ghostPost),
    });

    // Parse the response
    const resultAsJSON = JSON.parse(result);

    // Next: inspect call results
    // And extract relevant metadata (e.g., id, url, etc)
    if (resultAsJSON?.posts) {
      new Notice(
        `"${resultAsJSON?.posts?.[0]?.title}" (${post.filePath}) has been published successfully!`
      );
    } else {
      new Notice(
        `${resultAsJSON.errors[0].context || resultAsJSON.errors[0].message}`
      );
      new Notice(
        `${resultAsJSON.errors[0]?.details[0].message} - ${resultAsJSON.errors[0]?.details[0].params.allowedValues}`
      );
    }

    log('Ghost publication result:', 'debug', result);

    // We delay the processing to avoid hitting rate limits
    await delay(150);
  }

  // Next: return collected call results
  return 0;
};

const createGhostPost = (
  post: OPublisherRawPost,
  postProcessedContent: string
): GhostPostWrapper => ({
  posts: [
    {
      title: post.title,
      og_title: post.title,
      meta_title: post.title,
      twitter_title: post.title,
      tags: post.metadata.tags,
      status: post.metadata.status,
      slug: post.metadata.slug,
      excerpt: post.metadata.excerpt,
      custom_excerpt: post.metadata.excerpt,
      email_only: false,
      featured: false,
      meta_description: post.metadata.excerpt,
      og_description: post.metadata.excerpt,
      twitter_description: post.metadata.excerpt,
      visibility: 'public',
      html: marked(postProcessedContent, {
        // TODO define baseUrl
      }),
    },
  ],
});
