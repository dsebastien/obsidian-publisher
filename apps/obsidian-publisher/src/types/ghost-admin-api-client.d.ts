/**
 * References:
 * https://ghost.org/docs/admin-api/
 * https://github.com/TryGhost/SDK/blob/main/packages/admin-api/lib/admin-api.js
 */
declare module '@tryghost/admin-api' {
  /**
   * Ghost post object
   */
  export interface GhostPost {
    /**
     * Id of the post. Optional
     */
    id: string | undefined;
    /**
     * Title of the post. Mandatory.
     */
    title: string;
    /**
     * Slug of the post. If not provided, Ghost will generate one based on the post title
     */
    slug: string | undefined;
    /**
     * The HTML of the post
     */
    html: string;
    feature_image?: string | null;
    feature_image_alt?: string | null;
    feature_image_caption?: string | null;
    featured: boolean;
    status: 'draft' | 'published' | 'scheduled';
    visibility: GhostPostVisibility;
    //published_at?: string | null;
    //created_at?: string | undefined;
    updated_at?: string | undefined;
    codeinjection_head?: string | null;
    codeinjection_foot?: string | null;
    custom_template?: string | null;
    canonical_url?: string | null;
    tags: string[]; // FIXME validate
    // authors
    // primary_author
    // primary_tag
    custom_excerpt: string | undefined;
    excerpt: string;
    og_image?: string | null;
    og_title: string;
    og_description: string;
    twitter_image?: string | null;
    twitter_title: string;
    twitter_description: string;
    meta_title: string;
    meta_description: string;
    email_only?: boolean;
    email_subject?: string | null;
    frontmatter?: string | null;
    // newsletter
    // email
  }

  const GhostPostVisibilities = ['public', 'paid', 'members'] as const;
  export type GhostPostVisibility = typeof GhostPostVisibilities[number];

  /**
   * Details we care about in the response of a Ghost post creation
   */
  export type GhostPostCreationResponse = Omit<GhostPost, 'tags'> & {
    id: string;
    uuid: string;
    url: string;
    tags: GhostTag[];
    updated_at: string;
    // authors
    // tiers
    // primary_author
    // primary_tag
    // email_segment
  };

  /**
   * Details we care about in the response of a Ghost post update
   */
  export type GhostPostUpdateResponse = GhostPostCreationResponse;

  export interface GhostTag {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }

  export interface GhostAdminApiOptions {
    /**
     * URL of the Ghost instance
     */
    url: string;
    ghostPath?: string;
    /**
     * The Admin API key
     */
    key: string;
    /**
     * A version string like v3.2, v4.1, v5.8 or boolean value identifying presence of Accept-Version header
     */
    version: string;
    /**
     * Flag controlling if the 'User-Agent' header should be sent with a request
     */
    userAgent?: string | boolean;
    /**
     * Customize the Accept-Version header sent with requests
     */
    acceptVersionHeader?: string;
    /**
     * Replace the function used to send HTTP requests
     */
    makeRequest?: (
      options: GhostAdminApiMakeRequestOptions
    ) => Promise<unknown>;
    /**
     * Replace the function used to generate tokens
     * @param key the key
     * @param audience the audience of the token
     */
    generateToken?: (key: string, audience: string) => string;
  }

  export interface GhostAdminApiMakeRequestOptions {
    url: string;
    method: string;
    data: Record<unknown>[] | undefined;
    params: Record<unknown>;
    headers: Record<unknown>;
  }

  export interface GhostAdminApiMediaUploadData {
    /**
     * File path to a media file
     **/
    file: string;
    /**
     * File path to a thumbnail file
     */
    thumbnail?: string;
    /**
     * Purpose of the file
     */
    purpose?: string;
  }

  export type GhostAdminApiImageUploadData = GhostAdminApiMediaUploadData;

  export interface GhostAdminApiFileUploadData {
    /**
     * File path to a file
     **/
    file: string;
    /**
     * Reference field returned in the response
     */
    ref?: string;
  }

  // export interface GhostAdminApiInstance {
  //
  // }

  declare class GhostAdminApi implements GhostAdminApiInstance {
    constructor(options: GhostAdminApiOptions);

    posts: {
      read: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      browse: (options: Record<unknown>) => Promise<unknown>;
      add: (
        data: GhostPost,
        queryParams: Record<unknown> = {}
      ) => Promise<GhostPostCreationResponse>;
      edit: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<GhostPostUpdateResponse>;
      del: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
    };

    pages: {
      read: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      browse: (options: Record<unknown>) => Promise<unknown>;
      add: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      edit: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      del: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
    };

    tags: {
      read: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      browse: (options: Record<unknown>) => Promise<unknown>;
      add: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      edit: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      del: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
    };

    members: {
      read: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      browse: (options: Record<unknown>) => Promise<unknown>;
      add: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      edit: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      del: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
    };

    users: {
      read: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      browse: (options: Record<unknown>) => Promise<unknown>;
      add: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      edit: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      del: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
    };

    newsletters: {
      read: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      browse: (options: Record<unknown>) => Promise<unknown>;
      add: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      edit: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      del: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
    };

    webhooks: {
      add: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      edit: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
      del: (
        data: Record<unknown>,
        queryParams: Record<unknown> = {}
      ) => Promise<unknown>;
    };

    images: {
      upload: (
        data: GhostAdminApiImageUploadData | FormData
      ) => Promise<unknown>;
    };

    media: {
      upload: (
        data: GhostAdminApiMediaUploadData | FormData
      ) => Promise<unknown>;
    };

    files: {
      upload: (
        data: GhostAdminApiFileUploadData | FormData
      ) => Promise<unknown>;
    };

    config: {
      read: () => Promise<unknown>;
    };

    site: {
      read: () => Promise<unknown>;
    };

    themes: {
      upload: (data) => Promise<unknown>;
      activate: (name: string) => Promise<unknown>;
    };
  }

  export = GhostAdminApi;
}
