import {
  FileDetails,
  FileEmbed,
  InternalLink, LinkToMap, OPublisherNoteHash, OPublisherPostStatus,
  OPublisherPublishAction,
  OPublisherRawPost,
  OPublisherSettings,
} from '../types';
import {UploadApiResponse, v2 as cloudinary} from 'cloudinary';

import {
  EmbedCache,
  FileSystemAdapter,
  getLinkpath,
  MetadataCache,
  Notice,
  parseFrontMatterEntry,
  parseFrontMatterStringArray,
  parseFrontMatterTags,
  Vault,
} from 'obsidian';
import {log, LOG_PREFIX, LOG_SEPARATOR} from '../utils/log';
import {publishToGhost} from './publish-posts-to-ghost';
import {stripYamlFrontMatter} from '../utils/strip-yaml-frontmatter';
import {isValidOPublisherPostStatus} from './is-valid-opublisher-post-status';
import {isValidOPublisherPostSlug} from './is-valid-opublisher-post-slug';
import {isValidGhostConfiguration} from './is-valid-ghost-configuration';
import {
  DEBUG_TRACE_PUBLISHING_PREPARATION,
  DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING,
  IMAGE_REGEX, MARKDOWN_EXTENSION,
  NOTICE_TIMEOUT,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_EXCERPT,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_ID,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_UPDATED_AT,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_NOTE_HASH,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_SLUG,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TAGS,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TITLE,
} from '../constants';
import {assertUnreachable} from '../utils/assert-unreachable.fn';
import produce from 'immer';
import {isValidCloudinaryConfiguration} from "./is-valid-cloudinary-configuration";
import {isMarkdownLink} from "../utils/is-markdown-link";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const matter = require('gray-matter');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const hash = require('object-hash');

/**
 * Identify the posts to publish, and trigger their publication based on the settings and metadata
 * @param vault the Obsidian vault
 * @param metadataCache the Obsidian metadata cache
 * @param settings the plugin settings
 */
export const publishPosts = async (
  vault: Vault,
  metadataCache: MetadataCache,
  settings: OPublisherSettings
) => {
  if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
    log(
      `Inspecting all the files in the vault to identify those that need to be published`,
      'debug'
    );
  }

  // If some mandatory information can't be found, then we skip the file
  // Mandatory: opublisher_status, opublisher_slug
  const files = vault.getMarkdownFiles();
  const posts: OPublisherRawPost[] = [];

  /**
   * Map of files in the vault
   * The key is the file link, which is the path to the file with its extension
   * Example: foo/bar/file.md
   */
  const filesMap: Map<string, FileDetails> = new Map<string, FileDetails>();

  for (const file of files) {
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(LOG_SEPARATOR, 'debug');
      log(`Analyzing ${file.basename} (${file.path})`, 'debug'); // name: Test.md. basename: Test. extension: md
    }

    const fileCache = metadataCache.getFileCache(file);

    // Fill the files map
    filesMap.set(file.path, {
      file,
      fileCache,
    })

    // TODO use matter to read the YAML metadata and explore it instead of Obsidian's cache
    const frontMatter = fileCache?.frontmatter;
    if (!frontMatter) {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(`Ignoring file as it does not contain YAML front matter`, 'debug');
      }
      continue;
    }

    const embedsMetadata =
      fileCache && fileCache.embeds ? fileCache.embeds : ([] as EmbedCache[]);
    const embeds: Map<string, FileEmbed> = new Map<string, FileEmbed>();

    // Keep track of (image) embeds that were successfully uploaded
    const successfullyUploadedImageEmbeds: Map<string, UploadApiResponse> = new Map<string, UploadApiResponse>();

    for (const embedMetadata of embedsMetadata) {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(`Loading embeds contents`, 'debug');
      }

      // WARNING: This finds references to embeds relative to the given file, whether they're at the root or elsewhere
      const matchingFile = app.metadataCache.getFirstLinkpathDest(getLinkpath(embedMetadata.link), file.path);

      if (!matchingFile) {
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log('Could not find one of the embeds!', 'warn', embedMetadata.link);
        }
        continue;
      } else {
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log('Found the embed file: ', 'debug', matchingFile);
        }
      }

      const embedContents = await vault.readBinary(matchingFile);

      // We try to get a hold of the full file path. This works on desktop only
      // Reference: https://github.com/dsebastien/obsidian-publisher/issues/49
      let embedAbsoluteFilePath = null;
      if (vault.adapter instanceof FileSystemAdapter) {
        embedAbsoluteFilePath = vault.adapter.getFullPath(matchingFile.path);
      }

      embeds.set(embedMetadata.link, {
        metadata: embedMetadata,
        contents: embedContents,
        filename: matchingFile.name,
        absoluteFilePath: embedAbsoluteFilePath,
      });
    }

    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`File embeds: `, 'debug', embeds);
    }

    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Checking the post status`, 'debug');
    }
    const status = parseFrontMatterEntry(
      frontMatter,
      OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS
    );
    if (!status) {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(
          `Ignoring file as the YAML front matter does not include the mandatory '${OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS}' property`,
          'debug'
        );
      }
      continue;
    } else if (!isValidOPublisherPostStatus(status)) {
      continue;
    } else {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(`Valid post status found`, 'debug');
      }
    }

    // Read from disk to avoid working with stale data
    let content = await vault.read(file);

    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Contents`, 'debug', content);
    }

    let title = file.basename;
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Title`, 'debug', title);
    }

    // Check for title override
    const titleOverride = parseFrontMatterEntry(
      frontMatter,
      OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TITLE
    );
    if (titleOverride && typeof titleOverride === 'string') {
      // Only accept title override if it is a string
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(`Title override`, 'debug', titleOverride);
      }
      title = titleOverride;
    }

    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Checking the post slug`, 'debug');
    }
    // WARNING: Important to turn the value to undefined instead of null here
    const slug: string | undefined =
      parseFrontMatterEntry(
        frontMatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_SLUG
      ) ?? undefined;
    if (!slug) {
      new Notice(
        `${LOG_PREFIX} The '${OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_SLUG}' property is missing for ${file.name} (${file.path}). Fix the issue if you want to publish it. Aborting`,
        NOTICE_TIMEOUT
      );
      continue;
    } else if (!isValidOPublisherPostSlug(slug)) {
      new Notice(
        `${LOG_PREFIX} The '${OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_SLUG}' property is invalid for ${file.name} (${file.path}). Fix the issue if you want to publish it. Aborting`,
        NOTICE_TIMEOUT
      );
      continue;
    } else {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(`Valid slug found`, 'debug');
      }
    }

    let tags: string[] = parseFrontMatterTags(frontMatter) ?? [];
    // Remove the '#' of each tag. We just need their name
    tags = tags.map((orig) => orig.replace('#', ''));
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Tags`, 'debug', tags);
    }

    // Check for tags override
    const tagsOverride: string[] | null = parseFrontMatterStringArray(
      frontMatter,
      OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TAGS,
      true
    );
    if (tagsOverride) {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(`Tags override`, 'debug', tagsOverride);
      }
      tags = tagsOverride;
    }

    let excerpt =
      parseFrontMatterEntry(
        frontMatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_EXCERPT
      ) || '';
    if (typeof excerpt !== 'string') {
      // Make sure that the excerpt is always a string
      excerpt = '';
    }
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Excerpt`, 'debug', excerpt);
    }

    const ghostPostUrl: string | undefined =
      parseFrontMatterEntry(
        frontMatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL
      ) || '';
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Ghost post URL`, 'debug', ghostPostUrl);
    }

    const ghostPostId: string | undefined =
      parseFrontMatterEntry(
        frontMatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_ID
      ) || '';
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Ghost post ID`, 'debug', ghostPostId);
    }

    const ghostPostUpdatedAt: string | undefined =
      parseFrontMatterEntry(
        frontMatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_UPDATED_AT
      ) || '';
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Ghost post updated at`, 'debug', ghostPostUpdatedAt);
    }

    // By default, we publish
    let actionToPerform: OPublisherPublishAction = 'publish';

    if (ghostPostUrl && ghostPostId) {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log(
          `The post has an ID and URL. It might need to be updated`,
          'debug',
          ghostPostId
        );
      }
      actionToPerform = 'update';
    }

    // Upload embedded images to Cloudinary if needed
    if (settings.cloudinarySettings.enabled) {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log('Cloudinary upload is enabled. Validating configuration...', 'debug');
      }

      if (!isValidCloudinaryConfiguration(settings.cloudinarySettings)) {
        new Notice(
          `${LOG_PREFIX} The Cloudinary settings are invalid. Please fix the plugin configuration and try again`,
          NOTICE_TIMEOUT
        );
        return;
      }

      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log('Configuring Cloudinary', 'debug');
      }

      cloudinary.config({
        cloud_name: settings.cloudinarySettings.cloudName,
        api_key: settings.cloudinarySettings.apiKey,
        api_secret: settings.cloudinarySettings.apiSecret,
      });

      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log('Looking for image embeds to upload to Cloudinary', 'debug');
      }

      for (const embed of embeds.entries()) {
        if (!embed[0].match(IMAGE_REGEX)) {
          if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
            log(`Skipping embed as it is not an image: `, 'debug', embed[0]);
          }
          continue;
        }

        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log('Uploading image embed to Cloudinary: ', 'debug', embed[0]);
        }

        // TODO add support for mobile
        // Reference: https://github.com/dsebastien/obsidian-publisher/issues/49
        const imageEmbedAbsoluteFilePath = embed[1].absoluteFilePath;

        if (imageEmbedAbsoluteFilePath === null) {
          if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
            log('Skipping image upload because the absolute path is not available', 'debug');
          }
          continue;
        }

        await cloudinary.uploader.upload(imageEmbedAbsoluteFilePath, {
          public_id: embed[0],
        }, (error, result) => {
          if (error) {
            if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
              log('Failed to upload the image', 'debug', error);
            }
          } else if (result && result.url) {
            if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
              log('Image uploaded successfully', 'debug', result);
            }
            // Keep track of the successfully uploaded images
            successfullyUploadedImageEmbeds.set(embed[0], result);
          }
        });
      }

      await successfullyUploadedImageEmbeds.forEach((value, key, _map) => {
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log('Updating content for successfully uploaded image embed', 'debug', value.url);
        }
        // Replace the existing image file embed with a link to the image that was uploaded to Cloudinary
        content = content.replaceAll(`![[${key}]]`, `<img src="${value.url}" />`);
        vault.modify(file, content);
      });
    }

    content = stripYamlFrontMatter(content);

    const internalLinks: InternalLink[] = [];

    const fileLinks = fileCache.links;

    // If there are links, process each of those
    fileLinks?.forEach((fileLink ) => {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log('Collecting information about the following link: ', 'debug', fileLink);
      }

      // Add the extension to have the full path to the link
      // We will use it as a key to find it back when needed
      const fullFilename = fileLink.link.endsWith(`.${MARKDOWN_EXTENSION}`)? fileLink.link: `${fileLink.link}.${MARKDOWN_EXTENSION}`;

      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log('Looking for the file matching the following link: ', 'debug', fullFilename);
      }

      let matchingFile: FileDetails | undefined = filesMap.get(fullFilename);

      // If it wasn't found, then we are optimistic
      if(!matchingFile) {
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log('No file found matching the link. The link is probably pointing to a uniquely named note present in a sub-folder', 'debug');
        }

        let foundMatches = 0;
        for(const fileKey of filesMap.keys()) {
          if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
            log('File key: ', 'debug', fileKey);
          }

          if(fileKey.contains(fullFilename)) {
            if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
              log('Found a matching file for the link: ', 'debug', fileKey);
            }

            foundMatches += 1;
            matchingFile = filesMap.get(fileKey)
          }
        }

        if(foundMatches > 1) {
          if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
            log('Found multiple matching files for the link. Difficult to identify which one is the correct one. Taking the last one, with key: ', 'debug', matchingFile);
          }
        }
      }

      log("File map: ", "debug", filesMap);

      let cachedMetadataOfMatchingFile = undefined;
      if(matchingFile) {
        const foundMetadataForMatchingFile = metadataCache.getFileCache(matchingFile.file);
        if(foundMetadataForMatchingFile) {
          cachedMetadataOfMatchingFile = foundMetadataForMatchingFile;
        }
      }

      const internalLink: InternalLink = {
        linkCache: fileLink,
        fileDetails: matchingFile,
        fileMetadata: cachedMetadataOfMatchingFile,
      };

      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log('Internal link: ', 'debug', internalLink);
      }

      // Keep the identified internal link, whether it points to an existing file or not
      internalLinks.push(internalLink);
    });

    const linksToMap: LinkToMap[] = [];

    for(const link of internalLinks) {
      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log("Link to process: ", "debug", link);
      }

      let linkRemoved = false;

      if (!link.fileDetails || !link.fileMetadata || !link.fileMetadata.frontmatter || (link.linkCache.displayText && link.linkCache.displayText === '')) {
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log("Removing a link that points to a note that does not exist or that does not have the expected metadata: ", "debug", link);
        }

        linkRemoved = true;

        // If there is no display text and it looks like a Markdown link, then we just remove the link altogether
        // We expect those to correspond to internal Markdown links
        if(link.linkCache.displayText === '' && link.linkCache.link.endsWith('.md')) {
          if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
            log("Identified what looks like an internal Markdown link: ", "debug", link);
          }

          content = content.replaceAll(link.linkCache.original, '');
          continue;
        }

        content = content.replaceAll(link.linkCache.original, link.linkCache.displayText? link.linkCache.displayText: link.linkCache.link);
        continue;
      }

      const linkedNoteStatus = parseFrontMatterEntry(
        link.fileMetadata.frontmatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS
      );

      const linkedNoteSlug = parseFrontMatterEntry(
        link.fileMetadata.frontmatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_SLUG
      );

      const linkedNoteTitle = parseFrontMatterEntry(
        link.fileMetadata.frontmatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TITLE
      );

      if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
        log("Linked note slug: ", 'debug', linkedNoteSlug);
        log("Linked note title: ", 'debug', linkedNoteTitle);
        log("Linked note status: ", "debug", linkedNoteStatus);
      }

      // If the link does not point to a note that should be published or scheduled, then we remove it as well
      if(!linkedNoteStatus || linkedNoteStatus as OPublisherPostStatus !== 'published' && linkedNoteStatus as OPublisherPostStatus !== 'scheduled') {
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log("Removing a link that points to a note that won't be published or scheduled: ", "debug", link);
        }
        linkRemoved = true;
        content = content.replaceAll(link.linkCache.original, link.linkCache.displayText? link.linkCache.displayText: link.linkCache.link);
      }

      // If the link does not point to a note that has a slug, then we remove it as well
      if(!linkedNoteSlug) {
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log("Removing a link that points to a note that does not have a configured slug: ", "debug", link);
        }
        linkRemoved = true;
        content = content.replaceAll(link.linkCache.original, link.linkCache.displayText? link.linkCache.displayText: link.linkCache.link);
      }

      // Note: the linked note title is not mandatory, it's just used as an alternative text if there is no display text on the link

      // The link hasn't been removed, so we need to post-process it
      // We keep the link details along with the identified slug
      if(!linkRemoved) {
        linksToMap.push({
          ...link,
          slug: linkedNoteSlug,
          alternativeTitle: linkedNoteTitle,
          markdownLink: isMarkdownLink(link.linkCache.original),
        });
      }
    }

    const postToPublishOrUpdate: OPublisherRawPost = {
      title,
      content,
      metadata: {
        excerpt,
        slug,
        tags,
        status,
      },
      frontMatter,
      publishAction: actionToPerform,
      filePath: file.path,
      file,
      embeds,
      linksToMap,
    };

    // The id of the post only makes sense if the post was already published
    if (ghostPostId) {
      postToPublishOrUpdate.id = ghostPostId;
    }

    // The updated at field of the post only makes sense if the post was already published
    if (ghostPostUpdatedAt) {
      postToPublishOrUpdate.updated_at = ghostPostUpdatedAt;
    }

    switch (actionToPerform) {
      case 'publish':
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log(
            `Found a note to publish: ${file.basename} (Path: ${file.path})`,
            'debug',
            postToPublishOrUpdate
          );
        }
        posts.push(postToPublishOrUpdate);
        break;
      case 'update':
        if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
          log(
            `Found a potential note to update: ${file.basename} (Path: ${file.path}). Verifying if it needs to be updated`,
            'debug',
            postToPublishOrUpdate
          );
        }

        // TODO Make sure that the update is actually needed: https://github.com/dsebastien/obsidian-publisher/issues/45
        posts.push(postToPublishOrUpdate);

        continue;
      //break;
      default:
        assertUnreachable(actionToPerform);
    }

    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Added post to publish queue`, 'debug', postToPublishOrUpdate);
      log(LOG_SEPARATOR, 'debug');
    }
  }

  if (posts.length === 0) {
    new Notice(
      `${LOG_PREFIX} Could not find any note to publish. Make sure that you have added the necessary YAML metadata to your notes`,
      NOTICE_TIMEOUT
    );
    return;
  }

  if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
    log(`Performing validations before publishing`, 'debug');
  }

  for (const post of posts) {
    // Reject notes with identical slugs
    if (
      posts.filter((postToCompareTo) => {
        return (
          post.metadata.slug === postToCompareTo.metadata.slug &&
          post.filePath !== postToCompareTo.filePath
        );
      }).length > 0
    ) {
      new Notice(
        `${LOG_PREFIX} Publish operation cancelled. Found at least two notes with the same slug: ${post.metadata.slug}. Fix the issue and try again.`,
        NOTICE_TIMEOUT
      );
      return;
    }

    // Reject posts with identical titles
    if (
      posts.filter((postToCompareTo) => {
        return (
          post.title === postToCompareTo.title &&
          post.filePath !== postToCompareTo.filePath
        );
      }).length > 0
    ) {
      new Notice(
        `${LOG_PREFIX} Publish operation cancelled. Found at least two notes with the same title: ${post.title}. Fix the issue and try again.`,
        NOTICE_TIMEOUT
      );
      return;
    }
  }

  new Notice(
    `${LOG_PREFIX} Found ${posts.length} note(s) to publish. Proceeding...`,
    NOTICE_TIMEOUT
  );

  if (!settings.ghostSettings.enabled) {
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log("Ghost publishing is disabled. Aborting", "debug");
    }
    return;
  }

  if (!isValidGhostConfiguration(settings.ghostSettings)) {
    new Notice(
      `${LOG_PREFIX} The Ghost settings are invalid. Please fix the plugin configuration and try again`,
      NOTICE_TIMEOUT
    );
    return;
  }

  try {
    if (DEBUG_TRACE_PUBLISHING_PREPARATION) {
      log(`Publishing to Ghost`, 'debug');
    }
    const ghostPublicationResults = await publishToGhost(
      posts,
      settings.ghostSettings
    );

    if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
      log(`Updating Ghost post metadata in Obsidian notes`, 'debug');
    }
    for (const post of posts) {
      const updatedPost = ghostPublicationResults.get(post.metadata.slug);
      if (!updatedPost) {
        continue;
      }

      if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
        log(
          `Updating Ghost post metadata in Obsidian for the note called "${post.title}" (${post.filePath})`,
          'debug'
        );
        log(`File path`, 'debug', post.filePath);
      }

      // Read from disk to avoid working with stale data
      const updatedFile = await vault.read(post.file);
      const parsedFile = matter(updatedFile);
      if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
        log(`New note contents`, 'debug', parsedFile.content);
      }

      if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
        log(`Saving the post ID, URL and last updated at`, 'debug');
      }
      parsedFile.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL] =
        updatedPost.url;
      parsedFile.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_ID] =
        updatedPost.id;
      parsedFile.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_UPDATED_AT] =
        updatedPost.updated_at;
      // FIXME if this is not defined at this point, then the line that sets the actual value does not work for some reason
      parsedFile.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_NOTE_HASH] =
        '<temporary>';

      const dataToHash = produce<OPublisherNoteHash>(
        {
          data: parsedFile.data,
          content: parsedFile.content,
          excerpt: parsedFile.excerpt,
        }, // We only extract the parts we care about from the parsed file
        (draft) => {
          // The hash is excluded from the hash calculation
          delete draft.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_NOTE_HASH];
        }
      );

      if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
        log(`Data to hash`, 'debug', dataToHash);
      }

      // https://www.npmjs.com/package/object-hash
      // hash((data (metadata without the hash if present) + content + excerpt))
      const newHash = hash(dataToHash);

      if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
        log(`New note hash`, 'debug', newHash);
        log(`Storing the new hash`, 'debug');
      }

      // Keep the new hash
      parsedFile.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_NOTE_HASH] =
        newHash;
      log(
        `Stored hash`,
        'debug',
        parsedFile.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_NOTE_HASH]
      );

      // if action = update and NO hash => warn + skip ==> think about what the user could or should do

      if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
        log(`Post metadata before`, 'debug', post.frontMatter);
        log(`Post metadata after`, 'debug', parsedFile.data);

        log(`Post file contents before`, 'debug', parsedFile.data);
      }
      const updatedFileContents = matter.stringify(
        parsedFile,
        parsedFile.data
      );
      if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
        log(`Post file contents after`, 'debug', updatedFileContents);
      }

      try {
        await vault.modify(post.file, updatedFileContents);
        if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
          log(`Note updated successfully`, 'debug', updatedFileContents);
        }
      } catch (error: unknown) {
        if (DEBUG_TRACE_PUBLISHING_RESULTS_HANDLING) {
          log(`Failed to updated the note`, 'error', error);
        }
      }
    }
  } catch (error: unknown) {
    new Notice(
      `${LOG_PREFIX} An error occurred while publishing notes to Ghost. Please try again later. Details: ${error}`,
      NOTICE_TIMEOUT
    );
  }

  return new Promise(() => 0);
};
