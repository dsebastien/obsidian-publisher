import { Notice, request } from 'obsidian';
import { marked, Tokenizer } from 'marked';
import { baseUrl } from 'marked-base-url';

import {
  FileEmbed,
  OPublisherRawPost,
  OPublisherUpdatedPostDetails,
} from '../types';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';
import { delay } from '../utils/delay';
import {
  DEBUG_TRACE_GHOST_PUBLISHING,
  DEBUG_TRACE_HTTP_REQUESTS_TO_GHOST,
  DELAY_BETWEEN_ACTIONS,
  GHOST_API_VERSION,
  IMAGE_EMBED_REGEX,
  NOTICE_TIMEOUT,
} from '../constants';
import { log } from '../utils/log';
import {
  GhostAdminApiImageUploadData,
  GhostAdminApiMakeRequestOptions,
  GhostPost,
} from '@tryghost/admin-api';
import { mapRawPostToGhostPost } from './map-raw-post-to-ghost-post';
import { assertUnreachable } from '../utils/assert-unreachable.fn';
import GhostAdminApi = require('@tryghost/admin-api');
import TokenizerThis = marked.TokenizerThis;

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

      if (requestUrl.endsWith('upload/')) {
        // Remove the Content-Type header as the multipart/form-data value is incorrect
        delete options.headers['Content-Type'];
        // FIXME THIS IS BROKEN
        // Ends up with 422 error
        options.headers['Content-Type'] = 'multipart/form-data;';
        options.headers['Accept'] = '*/*';

        console.log('Headers: ', options.headers);
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

    // Set the base URL to use for links
    // FIXME verify how links are modified by this
    marked.use(baseUrl(settings.baseUrl));

    const embeddedImagesToUpload: Map<string, FileEmbed> = new Map<
      string,
      FileEmbed
    >();

    // FIXME WIP for images
    // Find embedded images
    const tokenizer = new marked.Tokenizer();

    // References:
    // https://marked.js.org/using_pro
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/marked/marked-tests.ts
    const defaultParagraphHandler = tokenizer.paragraph;
    tokenizer.paragraph = function paragraph(
      this: Tokenizer & TokenizerThis,
      src: string
    ) {
      if (DEBUG_TRACE_GHOST_PUBLISHING) {
        log('Paragraph source', 'debug', src);
      }

      const matches = src.matchAll(IMAGE_EMBED_REGEX);

      if (!matches) {
        // Invoke the default paragraph tokenizer
        // FIXME validate
        if (DEBUG_TRACE_GHOST_PUBLISHING) {
          log(`Invoking the default paragraph tokenizer`, 'debug');
        }
        return defaultParagraphHandler.bind(this)(src);
      }

      for (const match of matches) {
        if (DEBUG_TRACE_GHOST_PUBLISHING) {
          log('Found an embedded image: ', 'debug', match);
        }
        if (
          match.groups &&
          match.groups['filename'] &&
          match.groups['extension']
        ) {
          const embedFolderAndFile = match.groups['filename'];
          const extension = match.groups['extension'];

          if (DEBUG_TRACE_GHOST_PUBLISHING) {
            log('Filename: ', 'debug', embedFolderAndFile);
            log('Extension: ', 'debug', extension);
          }

          const embedFullPath = `${embedFolderAndFile}.${extension}`;

          if (!post.embeds.has(embedFullPath)) {
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(
                'Could not match the found embedded image with one of the file embeds',
                'warn',
                match
              );
            }
            continue;
          }

          if (!embeddedImagesToUpload.has(embedFolderAndFile)) {
            if (DEBUG_TRACE_GHOST_PUBLISHING) {
              log(
                'Adding an image to the list of embedded images to upload',
                'debug',
                match
              );
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            embeddedImagesToUpload.set(
              embedFullPath,
              post.embeds.get(embedFullPath)!
            );
          }
        }
      }

      // // FIXME should
      // const token: marked.Tokens.Paragraph = {
      //   type: 'paragraph',
      //   text: src,
      //   raw: src,
      //   tokens: [],
      // };
      //
      // return token;

      return defaultParagraphHandler.bind(this)(src);
    };

    marked.use({
      tokenizer,
    });

    // TODO process the images, embeds and links
    const postProcessedContentAsHtml = marked(post.content);

    if (DEBUG_TRACE_GHOST_PUBLISHING) {
      log('HTML: ', 'debug', postProcessedContentAsHtml);
    }

    if (DEBUG_TRACE_GHOST_PUBLISHING) {
      log('Embedded images to upload', 'debug', embeddedImagesToUpload);
    }

    // FIXME replace the image with a link to the newly uploaded file
    // To find those we can look for: `![[${mapkey}]]` and replace that by an image tag
    // We could implement a custom tokenizer that replaces whatever, modifies the source before calling the default tokenizer
    for (const key of embeddedImagesToUpload.keys()) {
      const value = embeddedImagesToUpload.get(key);

      if (!value) {
        continue;
      }

      if (DEBUG_TRACE_GHOST_PUBLISHING) {
        log('Processing image embed: ', 'debug', key);
      }

      // TODO add support for mobile
      // Reference: https://github.com/dsebastien/obsidian-publisher/issues/49
      if (!value.absoluteFilePath) {
        if (DEBUG_TRACE_GHOST_PUBLISHING) {
          log(
            'Cannot upload image because the absolute path is not available',
            'debug',
            embeddedImagesToUpload
          );
        }
        continue;
      }

      if (DEBUG_TRACE_GHOST_PUBLISHING) {
        log('Uploading image...', 'debug');
      }

      const imageUploadData: GhostAdminApiImageUploadData = {
        file: value.absoluteFilePath,
        purpose: 'image',
        ref: key,
      };

      // FIXME enable
      // eslint-disable-next-line no-debugger
      try {
        const imageUploadResponse = await ghostApi.images.upload(
          imageUploadData
        );
        console.log(
          'Image upload response: ',
          JSON.stringify(imageUploadResponse)
        );
      } catch (error: unknown) {
        console.log('Failed: ', error);
      }

      // FIXME handle return value
    }

    //const tokens = marked.lexer(post.content);
    //console.log("Tokens: ", tokens);
    //const images = tokens.filter(token => token.type === 'image');
    //console.log("Images: ", images);
    //console.log(JSON.stringify(images));

    // FIXME remove
    throw new Error('Oops');

    // @ts-ignore
    const ghostPost: GhostPost = mapRawPostToGhostPost(
      post,
      postProcessedContentAsHtml
    );

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

  return retVal;
};
