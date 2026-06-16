// ─── Integration Keys (Nango provider config keys) ────────────────────────────
// These must match the integration slugs in your Nango dashboard.

export const NANGO_INTEGRATIONS: Record<string, string> = {
  'Shopify':     'shopify',
  'WooCommerce': 'woocommerce',
  'Gmail':       'gmail',
  'Slack':       'slack',
  'GitHub':      'github',
  'Google Sheets': 'google-sheets',
  'HubSpot':     'hubspot',
  'Twilio WhatsApp': 'twilio',
  'Stripe':      'stripe',
  'Airtable':    'airtable',
  'Notion':      'notion',
  'Zendesk':     'zendesk',
  'Freshdesk':   'freshdesk',
  'Jira':        'jira',
  'Asana':       'asana',
  'Salesforce':  'salesforce',
  'Zoho CRM':    'zoho-crm',
  'Discord':     'discord',
  'Trello':      'trello',
};

/**
 * Returns the Nango integration key for a given app name, or null if not OAuth.
 */
export function getNangoIntegrationKey(appName: string): string | null {
  return NANGO_INTEGRATIONS[appName] ?? null;
}
