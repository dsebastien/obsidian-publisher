import { Notice, request } from 'obsidian';
import { marked } from 'marked';
import GhostAdminApi = require('@tryghost/admin-api');
import { OPublisherRawPost, OPublisherUpdatedPostDetails } from '../types';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';
import { delay } from '../utils/delay';
import {
  DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST,
  DELAY_BETWEEN_ACTIONS,
  GHOST_API_VERSION,
  NOTICE_TIMEOUT,
} from '../constants';
import { log } from '../utils/log';
import {
  GhostAdminApiMakeRequestOptions,
  GhostPost,
} from '@tryghost/admin-api';
import { mapRawPostToGhostPost } from './map-raw-post-to-ghost-post';

/**
 * Publish the provided posts to Ghost.
 * Assumes that the configuration has been validated already!
 * @param posts the posts to publish
 * @param settings
 */
export const publishToGhost = async (
  posts: OPublisherRawPost[],
  settings: OPublisherGhostSettings
): Promise<Map<string, OPublisherUpdatedPostDetails>> => {
  log(
    `Publishing ${posts.length} post(s) to Ghost Website (${settings.apiUrl})`,
    'info'
  );

  // Extract the id and secret from the Admin token

  // Create the API token
  // const apiToken = sign({}, Buffer.from(secret, 'hex'), {
  //   keyid,
  //   algorithm: 'HS256',
  //   expiresIn: '5m',
  //   audience: `/admin/`,
  // });

  const ghostApi = new GhostAdminApi({
    url: settings.apiUrl,
    version: GHOST_API_VERSION,
    key: settings.adminToken,
    makeRequest: async (options: GhostAdminApiMakeRequestOptions) => {
      if (DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST) {
        log(`Sending a request to Ghost`, 'debug', options);
      }

      const requestParameters = options.params;

      // Add query parameters to construct the final requestUrl
      // Part of the code below is taken directly from the official client: https://github.com/TryGhost/SDK/blob/main/packages/admin-api/lib/admin-api.js
      const requestUrl =
        options.url +
        '?' +
        Object.keys(requestParameters)
          .reduce((parts, key) => {
            const val = encodeURIComponent(
              [].concat(requestParameters[key]).join(',')
            );
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return parts.concat(`${key}=${val}`);
          }, [])
          .join('&');

      if (DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST) {
        log(`Request URL`, 'debug', requestUrl);
        log(`Data`, 'debug', options.data);
        log(`Headers`, 'debug', options.headers);
      }

      try {
        const response = await request({
          url: requestUrl,
          method: options.method,
          headers: options.headers,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify(options.data),
          throw: true,
        });

        if (DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST) {
          log('${LOG_PREFIX} Response', 'debug', response);
        }

        return JSON.parse(response);
      } catch (error: unknown) {
        log(`Error`, 'error', error);
        throw error;
      }
    },
  });

  const retVal: Map<string, OPublisherUpdatedPostDetails> = new Map<
    string,
    OPublisherUpdatedPostDetails
  >();

  /**
   * Simple index. Could not use a `forEach` loop because we are using async-await
   */
  let currentPost = 1;
  for (const post of posts) {
    log(`Publishing post ${post.title} to Ghost`, 'debug');
    new Notice(
      `Publishing post ${currentPost++}/${posts.length}`,
      NOTICE_TIMEOUT
    );

    // FIXME handle post update scenario

    // Temporary (will later be rewritten as the content gets processed (e.g., for embeds)
    // TODO process the images, links, etc
    const postProcessedContent = post.content;
    const postProcessedContentAsHtml = marked(postProcessedContent, {
      // FIXME define baseUrl for links
    });

    const ghostPost: GhostPost = mapRawPostToGhostPost(
      post,
      postProcessedContentAsHtml
    );

    try {
      const createdPost = await ghostApi.posts.add(ghostPost, {
        source: 'html', // Tell the API to use HTML as the content source, instead of mobiledoc, as we convert Markdown to HTML
      });

      log(`Created Ghost post`, 'debug', createdPost);

      const postUrl = createdPost.url;
      log(`Ghost post URL`, 'debug', postUrl);

      // Keep track of the post URL so that it can later be recognized as a post to update rather than as a post to create
      retVal.set(post.metadata.slug, {
        url: postUrl,
      });

      new Notice(
        `"${createdPost.title}" (${post.filePath}) has been published successfully!`,
        NOTICE_TIMEOUT
      );

      // Next: inspect call results
      // And extract relevant metadata (e.g., id, url, etc)
    } catch (error: unknown) {
      log('Ghost publication error', 'debug', error);
      new Notice(`Failed to publish the post. Error: ${error}`, NOTICE_TIMEOUT);
    }

    // We delay the processing to avoid hitting rate limits
    await delay(DELAY_BETWEEN_ACTIONS);
  }

  return retVal;
};
