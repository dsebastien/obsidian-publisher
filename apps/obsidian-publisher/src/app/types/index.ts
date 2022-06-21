import { FrontMatterCache } from 'obsidian';
import { OPublisherGhostSettings } from './opublisher-ghost-settings.intf';
import { OPublisherPostStatus } from '../methods/is-valid-opublisher-post-status';

export interface OPublisherSettings {
  automaticPublication: boolean;
  ghostSettings: OPublisherGhostSettings;
}

export const DEFAULT_SETTINGS: OPublisherSettings = {
  automaticPublication: false,
  ghostSettings: {
    enabled: false,
    adminToken: '',
    baseUrl: '',
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
