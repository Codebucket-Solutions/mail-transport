/**
 * Configuration required by the Codebucket email gateway.
 */
export interface TransportOptions {
    /**
     * Full gateway endpoint URL, for example:
     * https://api.engineering-fabric.codebuckets.in/api/v1/email-gateway/send
     */
    url: string;
    /**
     * Sender identifier assigned to the calling service.
     */
    senderId: string;
    /**
     * Bearer token used to authenticate with the gateway.
     */
    accessToken: string;
}
