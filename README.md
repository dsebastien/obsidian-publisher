# Obsidian Publisher
Automates publishing from Obsidian

## Specifications
### Process
- Trigger via CMP + P "Publish all" action
- Go through all notes
- Detect those with required metadata (plugin-specific!)
- Validate everything before doing anything
- Publish or update those to target platforms and include/update metadata

### Metadata in YAML front matter
- Mandatory for the note to be considered for publishing
  - "opublisher_status": draft | published | scheduled (scheduled is only supported by Ghost and requires "opublisher_ghost_published_at")
  - "opublisher_slug": unique slug to use for this post
    - If multiple posts are detected with
- Optional
  - "opublisher_title": To override the title. By default, the name of the note is used as title
    - Type: string
  - "opublisher_tags": To override the tags. By default, the standard tags will be used and created on the target platforms if needed
    - Type: string[]
  - "opublisher_featured":
    - Type: boolean
    - Default: false
  - "opublisher_excerpt": Summary of the post
    - Type: string
  - "opublisher_feature_image": 
    - Type: string (URL)
  - "opublisher_ghost_published_at": To schedule a post (will only be considered if the status is set to "scheduled")
  - "opublisher_ghost_newsletter_slug": Slug of the Ghost newsletter to send this post to
  - "opublisher_ghost_newsletter_segment": filter the target email audience. If unset, defaults to all (as per Ghost API)
    - Type: string (Ghost NQL query)
    - Default: ""
  - "opublisher_ghost_newsletter_only": Only send to the newsletter
    - Type: boolean
    - Default: false
  - "opublisher_ghost_canonical_url": Canonical URL to use on Ghost
  - "opublisher_medium_canonical_url": Canonical URL to use on Medium
  - "opublisher_ghost_id": Id of the post on Ghost (if already exists). Set automatically by the plugin after a post has be  en published
  - "opublisher_ghost_url": URL of the post on Ghost. Set automatically by the plugin after a post has been published
  - "opublisher_medium_id": Id of the post on Medium  (if already exists). Set automatically by the plugin after a post has been published
  - "opublisher_hash"

### How the plugin deals with...
- Links
  - Adapt to match target platform Base URL
  - Remove those that don't correspond to also published posts
- Images
  - TODO
    - Ghost
      - Use Ghost Images API?
    - How to handle image captions?
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
  -   If if is not set, the note is considered "new"
  -   If it is set, it is used to determine if there were modifications since the last time it was published
  -   To calculate the hash
    -  hash(JSON stringify(YAML frontmatter without parts that vary because of the plugin) + JSON stringify(note text))

### Plugin configuration
- General
  - When to publish
    - Manual
      - Type: boolean
      - Default: true
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
