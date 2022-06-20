export const yamlFrontMatterPattern = `---(.|\\r*\\n*)*?---(\\r*\\n*)`;
export const yamlFrontMatterRegex = new RegExp(yamlFrontMatterPattern, 'gmi');

/**
 * Strip the YAML front matter from the given string
 * @param text the text to remove the YAML front matter from
 */
export const stripYamlFrontMatter = (text: string) => {
  const retVal = text.replace(yamlFrontMatterRegex, '');
  return retVal;
};
