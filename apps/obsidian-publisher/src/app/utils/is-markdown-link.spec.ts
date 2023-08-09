import { isMarkdownLink } from './is-markdown-link';

describe('Is Markdown link', () => {
  it('should accept URL markdown links', () => {
    const text = '[lol](https://www.google.com)';
    expect(isMarkdownLink(text)).toBe(true);
  });

  it('should accept Obsidian markdown links', () => {
    const text = '[lol](test.md)';
    expect(isMarkdownLink(text)).toBe(true);
  });

  it('should accept absolute Obsidian markdown links', () => {
    const text = '[lol](Test/Other/test.md)';
    expect(isMarkdownLink(text)).toBe(true);
  });

  it('should reject invalid links', () => {
    let text = 'foo';
    expect(isMarkdownLink(text)).toBe(false);

    text = '[foo]';
    expect(isMarkdownLink(text)).toBe(false);

    text = '[]()';
    expect(isMarkdownLink(text)).toBe(false);

    text = '()';
    expect(isMarkdownLink(text)).toBe(false);
  });

  // FIXME add negative tests
});
