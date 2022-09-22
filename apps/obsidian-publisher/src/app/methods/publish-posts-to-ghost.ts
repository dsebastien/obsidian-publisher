import {sign} from 'jsonwebtoken';
import {Notice, request} from 'obsidian';
import {marked} from 'marked';

import {OPublisherRawPost} from '../types';
import {log} from '../utils/log';
import {OPublisherGhostSettings} from '../types/opublisher-ghost-settings.intf';
import {
  GHOST_ADMIN_API_PATH,
  GHOST_API_VERSION,
  GHOST_POSTS_ENDPOINT,
  GhostPostCreationResponse,
  GhostPostWrapper,
} from '../types/ghost-api';
import {delay} from '../utils/delay';
import {DELAY_BETWEEN_ACTIONS, NOTICE_TIMEOUT} from '../constants';

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
    `Publishing ${posts.length} post(s) to Ghost Website (${settings.apiUrl})`,
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
      `Publishing post ${currentPost++}/${posts.length}`,
      NOTICE_TIMEOUT
    );

    // Temporary (will later be rewritten as the content gets processed (e.g., for embeds)
    const postProcessedContent = post.content;

    const ghostPost: GhostPostWrapper = createGhostPost(
      post,
      postProcessedContent
    );

    const response = await request({
      url: `${settings.apiUrl}/${GHOST_ADMIN_API_PATH}/${GHOST_POSTS_ENDPOINT}/?source=html`,
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
    const responseAsJSON: GhostPostCreationResponse = JSON.parse(response);

    // Next: inspect call results
    // And extract relevant metadata (e.g., id, url, etc)
    if (responseAsJSON.posts) {
      new Notice(
        `"${responseAsJSON?.posts?.[0]?.title}" (${post.filePath}) has been published successfully!`,
        NOTICE_TIMEOUT
      );
    } else {
      new Notice(
        `Failed to publish the post. Error: ${
          responseAsJSON.errors![0].context || responseAsJSON.errors![0].message
        }`,
        NOTICE_TIMEOUT
      );
      new Notice(
        `Error details: ${responseAsJSON.errors![0]?.details[0].message} - ${
          responseAsJSON.errors![0]?.details[0].params.allowedValues
        }`,
        NOTICE_TIMEOUT
      );
    }

    log('Ghost publication result:', 'debug', response);

    // We delay the processing to avoid hitting rate limits
    await delay(DELAY_BETWEEN_ACTIONS);
  }

  // Next: return collected call results
  return 0;
};

// TODO move to separate file
const createGhostPost = (
  post: OPublisherRawPost,
  postProcessedContent: string
): GhostPostWrapper => ({
  posts: [
    {
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
      html: marked(postProcessedContent, {
        // TODO define baseUrl for links
      }),
      canonical_url: undefined,
      og_image: undefined,
      published_at: undefined,
      feature_image: undefined,
      feature_image_alt: undefined,
      feature_image_caption: undefined,
    },
  ],
});
