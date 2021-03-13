/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { ContentServiceClient } from '@gitpod/content-service/lib/content_grpc_pb';
import { DeleteUserContentRequest, DeleteUserContentResponse } from "@gitpod/content-service/lib/content_pb";
import { IDEPluginServiceClient } from '@gitpod/content-service/lib/ideplugin_grpc_pb';
import { PluginDownloadURLRequest, PluginDownloadURLResponse, PluginHashRequest, PluginHashResponse, PluginUploadURLRequest, PluginUploadURLResponse } from "@gitpod/content-service/lib/ideplugin_pb";
import { WorkspaceServiceClient } from '@gitpod/content-service/lib/workspace_grpc_pb';
import { DeleteWorkspaceRequest, DeleteWorkspaceResponse, WorkspaceDownloadURLRequest, WorkspaceDownloadURLResponse } from "@gitpod/content-service/lib/workspace_pb";
import { inject, injectable } from "inversify";
import { StorageClient } from "./storage-client";

@injectable()
export class ContentServiceStorageClient implements StorageClient {

    @inject(ContentServiceClient) private readonly contentServiceClient: ContentServiceClient;
    @inject(WorkspaceServiceClient) private readonly workspaceServiceClient: WorkspaceServiceClient;
    @inject(IDEPluginServiceClient) private readonly idePluginServiceClient: IDEPluginServiceClient;

    public async deleteUserContent(ownerId: string): Promise<void> {
        const request = new DeleteUserContentRequest();
        request.setOwnerId(ownerId);

        const grcpPromise = new Promise<DeleteUserContentResponse>((resolve, reject) => {
            this.contentServiceClient.deleteUserContent(request, (err: any, resp: DeleteUserContentResponse) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
        try {
            await grcpPromise;
            return;
        } catch (err) {
            throw err;
        }
    }

    public async deleteWorkspaceBackups(ownerId: string, workspaceId: string, includeSnapshots: boolean): Promise<void> {
        const request = new DeleteWorkspaceRequest();
        request.setOwnerId(ownerId);
        request.setWorkspaceId(workspaceId);
        request.setIncludeSnapshots(includeSnapshots);

        const grcpPromise = new Promise<DeleteWorkspaceResponse>((resolve, reject) => {
            this.workspaceServiceClient.deleteWorkspace(request, (err: any, resp: DeleteWorkspaceResponse) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
        try {
            await grcpPromise;
            return;
        } catch (err) {
            throw err;
        }
    }

    public async createWorkspaceContentDownloadUrl(ownerId: string, workspaceId: string): Promise<string> {
        const request = new WorkspaceDownloadURLRequest();
        request.setOwnerId(ownerId);
        request.setWorkspaceId(workspaceId);

        const grcpPromise = new Promise<WorkspaceDownloadURLResponse>((resolve, reject) => {
            this.workspaceServiceClient.WorkspaceDownloadURL(request, (err: any, resp: WorkspaceDownloadURLResponse) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
        try {
            const response = (await grcpPromise).toObject();
            // return decodeURI(response.url);
            return response.url;
        } catch (err) {
            throw err;
        }
    }

    public async createPluginUploadUrl(bucket: string, objectPath: string): Promise<string> {
        const request = new PluginUploadURLRequest();
        request.setBucket(bucket);
        request.setName(objectPath);

        const grcpPromise = new Promise<PluginUploadURLResponse>((resolve, reject) => {
            this.idePluginServiceClient.uploadURL(request, (err: any, resp: PluginUploadURLResponse) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
        try {
            const response = (await grcpPromise).toObject();
            return decodeURI(response.url);
            // return response.url;
        } catch (err) {
            throw err;
        }
    }

    public async createPluginDownloadUrl(bucket: string, objectPath: string): Promise<string> {
        const request = new PluginDownloadURLRequest();
        request.setBucket(bucket);
        request.setName(objectPath);

        const grcpPromise = new Promise<PluginDownloadURLResponse>((resolve, reject) => {
            this.idePluginServiceClient.downloadURL(request, (err: any, resp: PluginDownloadURLResponse) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
        try {
            const response = (await grcpPromise).toObject();
            return decodeURI(response.url);
            // return response.url;
        } catch (err) {
            throw err;
        }
    }

    public async getPluginHash(bucketName: string, objectPath: string): Promise<string> {
        const request = new PluginHashRequest();
        request.setBucket(bucketName);
        request.setName(objectPath);

        const grcpPromise = new Promise<PluginHashResponse>((resolve, reject) => {
            this.idePluginServiceClient.pluginHash(request, (err: any, resp: PluginHashResponse) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
        try {
            const response = (await grcpPromise).toObject();
            return response.hash;
        } catch (err) {
            throw err;
        }
    }
}
