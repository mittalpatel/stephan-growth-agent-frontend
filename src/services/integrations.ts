export const INTEGRATIONS_ENDPOINT = '/api/v1/integrations/';
export const integrationConnectEndpoint = (id: string) => `${INTEGRATIONS_ENDPOINT}${id}/connect/`;
export const integrationDisconnectEndpoint = (id: string) =>
  `${INTEGRATIONS_ENDPOINT}${id}/disconnect/`;

export const INTEGRATIONS_LIST_KEY = 'integrations-list';
