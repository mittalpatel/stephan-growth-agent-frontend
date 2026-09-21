/**
 * Build-time switches for UI that is built but not yet useful.
 *
 * Custom domains: the Domains settings tab is hidden until the backend can actually
 * serve a verified domain (`CUSTOM_DOMAIN_ROUTING_ENABLED` there). Until then a
 * customer could verify a domain that then does nothing. Set
 * `NEXT_PUBLIC_CUSTOM_DOMAINS_ENABLED=true` in the same deploy that turns routing on.
 */
export const CUSTOM_DOMAINS_ENABLED = process.env.NEXT_PUBLIC_CUSTOM_DOMAINS_ENABLED === 'true';
