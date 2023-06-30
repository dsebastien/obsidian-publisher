import { log } from '../utils/log';
import { isValidUrl } from '../utils/is-valid-url';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';

/**
 * Validate the Ghost configuration
 * @param ghostSettings the settings to validate
 */
export const isValidGhostConfiguration = (
  ghostSettings: OPublisherGhostSettings
): boolean => {
  log('Validating Ghost publication settings', 'debug');

  // Assume the configuration is valid until proven otherwise
  let retVal = true;

  log('Ghost API URL:', 'debug', ghostSettings.apiUrl);
  if (!isValidUrl(ghostSettings.apiUrl)) {
    log(`The Ghost API URL is invalid`, 'debug', ghostSettings.apiUrl);
    retVal = false;
  }

  log('Ghost Base URL:', 'debug', ghostSettings.apiUrl);
  if (!isValidUrl(ghostSettings.baseUrl)) {
    log(`The Ghost Base URL is invalid`, 'debug', ghostSettings.apiUrl);
    retVal = false;
  }

  if (
    !ghostSettings.adminToken ||
    ghostSettings.adminToken.trim().length === 0 ||
    !ghostSettings.adminToken.includes(':')
  ) {
    log(`The Ghost Admin Token is invalid`, 'debug', ghostSettings.adminToken);
    retVal = false;
  }
  return retVal;
};
