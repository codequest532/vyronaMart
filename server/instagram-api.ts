import axios from 'axios';

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramProduct {
  id: string;
  name: string;
  description?: string;
  price?: string;
  url?: string;
  image_url?: string;
  availability?: string;
  brand?: string;
  condition?: string;
  category?: string;
}

interface InstagramBusinessAccount {
  id: string;
  name: string;
  username: string;
  followers_count: number;
  media_count: number;
  profile_picture_url: string;
  website?: string;
  biography?: string;
}

export class InstagramAPI {
  private baseUrl = 'https://graph.instagram.com';
  private graphUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Get Instagram Business Account details
   */
  async getBusinessAccount(accessToken: string): Promise<InstagramBusinessAccount> {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username,name,followers_count,media_count,profile_picture_url,website,biography',
          access_token: accessToken
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Instagram business account:', error.response?.data || error.message);
      throw new Error('Failed to fetch Instagram business account details');
    }
  }

  /**
   * Get media posts from Instagram Business Account
   */
  async getMediaPosts(accessToken: string, limit: number = 25): Promise<InstagramMedia[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/me/media`, {
        params: {
          fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
          limit,
          access_token: accessToken
        }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching Instagram media:', error.response?.data || error.message);
      throw new Error('Failed to fetch Instagram media posts');
    }
  }

  /**
   * Get product catalog from Instagram Shopping
   */
  async getProductCatalog(accessToken: string, businessAccountId: string): Promise<InstagramProduct[]> {
    try {
      // First get the catalog ID
      const catalogResponse = await axios.get(`${this.graphUrl}/${businessAccountId}`, {
        params: {
          fields: 'shopping_review_status,catalog_id',
          access_token: accessToken
        }
      });

      const catalogId = catalogResponse.data.catalog_id;
      if (!catalogId) {
        console.log('No product catalog found for this Instagram account');
        return [];
      }

      // Get products from catalog
      const productsResponse = await axios.get(`${this.graphUrl}/${catalogId}/products`, {
        params: {
          fields: 'id,name,description,price,url,image_url,availability,brand,condition,category',
          access_token: accessToken
        }
      });

      return productsResponse.data.data || [];
    } catch (error: any) {
      console.error('Error fetching Instagram products:', error.response?.data || error.message);
      // Return empty array if no product catalog exists
      return [];
    }
  }

  /**
   * Extract product information from media captions
   */
  extractProductsFromMedia(mediaPosts: InstagramMedia[]): any[] {
    const products: any[] = [];

    mediaPosts.forEach(post => {
      if (post.caption && post.media_type === 'IMAGE') {
        const caption = post.caption.toLowerCase();
        
        // Look for price indicators
        const priceMatch = caption.match(/(?:price|cost|₹|rs\.?|inr)\s*:?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
        
        // Look for product name (text before price or hashtags)
        const productNameMatch = caption.split(/[#@₹]/)[0].trim();
        
        // Extract hashtags as categories/tags
        const hashtags = caption.match(/#[\w]+/g) || [];
        const categories = hashtags.map(tag => tag.replace('#', '')).slice(0, 3);

        if (priceMatch && productNameMatch.length > 5) {
          products.push({
            instagramMediaId: post.id,
            productName: productNameMatch.substring(0, 100),
            description: post.caption.substring(0, 500),
            price: parseInt(priceMatch[1].replace(/,/g, '')) * 100, // Convert to cents
            imageUrl: post.media_url,
            productUrl: post.permalink,
            categoryTag: categories[0] || 'general',
            hashtags: categories,
            likeCount: post.like_count || 0,
            commentsCount: post.comments_count || 0,
            postedAt: post.timestamp
          });
        }
      }
    });

    return products;
  }

  /**
   * Get Instagram account insights
   */
  async getAccountInsights(accessToken: string, since?: string, until?: string): Promise<any> {
    try {
      const params: any = {
        metric: 'impressions,reach,profile_views,website_clicks',
        period: 'day',
        access_token: accessToken
      };

      if (since) params.since = since;
      if (until) params.until = until;

      const response = await axios.get(`${this.baseUrl}/me/insights`, {
        params
      });

      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching Instagram insights:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Refresh Instagram access token
   */
  async refreshAccessToken(accessToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const response = await axios.get(`${this.baseUrl}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error refreshing Instagram token:', error.response?.data || error.message);
      throw new Error('Failed to refresh Instagram access token');
    }
  }

  /**
   * Convert Instagram API product to our product format
   */
  convertToOurProductFormat(instagramProduct: InstagramProduct | any, storeId: number): any {
    return {
      storeId,
      instagramMediaId: instagramProduct.instagramMediaId || instagramProduct.id,
      productName: instagramProduct.name || instagramProduct.productName,
      description: instagramProduct.description || '',
      price: instagramProduct.price || 0,
      imageUrl: instagramProduct.image_url || instagramProduct.imageUrl,
      productUrl: instagramProduct.url || instagramProduct.productUrl,
      categoryTag: instagramProduct.category || instagramProduct.categoryTag || 'general',
      hashtags: instagramProduct.hashtags || [],
      isAvailable: instagramProduct.availability !== 'out of stock',
      likeCount: instagramProduct.likeCount || 0,
      commentsCount: instagramProduct.commentsCount || 0,
      lastSyncAt: new Date()
    };
  }
}

export const instagramAPI = new InstagramAPI();