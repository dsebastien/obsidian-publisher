import {
  OPublisherPublishAction,
  OPublisherRawPost,
  OPublisherSettings,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const matter = require('gray-matter');

import {
  MetadataCache,
  Notice,
  parseFrontMatterEntry,
  parseFrontMatterStringArray,
  parseFrontMatterTags,
  Vault,
} from 'obsidian';
import { log, LOG_PREFIX, LOG_SEPARATOR } from '../utils/log';
import { publishToGhost } from './publish-posts-to-ghost';
import { stripYamlFrontMatter } from '../utils/strip-yaml-frontmatter';
import { isValidOPublisherPostStatus } from './is-valid-opublisher-post-status';
import { isValidOPublisherPostSlug } from './is-valid-opublisher-post-slug';
import { isValidGhostConfiguration } from './is-valid-ghost-configuration';
import {
  NOTICE_TIMEOUT,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_EXCERPT,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_SLUG,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TAGS,
  OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TITLE,
} from '../constants';
import { assertUnreachable } from '../utils/assert-unreachable.fn';

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
  if (!settings.ghostSettings.enabled) {
    log(`Ghost publishing disabled`, 'debug');
    return;
  }

  log(
    `${LOG_PREFIX} Inspecting all the files in the vault to identify those that need to be published`,
    'debug'
  );
  // If some mandatory information can't be found, then we skip the file
  // Mandatory: opublisher_status, opublisher_slug
  const files = vault.getMarkdownFiles();
  const posts: OPublisherRawPost[] = [];

  for (const file of files) {
    log(LOG_SEPARATOR, 'debug');
    log(`Analyzing ${file.basename} (${file.path})`, 'debug'); // name: Test.md. basename: Test. extension: md

    // FIXME use matter to read the YAML metadata and explore it instead of Obsidian's cache
    const frontMatter = metadataCache.getFileCache(file)?.frontmatter;
    if (!frontMatter) {
      log(`Ignoring file as it does not contain YAML front matter`, 'debug');
      continue;
    }

    log(`Checking the post status`, 'debug');
    const status = parseFrontMatterEntry(
      frontMatter,
      OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS
    );
    if (!status) {
      log(
        `${LOG_PREFIX} Ignoring file as the YAML front matter does not include the mandatory '${OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_STATUS}' property`,
        'debug'
      );
      continue;
    } else if (!isValidOPublisherPostStatus(status)) {
      continue;
    } else {
      log(`Valid post status found`, 'debug');
    }

    // Read from disk to avoid working with stale data
    let content = await vault.read(file);

    content = stripYamlFrontMatter(content);
    log(`Contents`, 'debug', content);

    let title = file.basename;
    log(`Title`, 'debug', title);

    // Check for title override
    const titleOverride = parseFrontMatterEntry(
      frontMatter,
      OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TITLE
    );
    if (titleOverride && typeof titleOverride === 'string') {
      // Only accept title override if it is a string
      log(`Title override`, 'debug', titleOverride);
      title = titleOverride;
    }

    log(`Checking the post slug`, 'debug');
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
      log(`Valid slug found`, 'debug');
    }

    let tags: string[] = parseFrontMatterTags(frontMatter) ?? [];
    // Remove the '#' of each tag. We just need their name
    tags = tags.map((orig) => orig.replace('#', ''));
    log(`Tags`, 'debug', tags);

    // Check for tags override
    const tagsOverride: string[] | null = parseFrontMatterStringArray(
      frontMatter,
      OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_TAGS,
      true
    );
    if (tagsOverride) {
      log(`Tags override`, 'debug', tagsOverride);
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
    log(`Excerpt`, 'debug', excerpt);

    const ghostPostUrl: string | undefined =
      parseFrontMatterEntry(
        frontMatter,
        OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL
      ) || '';
    log(`Ghost post URL`, 'debug', ghostPostUrl);

    // By default, we publish
    let actionToPerform: OPublisherPublishAction = 'publish';

    if (ghostPostUrl) {
      actionToPerform = 'update';
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
    };

    switch (actionToPerform) {
      case 'publish':
        log(
          `${LOG_PREFIX} Found a note to publish: ${file.basename} (Path: ${file.path})`,
          'debug',
          postToPublishOrUpdate
        );
        break;
      case 'update':
        log(
          `${LOG_PREFIX} Found a note to update (if needed): ${file.basename} (Path: ${file.path})`,
          'debug',
          postToPublishOrUpdate
        );

        // FIXME implement
        // Make sure that the update is actually needed
        // Otherwise continue
        // To check: compare the hash to the content
        // For now we simply skip those as we don't handle the scenario yet
        continue;
      //break;
      default:
        assertUnreachable(actionToPerform);
    }

    posts.push(postToPublishOrUpdate);
    log(`Added post to publish queue`, 'debug', postToPublishOrUpdate);
    log(LOG_SEPARATOR, 'debug');
  }

  if (posts.length === 0) {
    new Notice(
      `${LOG_PREFIX} Could not find any note to publish. Make sure that you have added the necessary YAML metadata to your notes`,
      NOTICE_TIMEOUT
    );
    return;
  }

  log(`Performing validations before publishing`, 'debug');

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

  if (settings.ghostSettings.enabled) {
    if (isValidGhostConfiguration(settings.ghostSettings)) {
      try {
        const ghostPublicationResults = await publishToGhost(
          posts,
          settings.ghostSettings
        );

        log(`Updating Ghost post metadata in Obsidian notes`, 'debug');
        for (const post of posts) {
          const updatedPost = ghostPublicationResults.get(post.metadata.slug);
          if (!updatedPost) {
            continue;
          }

          log(`${LOG_SEPARATOR}`, 'debug');
          log(
            `Updating Ghost post metadata in Obsidian for ${post.title} (${post.filePath})`,
            'debug'
          );
          log(`File path`, 'debug', post.filePath);

          // Read from disk to avoid working with stale data
          const updatedFile = await vault.read(post.file);
          //const updatedContent = stripYamlFrontMatter(updatedFile);
          const parsedFile = matter(updatedFile);
          log(`Content`, 'debug', parsedFile.content);

          if (post.publishAction === 'publish') {
            parsedFile.data[OBSIDIAN_PUBLISHER_FRONT_MATTER_KEY_GHOST_URL] =
              updatedPost.url;

            // Next calculate hash of the content

            log(`Post metadata before`, 'debug', post.frontMatter);
            log(`Post metadata after`, 'debug', parsedFile.data);

            log(`Post file contents before`, 'debug', parsedFile.data);

            const updatedFileContents = matter.stringify(
              parsedFile,
              parsedFile.data
            );
            log(`Updated post`, 'debug', updatedFileContents);

            try {
              await vault.modify(post.file, updatedFileContents);
              log(
                `Note updated successfully. It now includes the Ghost post metadata`,
                'debug',
                updatedFileContents
              );
            } catch (error: unknown) {
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
    } else {
      new Notice(
        `${LOG_PREFIX} The Ghost settings are invalid. Please fix the plugin configuration and try again`,
        NOTICE_TIMEOUT
      );
    }
  }
};
