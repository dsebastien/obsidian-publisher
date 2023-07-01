import {OPublisherCloudinarySettings} from "../types/opublisher-cloudinary-settings.intf";
import {isValidCloudinaryConfiguration} from "./is-valid-cloudinary-configuration";

describe('Is Valid Cloudinary configuration', () => {
  it('should accept valid configuration', () => {
    const configuration: OPublisherCloudinarySettings = {
      cloudName: 'foo',
      apiKey: 'bar',
      apiSecret: 'baz',
      enabled: true,
    };
    const result = isValidCloudinaryConfiguration(configuration);
    expect(result).toBe(true);
  });

  it('should reject invalid configuration', () => {
    // Invalid cloudName token
    let configuration: OPublisherCloudinarySettings = {
      cloudName: '',
      apiKey: 'bar',
      apiSecret: 'baz',
      enabled: true,
    };
    let result = isValidCloudinaryConfiguration(configuration);
    expect(result).toBe(false);

    // No API key
    configuration = {
      cloudName: 'foo',
      apiKey: '',
      apiSecret: 'baz',
      enabled: true,
    };
    result = isValidCloudinaryConfiguration(configuration);
    expect(result).toBe(false);

    // No API secret
    configuration = {
      cloudName: 'foo',
      apiKey: 'bar',
      apiSecret: '',
      enabled: true,
    };
    result = isValidCloudinaryConfiguration(configuration);
    expect(result).toBe(false);
  });
});
