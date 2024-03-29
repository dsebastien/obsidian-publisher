import { Notice, request } from 'obsidian';
import { marked } from 'marked';
//import {baseUrl} from 'marked-base-url';
import { OPublisherRawPost, OPublisherUpdatedPostDetails } from '../types';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';
import { delay } from '../utils/delay';
import {
  DEBUG_SKIP_GHOST_PUBLISH_ACTION,
  DEBUG_TRACE_GHOST_PUBLISHING,
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
import { assertUnreachable } from '../utils/assert-unreachable.fn';
import GhostAdminApi = require('@tryghost/admin-api');

/**
 * Publish the provided posts to Ghost.
 * Assumes that the configuration has been validated already!
 * @param posts the posts to publish (or update)
 * @param settings the plugin configuration for Ghost
 * @returns a Map of updated posts indexed by post slug (which must be unique by design)
 */
export const publishToGhost = async (
  posts: OPublisherRawPost[],
  settings: OPublisherGhostSettings
): Promise<Map<string, OPublisherUpdatedPostDetails>> => {
  log(
    `Publishing ${posts.length} post(s) to Ghost Website (${settings.apiUrl})`,
    'info'
  );

  const ghostApi = new GhostAdminApi({
    url: settings.apiUrl,
    version: GHOST_API_VERSION,
    key: settings.adminToken,
    // TODO extract function to separate file
    makeRequest: async (options: GhostAdminApiMakeRequestOptions) => {
      if (DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST) {
        log(`Sending a request to Ghost`, 'debug', options);
      }

      const requestParameters = options.params;

      // Add query parameters to construct the final requestUrl
      // Part of the code below is taken directly from the official client: https://github.com/TryGhost/SDK/blob/main/packages/admin-api/lib/admin-api.js
      let requestUrl = options.url;

      const requestParameterKeys = Object.keys(requestParameters);
      if (requestParameterKeys.length > 0) {
        requestUrl +=
          '?' +
          requestParameterKeys
            .reduce((parts, key) => {
              const val = encodeURIComponent(
                [].concat(requestParameters[key]).join(',')
              );
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              return parts.concat(`${key}=${val}`);
            }, [])
            .join('&');
      }

      if (DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST) {
        log(`Request URL`, 'debug', requestUrl);
        log(`Method`, 'debug', options.method);
        log(`Params`, 'debug', options.params);
        log(`Data`, 'debug', options.data);
        log(`Headers`, 'debug', options.headers);
      }

      try {
        const response = await request({
          url: requestUrl,
          method: options.method,
          headers: options.headers,
          body: JSON.stringify(options.data),
          throw: true,
        });

        if (DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST) {
          log(`Response`, 'debug', response);
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
    if (DEBUG_TRACE_GHOST_PUBLISHING) {
      log(`Publishing post ${post.title} to Ghost`, 'debug');
    }
    new Notice(
      `Publishing post ${currentPost++}/${posts.length}`,
      NOTICE_TIMEOUT
    );

    // Reference: https://marked.js.org/using_pro
    marked.use({
      // Reference: https://marked.js.org/using_advanced#options

      // If true, add <br> on a single line break (copies GitHub behavior on comments, but not on rendered markdown files). Requires gfm be true.
      breaks: false,
      // GitHub flavored markdown
      gfm: true,
      // Disabled. Use marked-gfm-heading-id to include an id attribute when emitting headings (h1, h2, h3, etc).
      headerIds: false, // TODO add header ids https://www.npmjs.com/package/marked-gfm-heading-id
      // Disabled mangling email addresses. Use marked-mangle to mangle email addresses
      mangle: false,
      // If true, conform to the original markdown.pl as much as possible. Don't fix original markdown bugs or behavior. Turns off and overrides gfm.
      pedantic: false,
    });

    let postProcessedContent = post.content;

    if (DEBUG_TRACE_GHOST_PUBLISHING) {
      log('Content before post processing: ', 'debug', postProcessedContent);
    }

    if (DEBUG_TRACE_GHOST_PUBLISHING) {
      log('Processing links: ', 'debug', post.linksToMap);
    }

    // Map the links so that they point to <base-url>/<slug>
    for (const linkToMap of post.linksToMap) {
      const mappedLinkTarget = `${settings.baseUrl}/${linkToMap.slug}`;
      log('Mapped link target: ', 'debug', mappedLinkTarget);
      log('Mapped link file name: ', 'debug', linkToMap.fileDetails?.file.name);

      // For the display text, we either take the existing display text, or the alternative title if there is no display text, or the file name if there is no alternative title either
      const mappedLinkDisplayText = linkToMap.linkCache.displayText
        ? linkToMap.linkCache.displayText
        : linkToMap.alternativeTitle
        ? linkToMap.alternativeTitle
        : linkToMap.fileDetails!.file.basename;
      const mappedLink = `<a href='${mappedLinkTarget}'>${mappedLinkDisplayText}</a>`;
      postProcessedContent = postProcessedContent.replaceAll(
        linkToMap.linkCache.original,
        mappedLink
      );
    }

    if (DEBUG_TRACE_GHOST_PUBLISHING) {
      log('Content after post processing: ', 'debug', postProcessedContent);
    }

    const postProcessedContentAsHtml = marked(postProcessedContent);

    if (DEBUG_TRACE_GHOST_PUBLISHING) {
      log('Generated HTML: ', 'debug', postProcessedContentAsHtml);
    }

    // @ts-ignore
    const ghostPost: GhostPost = mapRawPostToGhostPost(
      post,
      postProcessedContentAsHtml
    );

    if (!DEBUG_SKIP_GHOST_PUBLISH_ACTION) {
      switch (post.publishAction) {
        case 'publish':
          try {
            const createdPost = await ghostApi.posts.add(ghostPost, {
              source: 'html', // Tell the API to use HTML as the content source, instead of mobiledoc, as we convert Markdown to HTML
            });

            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(`Created Ghost post`, 'debug', createdPost);
            }

            const postId = createdPost.id;
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(`Ghost post ID`, 'debug', postId);
            }

            const postUrl = createdPost.url;
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(`Ghost post URL`, 'debug', postUrl);
            }

            const postUpdatedAt = createdPost.updated_at;
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(`Ghost post UPDATED AT`, 'debug', postUpdatedAt);
            }

            // Keep track of the post URL so that it can later be recognized as a post to update rather than as a post to create
            retVal.set(post.metadata.slug, {
              id: postId,
              url: postUrl,
              updated_at: postUpdatedAt,
            });

            new Notice(
              `"${createdPost.title}" (${post.filePath}) has been published successfully!`,
              NOTICE_TIMEOUT
            );
          } catch (error: unknown) {
            log('Ghost publication error', 'debug', error);
            new Notice(
              `Failed to publish the post. Error: ${error}`,
              NOTICE_TIMEOUT
            );
          }
          break;
        case 'update':
          try {
            const updatedPost = await ghostApi.posts.edit(ghostPost, {
              source: 'html', // Tell the API to use HTML as the content source, instead of mobiledoc, as we convert Markdown to HTML
            });

            const postId = updatedPost.id;
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(`Ghost post ID`, 'debug', postId);
            }

            const postUrl = updatedPost.url;
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(`Ghost post URL`, 'debug', postUrl);
            }

            const postUpdatedAt = updatedPost.updated_at;
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(`Ghost post UPDATED AT`, 'debug', postUpdatedAt);
            }

            // Keep track of the post URL so that it can later be recognized as a post to update rather than as a post to create
            retVal.set(post.metadata.slug, {
              id: postId,
              url: postUrl,
              updated_at: postUpdatedAt,
            });

            new Notice(
              `"${updatedPost.title}" (${post.filePath}) has been updated successfully!`,
              NOTICE_TIMEOUT
            );
          } catch (error: unknown) {
            log('Ghost publication error', 'debug', error);
            new Notice(
              `Failed to update the post. Error: ${error}`,
              NOTICE_TIMEOUT
            );
          }
          break;
        default:
          // FIXME remove
          // @ts-ignore
          assertUnreachable(post.publishAction);
      }

      // We delay the processing to avoid hitting the rate limits of Ghost
      await delay(DELAY_BETWEEN_ACTIONS);
    }
  }

  return retVal;
};
