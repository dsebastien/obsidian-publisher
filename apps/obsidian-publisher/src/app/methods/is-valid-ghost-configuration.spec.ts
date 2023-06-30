import { isValidGhostConfiguration } from './is-valid-ghost-configuration';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';

describe('Is Valid Ghost configuration', () => {
  it('should accept valid configuration', () => {
    const configuration: OPublisherGhostSettings = {
      adminToken: 'a:b',
      apiUrl: 'https://www.google.com',
      baseUrl: 'https://www.google.com',
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
      baseUrl: 'https://www.google.com',
      enabled: true,
    };
    let result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // No admin token
    configuration = {
      adminToken: '',
      apiUrl: '',
      baseUrl: '',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // No base URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: '',
      baseUrl: '',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // No API URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: ' ',
      baseUrl: 'https://www.google.com',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // Invalid API URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: '@@@@!! foo',
      baseUrl: 'https://www.google.com',
      enabled: true,
    };

    // No base URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: 'https://www.google.com',
      baseUrl: ' ',
      enabled: true,
    };
    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);

    // Invalid base URL
    configuration = {
      adminToken: 'a:b',
      apiUrl: 'https://www.google.com',
      baseUrl: '@@@@!! foo',
      enabled: true,
    };

    result = isValidGhostConfiguration(configuration);
    expect(result).toBe(false);
  });
});
