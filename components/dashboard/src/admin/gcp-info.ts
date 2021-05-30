/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { WorkspaceAndInstance } from "@gitpod/gitpod-protocol";
import { log } from "@gitpod/gitpod-protocol/lib/util/logging";
import { Annotations, WorkspaceClusterWoTLS } from "@gitpod/gitpod-protocol/lib/workspace-cluster";

export interface Link {
    readonly name: string;
    readonly title: string;
    readonly url: string;
}

interface K8sSpecificPlaceholdersValues {
    readonly podName: string;
    readonly nodeName: string;
    readonly namespace: string;
}

export function getAdminLinks(workspace: WorkspaceAndInstance): Link[] {
    let gcpInfo;
    try {
        gcpInfo = deriveGcpInfo(workspace.ideUrl, workspace.region);
    } catch (e) {
        log.error(e);
    }
    if (gcpInfo === undefined) {
        return [];
    }
    const { baseDomain, gcp } = gcpInfo;

    return internalGetAdminLinks(gcp, baseDomain, workspace.status.podName, workspace.status.nodeName);
}

export function getAdminLinks1(workspace: WorkspaceAndInstance, clusters: WorkspaceClusterWoTLS[]): Link[] {
    let matchingClusterInfo = clusters.find(cluster => cluster.name === workspace.region);
    if (!matchingClusterInfo) {
        log.warn("no matching cluster found with name " + workspace.region + ", some links might be broken")
        return [];
    }
    let clusterAnnotations = matchingClusterInfo.annotations;
    if (!clusterAnnotations) {
        log.warn("no annotations found in the matching cluster, some links might be broken")
        return [];
    }
    else {
        let placeHolderValues: K8sSpecificPlaceholdersValues = { podName: workspace.status.podName || "", nodeName: workspace.status.nodeName || "", namespace: workspace.status.namespace || "" }
        return internalGetAdminLinks1(clusterAnnotations, placeHolderValues)
    }
}

function replaceK8sSpecificPlaceholders(templatedString: string, placeholdersValues: K8sSpecificPlaceholdersValues): string {
    let renderedString = templatedString;
    renderedString = renderedString.replace("${podName}", placeholdersValues.podName)
    renderedString = renderedString.replace("${nodeName}", placeholdersValues.nodeName)
    renderedString = renderedString.replace("${namespace}", placeholdersValues.namespace)
    return renderedString;
}

function internalGetAdminLinks(gcpInfo: GcpInfo,
    baseDomain: string,
    podName?: string,
    nodeName?: string): Link[] {
    const { clusterName, namespace, projectName, region } = gcpInfo;
    return [
        {
            name: "Pod",
            title: `${podName}`,
            url: `https://console.cloud.google.com/kubernetes/pod/${region}/${clusterName}/${namespace}/${podName}/details?project=${projectName}`
        },
        {
            name: `Node`,
            title: `${nodeName}`,
            url: `https://console.cloud.google.com/kubernetes/node/${region}/${clusterName}/${nodeName}/summary?project=${projectName}`
        },
        {
            name: `Workspace Pod Logs`,
            title: `See Logs`,
            url: `https://console.cloud.google.com/logs/query;query=resource.type%3D%22k8s_container%22%0Aresource.labels.project_id%3D%22${projectName}%22%0Aresource.labels.location%3D%22${region}%22%0Aresource.labels.cluster_name%3D%22${clusterName}%22%0Aresource.labels.namespace_name%3D%22${namespace}%22%0Aresource.labels.pod_name%3D%22${podName}%22?project=${projectName}`
        },
        {
            name: `Grafana Workspace`,
            title: `Pod Metrics`,
            url: `https://monitoring.${baseDomain}/d/admin-workspace/admin-workspace?var-workspace=${podName}`
        },
        {
            name: `Grafana Node`,
            title: `Node Metrics`,
            url: `https://monitoring.${baseDomain}/d/admin-node/admin-node?var-node=${nodeName}`
        },
    ];
}
function internalGetAdminLinks1(annotations: Annotations, placeHolderValues: K8sSpecificPlaceholdersValues): Link[] {
    return [
        getPodLink(),
        getNodeLink(),
        getLogsLink(),
        getPodMetricsLink(),
        getNodeMetricsLink(),
    ];

    function getNodeMetricsLink(): Link {
        return {
            name: "Grafana Node",
            title: "Node Metrics",
            url: replaceK8sSpecificPlaceholders(annotations.nodeMetricsUrl || "", placeHolderValues)
        };
    }

    function getPodMetricsLink(): Link {
        return {
            name: "Grafana Workspace",
            title: "Pod Metrics",
            url: replaceK8sSpecificPlaceholders(annotations.podMetricsUrl || "", placeHolderValues)
        };
    }

    function getLogsLink(): Link {
        return {
            name: "Workspace Pod Logs",
            title: "See Logs",
            url: replaceK8sSpecificPlaceholders(annotations.podLogsUrl || "", placeHolderValues)
        };
    }

    function getNodeLink(): Link {
        return {
            name: "Node",
            title: placeHolderValues.nodeName,
            url: replaceK8sSpecificPlaceholders(annotations.nodeUrl || "", placeHolderValues)
        };
    }

    function getPodLink(): Link {
        return {
            name: "Pod",
            title: placeHolderValues.podName,
            url: replaceK8sSpecificPlaceholders(annotations.podUrl || "", placeHolderValues)
        };
    }
}

function deriveGcpInfo(ideUrlStr: string, region: string): { gcp: GcpInfo, baseDomain: string } | undefined {
    const ideUrl = new URL(ideUrlStr);
    const hostnameParts = ideUrl.hostname.split(".")
    const baseDomain = hostnameParts.slice(hostnameParts.length - 2).join(".");
    const namespace = hostnameParts[hostnameParts.length - 4];

    const gcp = getGcpInfo(baseDomain, region, namespace);
    if (!gcp) {
        return undefined;
    }
    return {
        gcp,
        baseDomain,
    }
}

function getGcpInfo(baseDomain: string, regionShort: string, namespace?: string): GcpInfo | undefined {
    if (baseDomain === "gitpod.io") {
        if (regionShort === "eu03") {
            return {
                clusterName: "prod--gitpod-io--europe-west1--03",
                namespace: 'default',
                region: "europe-west1",
                projectName: "gitpod-191109",
            };
        }
        if (regionShort === "us03") {
            return {
                clusterName: "prod--gitpod-io--us-west1--03",
                namespace: 'default',
                region: "us-west1",
                projectName: "gitpod-191109",
            };
        }
    }
    if (baseDomain === "gitpod-staging.com") {
        if (regionShort === "eu02") {
            return {
                clusterName: "staging--gitpod-io--eu-west1--02",
                namespace: 'default',
                region: "europe-west1",
                projectName: "gitpod-staging",
            };
        }
        if (regionShort === "us02") {
            return {
                clusterName: "staging--gitpod-io--us-west1--02",
                namespace: 'default',
                region: "us-west1",
                projectName: "gitpod-staging",
            };
        }
    }
    if (baseDomain === "gitpod-dev.com") {
        return {
            clusterName: "dev",
            namespace: 'staging-' + namespace,
            region: "europe-west1-b",
            projectName: "gitpod-core-dev",
        };
    }
    return undefined;
}

interface GcpInfo {
    readonly clusterName: string;
    readonly region: string;
    readonly projectName: string;
    readonly namespace: string;
}