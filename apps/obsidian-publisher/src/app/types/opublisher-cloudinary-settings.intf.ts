/**
 * Cloudinary settings
 */
export interface OPublisherCloudinarySettings {
  /**
   * Enable uploading images to Cloudinary
   */
  enabled: boolean;
  /**
   * The account name
   */
  cloudName: string;
  /**
   * The API key
   */
  apiKey: string;
  /**
   * The API secret
   */
  apiSecret: string;
}
