//import { sign } from 'jsonwebtoken';

import { OPublisherRawPost } from '../types';
import { log } from '../utils/log';
import { OPublisherGhostSettings } from '../types/opublisher-ghost-settings.intf';

//const ghostApiVersion = 'v4';

/**
 * Publish the provided posts to Ghost.
 * Assumes that the configuration has been validated already!
 * @param posts the posts to publish
 * @param settings
 */
export const publishToGhost = async (
  posts: OPublisherRawPost[],
  settings: OPublisherGhostSettings
): Promise<number> => {
  log(
    `Publishing ${posts.length} posts to Ghost Website (${settings.baseUrl})`,
    'info'
  );

  // TODO implement

  // Extract the id and secret from the Admin token
  //const [id, secret] = settings.adminToken.split(':');

  // Create the API token
  // const apiToken = sign({}, Buffer.from(secret, 'hex'), {
  //   keyid: id,
  //   algorithm: 'HS256',
  //   expiresIn: '5m',
  //   audience: `/${ghostApiVersion}/admin/`,
  // });

  for (const post of posts) {
    log(`Publishing post ${post.title} to Ghost`, 'debug');

    // TODO implement
    // build the front matter
    // upload images
    // transform the content
    // send the request based on the action to perform
    // parse the response
    // chain the requests with a delay
    // accumulate call results and keep track of the responses (e.g., post URLs, post IDs, failures, etc)
    // return accumulated call results
  }

  return 0;
};
