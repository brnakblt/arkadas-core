import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

export class MicrosoftGraphService {
  private client: Client;

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Uploads a file to the user's OneDrive (App Folder or Root).
   * @param fileName Name of the file (e.g., "document.docx")
   * @param fileBuffer Content of the file
   * @returns The uploaded driveItem
   */
  async uploadFile(fileName: string, fileBuffer: Buffer | ArrayBuffer) {
    try {
      // Upload to a specific folder "ArkadasApps" to keep things clean
      // Ensure folder exists first (simplified: just try to upload to root/ArkadasApps)
      
      // For simplicity, we upload to the root of the user's drive for now, 
      // or we could use the special "App Root" if we had that permission scope.
      // Let's upload to a folder named "ArkadasEdit".
      
      const folderName = "ArkadasEdit";
      
      // 1. Check/Create Folder (Optimistic: assume it exists or create it)
      // Actually, PUT /drive/root:/Folder/File:/content handles creation.
      
      const response = await this.client
        .api(`/me/drive/root:/${folderName}/${fileName}:/content`)
        .put(fileBuffer);

      return response;
    } catch (error) {
      console.error("Error uploading file to OneDrive:", error);
      throw error;
    }
  }

  /**
   * Creates a temporary edit link for the file.
   * @param itemId The ID of the file in OneDrive
   * @returns The webUrl to edit the file
   */
  async createEditLink(itemId: string) {
    try {
      // We can just use the 'webUrl' from the uploaded item, 
      // but creating a specific permission/link might be more robust.
      // However, for the owner, the standard webUrl works.
      
      const response = await this.client.api(`/me/drive/items/${itemId}`).get();
      return response.webUrl; // This URL opens the file in Office Online
    } catch (error) {
      console.error("Error getting edit link:", error);
      throw error;
    }
  }

  /**
   * Downloads the file content from OneDrive.
   * @param itemId The ID of the file in OneDrive
   * @returns ArrayBuffer of the file content
   */
  async downloadFile(itemId: string): Promise<ArrayBuffer> {
    try {
      // Get the @microsoft.graph.downloadUrl
      const item = await this.client.api(`/me/drive/items/${itemId}`).select('@microsoft.graph.downloadUrl').get();
      const downloadUrl = item["@microsoft.graph.downloadUrl"];

      if (!downloadUrl) {
        throw new Error("Download URL not found");
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to download file content");
      
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error downloading file from OneDrive:", error);
      throw error;
    }
  }
  
  /**
   * Deletes the file from OneDrive (cleanup).
   * @param itemId 
   */
  async deleteFile(itemId: string) {
      try {
          await this.client.api(`/me/drive/items/${itemId}`).delete();
      } catch (error) {
          console.error("Error deleting file from OneDrive:", error);
          // Don't throw, just log
      }
  }
}
