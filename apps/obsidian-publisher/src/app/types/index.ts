import { FrontMatterCache, TFile } from 'obsidian';
import { OPublisherGhostSettings } from './opublisher-ghost-settings.intf';

export const OPublisherPostStatuses = [
  'draft',
  'published',
  'scheduled',
] as const;
export type OPublisherPostStatus = typeof OPublisherPostStatuses[number];

export interface OPublisherSettings {
  automaticPublication: boolean;
  ghostSettings: OPublisherGhostSettings;
}

export const DEFAULT_SETTINGS: OPublisherSettings = {
  automaticPublication: false,
  ghostSettings: {
    enabled: false,
    adminToken: '',
    apiUrl: '',
  },
};

const OPublisherPublishActions = ['publish', 'update'] as const;
export type OPublisherPublishAction = typeof OPublisherPublishActions[number];

export interface OPublisherPostMetadata {
  tags: string[];
  excerpt: string;
  slug: string;
  status: OPublisherPostStatus;
}

export interface OPublisherRawPost {
  /**
   * The id
   */
  id?: string | undefined;
  /**
   * The title
   */
  title: string;
  /**
   * The file contents (without the YAML front matter)
   */
  content: string;
  /**
   * Obsidian's front matter cache
   */
  frontMatter: FrontMatterCache;
  /**
   * The parsed metadata
   */
  metadata: OPublisherPostMetadata;
  /**
   * The action to perform for this file
   */
  publishAction: OPublisherPublishAction;
  /**
   * Full path to the file on disk
   */
  filePath: string;
  /**
   * Obsidian's representation of the file
   */
  file: TFile;
  /**
   * Last known update timestamp
   */
  updated_at?: string | undefined;
  // TODO add created_at and published_at
}

export interface OPublisherUpdatedPostDetails {
  id: string;
  url: string;
  updated_at: string;
}
