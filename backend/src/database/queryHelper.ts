// Helper functions to convert PostgreSQL queries to MySQL
export class QueryHelper {
    // Convert PostgreSQL RETURNING clause to MySQL equivalent
    static convertReturning(query: string): { query: string; needsSelect: boolean } {
      const returningMatch = query.match(/RETURNING\s+(.+)$/i);
      if (returningMatch) {
        const columns = returningMatch[1];
        const baseQuery = query.replace(/\s+RETURNING\s+.+$/i, '');
        return {
          query: baseQuery,
          needsSelect: true
        };
      }
      return { query, needsSelect: false };
    }
  
    // Convert PostgreSQL $1, $2 placeholders to MySQL ? placeholders
    static convertPlaceholders(query: string): string {
      return query.replace(/\$(\d+)/g, '?');
    }
  
    // Convert PostgreSQL NOW() to MySQL equivalent
    static convertTimeFunction(query: string): string {
      return query.replace(/\bNOW\(\)/gi, 'NOW()');
    }
  
    // Convert boolean values
    static convertBooleans(query: string): string {
      return query
        .replace(/\btrue\b/gi, 'TRUE')
        .replace(/\bfalse\b/gi, 'FALSE');
    }
  
    // Main conversion function
    static convertQuery(query: string): { query: string; needsSelect: boolean } {
      let convertedQuery = query;
      convertedQuery = this.convertPlaceholders(convertedQuery);
      convertedQuery = this.convertTimeFunction(convertedQuery);
      convertedQuery = this.convertBooleans(convertedQuery);
      
      const { query: finalQuery, needsSelect } = this.convertReturning(convertedQuery);
      
      return { query: finalQuery, needsSelect };
    }
  }