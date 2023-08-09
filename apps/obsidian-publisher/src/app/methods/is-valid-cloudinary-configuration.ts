import { log } from '../utils/log';
import { OPublisherCloudinarySettings } from '../types/opublisher-cloudinary-settings.intf';

/**
 * Validate the Cloudinary configuration
 * @param cloudinarySettings the settings to validate
 */
export const isValidCloudinaryConfiguration = (
  cloudinarySettings: OPublisherCloudinarySettings
): boolean => {
  log('Validating Cloudinary settings', 'debug');

  // Assume the configuration is valid until proven otherwise
  let retVal = true;

  log('Cloudinary cloud name:', 'debug', cloudinarySettings.cloudName);
  if (
    !cloudinarySettings.cloudName ||
    cloudinarySettings.cloudName.trim().length === 0
  ) {
    log(`The cloud name is invalid`, 'debug', cloudinarySettings.cloudName);
    retVal = false;
  }

  if (
    !cloudinarySettings.apiKey ||
    cloudinarySettings.apiKey.trim().length === 0
  ) {
    log(`The API key is invalid`, 'debug');
    retVal = false;
  }

  if (
    !cloudinarySettings.apiSecret ||
    cloudinarySettings.apiSecret.trim().length === 0
  ) {
    log(`The API secret is invalid`, 'debug');
    retVal = false;
  }

  return retVal;
};
