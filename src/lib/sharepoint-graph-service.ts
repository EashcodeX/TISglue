// SharePoint Graph service (app-only) using Sites.Selected and drive IDs
// This mirrors MicrosoftGraphService but uses app-only endpoints and site/drive IDs

export interface SPFile {
  id: string
  name: string
  size: number
  mimeType: string
  downloadUrl?: string
  webUrl?: string
  folderPath: string
  lastModified: string
  parentFolderId?: string
}

export class SharePointGraphService {
  constructor(private accessToken: string) {}

  private baseUrl = 'https://graph.microsoft.com/v1.0'

  private async req(path: string, init: RequestInit = {}) {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(init.headers || {})
      }
    })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Graph error ${resp.status}: ${text}`)
    }
    return resp.json()
  }

  // Drive context is a library drive within a SharePoint site
  async ensureOrgFolder(siteId: string, driveId: string, rootFolderName: string, orgFolderName: string): Promise<string> {
    // Ensure root folder
    const rootChildren = await this.req(`/sites/${siteId}/drives/${driveId}/root/children?$filter=name eq '${rootFolderName}'`)
    let rootId: string
    if (rootChildren.value?.length) {
      rootId = rootChildren.value[0].id
    } else {
      const created = await this.req(`/sites/${siteId}/drives/${driveId}/root/children`, {
        method: 'POST',
        body: JSON.stringify({ name: rootFolderName, folder: {}, '@microsoft.graph.conflictBehavior': 'rename' })
      })
      rootId = created.id
    }

    // Ensure org folder
    const orgChildren = await this.req(`/sites/${siteId}/drives/${driveId}/items/${rootId}/children?$filter=name eq '${orgFolderName}'`)
    if (orgChildren.value?.length) {
      return orgChildren.value[0].id
    }
    const createdOrg = await this.req(`/sites/${siteId}/drives/${driveId}/items/${rootId}/children`, {
      method: 'POST',
      body: JSON.stringify({ name: orgFolderName, folder: {}, '@microsoft.graph.conflictBehavior': 'rename' })
    })
    return createdOrg.id
  }

  async uploadSmall(siteId: string, driveId: string, folderId: string, file: File, fileName: string) {
    const buf = await file.arrayBuffer()
    const resp = await fetch(`${this.baseUrl}/sites/${siteId}/drives/${driveId}/items/${folderId}:/${fileName}:/content`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': file.type || 'application/octet-stream' },
      body: buf
    })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Upload failed ${resp.status}: ${text}`)
    }
    return resp.json()
  }
}

