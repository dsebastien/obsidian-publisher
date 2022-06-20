/**
 * Ghost settings
 */
export interface OPublisherGhostSettings {
  /**
   * Enable publishing to Ghost
   */
  enabled: boolean;
  /**
   * Base URL of the Ghost Website
   */
  baseUrl: string;
  /**
   * Admin Token to use
   */
  adminToken: string;
}
