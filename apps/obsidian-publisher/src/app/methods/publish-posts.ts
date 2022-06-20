import {
  OPublisherPublishAction,
  OPublisherRawPost,
  OPublisherSettings,
} from '../types';

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

/**
 * Identify the posts to publish, and trigger their publication
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
    log('Ghost publishing disabled', 'debug');
    return;
  }

  log(
    'Inspecting all the files in the vault to identify those that need to be published',
    'debug'
  );
  // If some mandatory information can't be found, then we skip the file
  // Mandatory: opublisher_status, opublisher_slug
  const files = vault.getFiles();
  const posts: OPublisherRawPost[] = [];

  for (const file of files) {
    log(LOG_SEPARATOR, 'debug');
    log(`Analyzing ${file.basename} (${file.path})`, 'debug'); // name: Test.md. basename: Test. extension: md

    const frontMatter = metadataCache.getFileCache(file)?.frontmatter;
    if (!frontMatter) {
      log(`Ignoring file as it does not contain YAML front matter`, 'debug');
      continue;
    }
    //log('Front matter:', 'debug', JSON.stringify(frontMatter));

    log('Checking the post status', 'debug');
    const postStatus = parseFrontMatterEntry(frontMatter, 'opublisher_status');
    if (!postStatus) {
      log(
        `Ignoring file as the YAML front matter does not include the mandatory opublisher_status property`,
        'debug'
      );
      continue;
    } else if (!isValidOPublisherPostStatus(postStatus)) {
      continue;
    } else {
      log(`Valid post status found`, 'debug');
    }

    log('Checking the post slug', 'debug');
    const slug = parseFrontMatterEntry(frontMatter, 'opublisher_slug');
    if (!slug) {
      log(
        `Ignoring file as the YAML front matter does not include the mandatory opublisher_slug property`,
        'debug'
      );
      continue;
    } else if (!isValidOPublisherPostSlug(slug)) {
      continue;
    } else {
      log(`Valid slug found`, 'debug');
    }

    let content = await vault.cachedRead(file);
    content = stripYamlFrontMatter(content);
    log('Contents:', 'debug', content);

    let title = file.basename;
    log('Title', 'debug', title);

    // Check for title override
    const titleOverride = parseFrontMatterEntry(
      frontMatter,
      'opublisher_title'
    );
    if (titleOverride && typeof titleOverride === 'string') {
      // Only accept title override if it is a string
      log('Title override:', 'debug', titleOverride);
      title = titleOverride;
    }

    let tags: string[] = parseFrontMatterTags(frontMatter) ?? [];
    // Remove the '#' of each tag. We just need their name
    tags = tags.map((orig) => orig.replace('#', ''));
    log('Tags:', 'debug', tags);

    // Check for tags override
    const tagsOverride: string[] | null = parseFrontMatterStringArray(
      frontMatter,
      'opublisher_tags',
      true
    );
    if (tagsOverride) {
      log('Tags override:', 'debug', tagsOverride);
      tags = tagsOverride;
    }

    let excerpt =
      parseFrontMatterEntry(frontMatter, 'opublisher_excerpt') || '';
    if (typeof excerpt !== 'string') {
      // Make sure that the excerpt is always a string
      excerpt = '';
    }
    log('Excerpt:', 'debug', excerpt);

    const publishAction: OPublisherPublishAction = 'publish';

    const postToPublish: OPublisherRawPost = {
      title,
      content,
      metadata: {
        excerpt,
        slug,
        tags,
      },
      frontMatter,
      publishAction,
    };

    if (publishAction === 'publish') {
      log(
        `Found a note to publish: ${file.basename} (Path: ${file.path})`,
        'debug',
        postToPublish
      );
    }

    posts.push(postToPublish);
    log('Added post to publish queue:', 'debug', postToPublish);
    log(LOG_SEPARATOR, 'debug');
  }

  if (posts.length === 0) {
    new Notice(
      `${LOG_PREFIX} Could not find any note to publish. Make sure that you have added the necessary YAML metadata to your notes`,
      3000
    );
    return;
  }

  new Notice(
    `${LOG_PREFIX} Found ${posts.length} notes to publish. Proceeding...`,
    3000
  );

  if (settings.ghostSettings.enabled) {
    if (isValidGhostConfiguration(settings.ghostSettings)) {
      await publishToGhost(posts, settings.ghostSettings);
    } else {
      new Notice(
        `${LOG_PREFIX} The Ghost settings are invalid. Please fix the plugin configuration and try again`,
        3000
      );
    }
  }
};
