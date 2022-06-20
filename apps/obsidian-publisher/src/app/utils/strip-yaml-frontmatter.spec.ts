import { stripYamlFrontMatter } from './strip-yaml-frontmatter';

describe('Strip YAML front matter', () => {
  it('should strip the front matter from the string', () => {
    const text =
      '---\ntags:\n  - lol\n  - deux\n  - trois\n  - quater\n  - cinq\n - \n---\n\n# Test\n\nHello world\n\n\n#cinq';
    const textWithoutFrontMatter = '# Test\n\nHello world\n\n\n#cinq';
    expect(stripYamlFrontMatter(text)).toBe(textWithoutFrontMatter);
  });

  it('should not touch the string if there is no front matter', () => {
    const text = '# Test\n\nHello world\n\n\n#cinq';
    const textWithoutFrontMatter = '# Test\n\nHello world\n\n\n#cinq';
    expect(stripYamlFrontMatter(text)).toBe(textWithoutFrontMatter);
  });
});
