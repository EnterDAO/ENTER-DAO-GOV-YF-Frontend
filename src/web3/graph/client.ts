import { ApolloClient, ApolloQueryResult, InMemoryCache } from '@apollo/client';

import config from '../../config';

/**
 * Graph Node client utilising and switching between Primary/Fallback Graph nodes
 */
export class GraphClient {
  /**
   * Executes a GraphQL call. Uses the primary Graph Node.
   * If the call fails, the same call is executed against the fallback Graph Node
   * @param options GraphQL options
   * @param primary Whether to use the primary or the fallback node. Defaults to primary
   */
  public static async get(options: any, primary: boolean = true, graphName?: string): Promise<ApolloQueryResult<any>> {
    const client = new ApolloClient({
      uri: config.graph,
      cache: new InMemoryCache(),
    });

    try {
      return await client.query(options);
    } catch (e) {
      // @ts-ignore
      console.log(`Call to Graph at URL: ${client.link.options.uri} failed!`);
      // Try getting result through the fallback provider
      if (primary) {
        return await this.get(options, false, graphName);
      } else {
        throw e;
      }
    }
  }
}
