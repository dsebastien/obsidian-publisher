/**
 * Ghost settings
 */
export interface OPublisherGhostSettings {
  /**
   * Enable publishing to Ghost
   */
  enabled: boolean;
  /**
   * API URL of the Ghost Website
   */
  apiUrl: string;
  /**
   * Website base URL
   */
  baseUrl: string;
  /**
   * Admin Token to use
   */
  adminToken: string;
}
