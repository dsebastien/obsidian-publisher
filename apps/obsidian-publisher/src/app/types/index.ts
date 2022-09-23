import { FrontMatterCache } from 'obsidian';
import { OPublisherGhostSettings } from './opublisher-ghost-settings.intf';

export const OPublisherPostStatuses = ['draft', 'published', 'scheduled'] as const;
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
  slug?: string;
  status: OPublisherPostStatus;
}

export interface OPublisherRawPost {
  title: string;
  content: string;
  frontMatter: FrontMatterCache;
  metadata: OPublisherPostMetadata;
  publishAction: OPublisherPublishAction;
  filePath: string;
}
