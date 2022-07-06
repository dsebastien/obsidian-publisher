import { isValidGhostConfiguration } from './is-valid-ghost-configuration';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';

describe('Is Valid Ghost configuration', () => {
  it('should accept valid configuration', () => {
    const configuration: OPublisherGhostSettings = {
      adminToken: 'a:b',
      apiUrl: 'https://www.google.com',
      enabled: true,
    };
    const result = isValidGhostConfiguration(configuration);
    expect(result).toBe(true);
  });

  it('should reject invalid configuration', () => {
    // Invalid admin token
    let configuration: OPublisherGhostSettings = {
      adminToken: 'a',
      apiUrl: 'https://www.google.com',
      enabled: true,
    };
    let result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // No admin token
    configuration = {
      adminToken: '',
      apiUrl: '',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // No base URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: '',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // No base URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: ' ',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // Invalid base URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: '@@@@!! foo',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);
  });
});
