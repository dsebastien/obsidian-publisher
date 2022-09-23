import {
  Notice, request,
} from 'obsidian';
import {marked} from 'marked';
import GhostAdminApi = require("@tryghost/admin-api");
import {OPublisherRawPost} from '../types';
import {OPublisherGhostSettings} from '../types/opublisher-ghost-settings.intf';
import {delay} from '../utils/delay';
import {DELAY_BETWEEN_ACTIONS, GHOST_API_VERSION, NOTICE_TIMEOUT} from '../constants';
import {log, LOG_PREFIX} from "../utils/log";
import {GhostAdminApiMakeRequestOptions, GhostPost} from "@tryghost/admin-api";

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
      log(`${LOG_PREFIX} Sending a request to Ghost`, 'debug', options);

      const requestParameters = options.params;

      // Add query parameters to construct the final requestUrl
      // Part of the code below is taken directly from the official client: https://github.com/TryGhost/SDK/blob/main/packages/admin-api/lib/admin-api.js
      const requestUrl = options.url + '?' + Object.keys(requestParameters).reduce((parts, key) => {
        const val = encodeURIComponent([].concat(requestParameters[key]).join(','));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return parts.concat(`${key}=${val}`);
      }, []).join('&');

      log(`${LOG_PREFIX} Request URL`, 'debug', requestUrl);
      log(`${LOG_PREFIX} Data`, 'debug', options.data);
      log(`${LOG_PREFIX} Headers`, 'debug', options.headers);

      try {
        const response = await request({
          url: requestUrl,
          method: options.method,
          headers: options.headers,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify(options.data),
          throw: true,
        });

        // Uncomment to see everything that we get back
        //log('${LOG_PREFIX} Response', 'debug', response);

        return JSON.parse(response);
      } catch (error: unknown) {
        log(`${LOG_PREFIX} Error`, 'error', error);
        throw error;
      }
    }
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
    // TODO process the images, links, etc
    const postProcessedContent = post.content;
    const postProcessedContentAsHtml = marked(postProcessedContent, {
        // FIXME define baseUrl for links
      });

    const ghostPost: GhostPost = createGhostPost(post, postProcessedContentAsHtml);

    try {
      const createdPost = await ghostApi.posts.add(ghostPost, {
        source: 'html', // Tell the API to use HTML as the content source, instead of mobiledoc, as we convert Markdown to HTML
      });

      log(`${LOG_PREFIX} Created Ghost post`, 'debug', createdPost);

      const postUrl = createdPost.url;
      log(`${LOG_PREFIX} Ghost post URL`, 'debug', postUrl);


      new Notice(
          `"${createdPost.title}" (${post.filePath}) has been published successfully!`,
          NOTICE_TIMEOUT
        );

      // Next: inspect call results
      // And extract relevant metadata (e.g., id, url, etc)

    } catch (error: unknown) {
      log('Ghost publication error', 'debug', error);
        new Notice(
          `Failed to publish the post. Error: ${error}`,
          NOTICE_TIMEOUT
        );
    }

    // We delay the processing to avoid hitting rate limits
    await delay(DELAY_BETWEEN_ACTIONS);
  }

  // Next: return collected call results
  return 0;
};

export const createGhostPost = (
  post: OPublisherRawPost,
  htmlContent: string,
): GhostPost => ({
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
  published_at: undefined,
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
