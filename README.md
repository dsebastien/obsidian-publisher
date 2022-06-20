# ObsidianPublisher

Easily publish your content

## Installation

Not ready for prime time...

## Usage

### Ghost

- Create a [custom integration](https://ghost.org/integrations/custom-integrations/) on Ghost.
- Retrieve the **Admin API Key** and the **API URL**
- Go to the settings of the plugin, enable Ghost and configure the settings
- Add the Admin API Key, the API URL and the Base URL of your Ghost Website

### Medium

Not ready for prime time...

## Specifications

### Process

- Trigger via CMP + P "Publish all" action OR via the ribbon icon
- Go through all notes
- Detect those with the required metadata (plugin-specific!)
- Validate everything before doing anything
- Publish or update those to target platforms and include/update metadata

### Metadata in YAML front matter

- Mandatory for the note to be considered for publishing
  - `opublisher_status`: draft | published | scheduled (scheduled is only supported by Ghost and requires "opublisher_ghost_published_at")
- Optional
  - `opublisher_title`: Override the title. By default, the name of the file note is used as title. (e.g., if the filename is `Cool.md`, then the post tile will be `Cool`)
    - Type: string
  - `opublisher_slug`: unique slug to use for this post
  - If multiple posts are detected with
  - `opublisher_tags`: Override the tags. By default, the YAML front matter tags will be used and created on the target platforms if needed
    - Type: string[]
    - Examples
      - `opublisher_tags: a, b, c` (or with one tag per line below the property name and prefixed by `- `)
  - `opublisher_excerpt`: Summary of the post
    - Type: string
    - Default: ''
  - `opublisher_feature_image_url`:
    - Type: string (URL)
  - `opublisher_ghost_featured`:
    - Type: boolean
    - Default: false
  - `opublisher_ghost_published_at`: Schedule a post (will only be considered if the status is set to "scheduled")
  - `opublisher_ghost_newsletter_slug`: Slug of the Ghost newsletter to send this post to
  - `opublisher_ghost_newsletter_segment`: Filter the target email audience. If unset, defaults to all (as per Ghost API)
    - Type: string (Ghost NQL query)
    - Default: ""
  - `opublisher_ghost_newsletter_only`: Only send to the newsletter
    - Type: boolean
    - Default: false
  - `opublisher_ghost_canonical_url`: Canonical URL to use on Ghost
  - `opublisher_medium_canonical_url`: Canonical URL to use on Medium
  - `opublisher_ghost_id`: Id of the post on Ghost (if already exists). Set automatically by the plugin after a post has been published
  - `opublisher_ghost_url`: URL of the post on Ghost. Set automatically by the plugin after a post has been published
  - `opublisher_medium_id`: Id of the post on Medium (if already exists). Set automatically by the plugin after a post has been published
  - `opublisher_hash`

### How the plugin deals with...

- Links
  - Adapt to match target platform Base URL
  - Remove those that don't correspond to also published posts
- Images
  - TODO
    - Ghost
      - Use Ghost Images API?
    - How to handle image captions?
- Embedded Tweets
  - Convert to the target platform's syntax (if any)
- Embedded YouTube Videos
- Embedded Github Gists
- SEO metadata
  - TODO
- Validations
  - No unknown status
  - No duplicate slugs
  - No unknown opublisher properties in YAML front matter
  - All links point to existing notes
- New posts (detected when there is no "opublisher_ghost_id" or "opublisher_medium_id")
  - Create the post
  - Save the id in YAML front matter
  - Save a hash of the note to be able to determine later if anything has changed
  - If scheduled, set to state scheduled and set published_at to match "opublisher_ghost_published_at"
  - If "opublisher_ghost_newsletter_slug" defined: send the post to the corresponding Ghost newsletter
  - If "opublisher_ghost_canonical_url" defined: set
  - If "opublisher_medium_canonical_url" defined: set
  - If "opublisher_ghost_newsletter_segment" is set: send for the specific audience segment
  - If "opublisher_ghost_newsletter_only" is set: only send to the newsletter
  - Once published
    - Set "opublisher_ghost_url"
    - Set "opublisher_ghost_id"
    - Set "opublisher_medium_id"
    - Calculate hash and add to note in
- Existing posts (detected when there is a "opublisher_ghost_id" or "opublisher_medium_id" in YAML front matter)
  - Calculate the hash of the note and compare with previous one in "opublisher_hash". If changed, proceed with the update
  - Compare metadata and update if needed
    - Slug
    - Tags
    - Excerpt
    - ...
  - Update
    - Content
    - Metadata
- Modification detection
  - To detect modifications, the plugin uses a hash stored in the "opublisher_hash" property
  - If if is not set, the note is considered "new"
  - If it is set, it is used to determine if there were modifications since the last time it was published
  - To calculate the hash
  - hash(JSON stringify(YAML frontmatter without parts that vary because of the plugin) + JSON stringify(note text))

### Plugin configuration

- General
  - Automatic publication
    - Type: boolean
    - Default: false
- Ghost
  - Enabled
    - Type: boolean
    - Default: false
  - Base URL
    - Type: string (URL)
    - Default: ""
  - Admin Token
    - Type: string
    - Default: ""
- Medium
  - Enabled
    - Type: boolean
    - Default: false
  - Base URL
    - Type: string (URL)
    - Default: ""
  - ... (TODO)

### Open questions

- How to deal with Tags on Medium
- Links handling
- Image handling

## Development

- Create a test Obsidian vault to avoid losing data while testing the plugin
- Make sure that the safe mode is disabled
- Define an environment variable called `OBSIDIAN_VAULT_LOCATION` that points to your Obsidian vault. You should use a test vault . That variable will be used by the `build:dev` script to deploy the updated files
  - Example: `export OBSIDIAN_VAULT_LOCATION=~/TestObsidianVault`
- Optional: Install the Hot-Reload Obsidian plugin in your Obsidian vault to automatically reload the plugin when the files change: https://github.com/pjeby/hot-reload
- Clone the repository
- Run `npm install` or `yarn install` to install the dependencies
- Run `npm run build:dev` to build the development version
  - This will generate files under dist/apps/obsidian-publisher
  - The output will include a `.hotreload` file to let the Hot-Reload Obsidian plugin know that the plugin should be reloaded when files change

## Contributing

- Check out the project board: https://github.com/dsebastien/obsidian-publisher/projects/1
- Check out the issues and look for those with `help wanted` or `good first issue`: https://github.com/dsebastien/obsidian-publisher/issues
- Review and comment PRs

## Dependencies

- Immer for immutability: https://immerjs.github.io/immer/return

## Bugs and feature requests

- Create issues for bugs
- Create discussions for feature requests
