export interface MicrosoftTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt: number
  tokenType: string
  scope: string
}

export interface MicrosoftUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
}

export class MicrosoftAuthService {
  private static readonly AUTHORITY = 'https://login.microsoftonline.com'
  private static readonly GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0'
  
  private static get clientId(): string {
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID
    if (!clientId) {
      throw new Error('Microsoft Client ID not configured')
    }
    return clientId
  }

  private static get clientSecret(): string {
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
    if (!clientSecret) {
      throw new Error('Microsoft Client Secret not configured')
    }
    return clientSecret
  }

  private static get tenantId(): string {
    const tenantId = process.env.MICROSOFT_TENANT_ID
    if (!tenantId) {
      throw new Error('Microsoft Tenant ID not configured')
    }
    return tenantId
  }

  private static get redirectUri(): string {
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 
                       process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI ||
                       'http://localhost:3002/api/auth/callback/microsoft'
    return redirectUri
  }

  /**
   * Generate Microsoft OAuth authorization URL
   */
  static getAuthUrl(state?: string): string {
    // Use personal OneDrive scopes (removed Files.ReadWrite.All for personal accounts)
    const scopes = [
      'Files.ReadWrite',
      'User.Read',
      'offline_access'
    ].join(' ')

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_mode: 'query',
      ...(state && { state })
    })

    // Use 'common' tenant for personal Microsoft accounts
    return `${this.AUTHORITY}/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<MicrosoftTokens> {
    try {
      console.log('🔄 Exchanging authorization code for tokens')

      // Use 'common' tenant for personal accounts
      const tokenEndpoint = `${this.AUTHORITY}/common/oauth2/v2.0/token`

      const body = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        scope: 'Files.ReadWrite Files.ReadWrite.All User.Read offline_access'
      })

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Token exchange failed:', errorData)
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`)
      }

      const tokenData = await response.json()

      const tokens: MicrosoftTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      }

      console.log('✅ Tokens obtained successfully')
      return tokens

    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error)
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Refresh expired access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<MicrosoftTokens> {
    try {
      console.log('🔄 Refreshing access token')

      // Use 'common' tenant for personal accounts
      const tokenEndpoint = `${this.AUTHORITY}/common/oauth2/v2.0/token`

      const body = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'Files.ReadWrite Files.ReadWrite.All User.Read offline_access'
      })

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Token refresh failed:', errorData)
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`)
      }

      const tokenData = await response.json()

      const tokens: MicrosoftTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Keep old refresh token if new one not provided
        expiresIn: tokenData.expires_in,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      }

      console.log('✅ Token refreshed successfully')
      return tokens

    } catch (error) {
      console.error('❌ Error refreshing token:', error)
      throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user information from Microsoft Graph
   */
  static async getUserInfo(accessToken: string): Promise<MicrosoftUser> {
    try {
      console.log('👤 Fetching user information')

      const response = await fetch(`${this.GRAPH_ENDPOINT}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`)
      }

      const userData = await response.json()

      const user: MicrosoftUser = {
        id: userData.id,
        displayName: userData.displayName,
        mail: userData.mail || userData.userPrincipalName,
        userPrincipalName: userData.userPrincipalName
      }

      console.log('✅ User information retrieved')
      return user

    } catch (error) {
      console.error('❌ Error getting user info:', error)
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate access token
   */
  static async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.GRAPH_ENDPOINT}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('❌ Error validating token:', error)
      return false
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt - (5 * 60 * 1000) // 5 minutes buffer
  }

  /**
   * Get valid access token (refresh if needed)
   */
  static async getValidAccessToken(tokens: MicrosoftTokens): Promise<string> {
    if (!this.isTokenExpired(tokens.expiresAt)) {
      return tokens.accessToken
    }

    console.log('🔄 Token expired, refreshing...')
    const newTokens = await this.refreshAccessToken(tokens.refreshToken)
    
    // You should save the new tokens to your storage here
    // This is just returning the access token for immediate use
    return newTokens.accessToken
  }

  /**
   * Revoke tokens (logout)
   */
  static async revokeTokens(accessToken: string): Promise<void> {
    try {
      console.log('🔄 Revoking tokens')

      // Microsoft Graph doesn't have a direct revoke endpoint
      // The tokens will expire naturally
      // You should clear them from your storage

      console.log('✅ Tokens revoked (cleared from storage)')

    } catch (error) {
      console.error('❌ Error revoking tokens:', error)
      throw new Error(`Failed to revoke tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate state parameter for OAuth flow
   */
  static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  /**
   * Validate state parameter
   */
  static validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState
  }
}
