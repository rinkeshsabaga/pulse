export type IntegrationHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type IntegrationActionRequest = {
  method: IntegrationHttpMethod;
  endpoint: string;
  data?: unknown;
  query?: Record<string, string | number | string[] | number[]>;
  directBaseUrl?: string;
  headers?: Record<string, string>;
  bodyFormat?: 'json' | 'form';
};

export type IntegrationActionGuide = {
  requiredParams: string[];
  example: Record<string, unknown>;
};

type ActionDefinition = IntegrationActionGuide & {
  build: (params: Record<string, unknown>) => IntegrationActionRequest;
};

const actionDefinitions: Record<string, ActionDefinition> = {
  'Shopify:create_customer': define(['storeUrl', 'email'], {
    storeUrl: 'https://your-store.myshopify.com', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace',
  }, (params) => ({
    method: 'POST', endpoint: `/admin/api/${shopifyApiVersion(params)}/customers.json`,
    directBaseUrl: requiredBaseUrl(params, 'storeUrl'),
    data: { customer: compact({
      email: stringParam(params, 'email'), first_name: optionalString(params, 'firstName'),
      last_name: optionalString(params, 'lastName'), phone: optionalString(params, 'phone'),
      tags: optionalString(params, 'tags'),
    }) },
  })),
  'Shopify:add_order_tag': define(['storeUrl', 'orderId', 'tags'], {
    storeUrl: 'https://your-store.myshopify.com', orderId: '1234567890', tags: 'priority, automation',
  }, (params) => ({
    method: 'PUT', endpoint: `/admin/api/${shopifyApiVersion(params)}/orders/${segment(params, 'orderId')}.json`,
    directBaseUrl: requiredBaseUrl(params, 'storeUrl'),
    data: { order: { id: stringParam(params, 'orderId'), tags: stringParam(params, 'tags') } },
  })),
  'Shopify:create_draft_order': define(['storeUrl', 'lineItems'], {
    storeUrl: 'https://your-store.myshopify.com',
    email: 'ada@example.com',
    lineItems: [{ title: 'Consultation', price: '100.00', quantity: 1 }],
  }, (params) => ({
    method: 'POST', endpoint: `/admin/api/${shopifyApiVersion(params)}/draft_orders.json`,
    directBaseUrl: requiredBaseUrl(params, 'storeUrl'),
    data: { draft_order: compact({
      email: optionalString(params, 'email'), line_items: arrayParam(params, 'lineItems'),
      note: optionalString(params, 'note'), tags: optionalString(params, 'tags'),
    }) },
  })),

  'WooCommerce:create_order': define(['storeUrl', 'lineItems'], {
    storeUrl: 'https://shop.example.com',
    billing: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' },
    lineItems: [{ product_id: 123, quantity: 1 }],
  }, (params) => ({
    method: 'POST', endpoint: '/wp-json/wc/v3/orders', directBaseUrl: requiredBaseUrl(params, 'storeUrl'),
    data: compact({ billing: optionalObject(params, 'billing'), shipping: optionalObject(params, 'shipping'), line_items: arrayParam(params, 'lineItems') }),
  })),
  'WooCommerce:update_order_status': define(['storeUrl', 'orderId', 'status'], {
    storeUrl: 'https://shop.example.com', orderId: '1234', status: 'completed',
  }, (params) => ({
    method: 'PUT', endpoint: `/wp-json/wc/v3/orders/${segment(params, 'orderId')}`, directBaseUrl: requiredBaseUrl(params, 'storeUrl'),
    data: { status: stringParam(params, 'status') },
  })),
  'WooCommerce:create_customer': define(['storeUrl', 'email'], {
    storeUrl: 'https://shop.example.com', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace',
  }, (params) => ({
    method: 'POST', endpoint: '/wp-json/wc/v3/customers', directBaseUrl: requiredBaseUrl(params, 'storeUrl'),
    data: compact({ email: stringParam(params, 'email'), first_name: optionalString(params, 'firstName'), last_name: optionalString(params, 'lastName') }),
  })),

  'Gmail:send_email': define(['to', 'subject', 'body'], {
    to: 'customer@example.com', subject: 'Order update', body: 'Your order has shipped.',
  }, (params) => ({
    method: 'POST', endpoint: '/gmail/v1/users/me/messages/send', directBaseUrl: 'https://gmail.googleapis.com',
    data: { raw: gmailRawMessage(params) },
  })),
  'Gmail:create_draft': define(['to', 'subject', 'body'], {
    to: 'customer@example.com', subject: 'Draft follow-up', body: 'Following up...',
  }, (params) => ({
    method: 'POST', endpoint: '/gmail/v1/users/me/drafts', directBaseUrl: 'https://gmail.googleapis.com',
    data: { message: { raw: gmailRawMessage(params) } },
  })),
  'Gmail:add_label': define(['messageId', 'labelIds'], {
    messageId: 'message-id', labelIds: ['Label_123'],
  }, (params) => ({
    method: 'POST', endpoint: `/gmail/v1/users/me/messages/${segment(params, 'messageId')}/modify`,
    directBaseUrl: 'https://gmail.googleapis.com',
    data: { addLabelIds: arrayParam(params, 'labelIds') },
  })),

  'Slack:send_message': define(['channel', 'text'], { channel: '#general', text: 'Hello!' }, (params) => ({
    method: 'POST', endpoint: '/api/chat.postMessage', directBaseUrl: 'https://slack.com',
    data: { channel: stringParam(params, 'channel'), text: stringParam(params, 'text') },
  })),
  'Slack:create_channel': define(['name'], { name: 'project-updates', isPrivate: false }, (params) => ({
    method: 'POST', endpoint: '/api/conversations.create', directBaseUrl: 'https://slack.com',
    data: { name: stringParam(params, 'name'), is_private: booleanParam(params, 'isPrivate', false) },
  })),
  'Slack:set_status': define(['statusText'], { statusText: 'In a workflow', statusEmoji: ':zap:' }, (params) => ({
    method: 'POST', endpoint: '/api/users.profile.set', directBaseUrl: 'https://slack.com',
    data: { profile: compact({
      status_text: stringParam(params, 'statusText'),
      status_emoji: optionalString(params, 'statusEmoji'),
      status_expiration: optionalNumber(params, 'statusExpiration'),
    }) },
  })),

  'Google Sheets:add_row': define(['spreadsheetId', 'range', 'values'], {
    spreadsheetId: 'spreadsheet-id', range: 'Sheet1!A:C', values: [['Ada', 'ada@example.com', 'Active']],
  }, (params) => ({
    method: 'POST',
    endpoint: `/v4/spreadsheets/${segment(params, 'spreadsheetId')}/values/${segment(params, 'range')}:append`,
    directBaseUrl: 'https://sheets.googleapis.com',
    query: { valueInputOption: 'USER_ENTERED' },
    data: { values: arrayParam(params, 'values') },
  })),
  'Google Sheets:update_cell': define(['spreadsheetId', 'range', 'values'], {
    spreadsheetId: 'spreadsheet-id', range: 'Sheet1!B2', values: [['Updated']],
  }, (params) => ({
    method: 'PUT',
    endpoint: `/v4/spreadsheets/${segment(params, 'spreadsheetId')}/values/${segment(params, 'range')}`,
    directBaseUrl: 'https://sheets.googleapis.com',
    query: { valueInputOption: 'USER_ENTERED' },
    data: { values: arrayParam(params, 'values') },
  })),
  'Google Sheets:clear_row': define(['spreadsheetId', 'range'], {
    spreadsheetId: 'spreadsheet-id', range: 'Sheet1!A2:C2',
  }, (params) => ({
    method: 'POST',
    endpoint: `/v4/spreadsheets/${segment(params, 'spreadsheetId')}/values/${segment(params, 'range')}:clear`,
    directBaseUrl: 'https://sheets.googleapis.com', data: {},
  })),

  'GitHub:create_issue': define(['owner', 'repo', 'title'], {
    owner: 'acme', repo: 'website', title: 'Customer reported issue', body: 'Details...', labels: ['automation'],
  }, (params) => ({
    method: 'POST', endpoint: `/repos/${segment(params, 'owner')}/${segment(params, 'repo')}/issues`,
    directBaseUrl: 'https://api.github.com',
    data: compact({
      title: stringParam(params, 'title'), body: optionalString(params, 'body'),
      labels: optionalArray(params, 'labels'), assignees: optionalArray(params, 'assignees'),
    }),
  })),
  'GitHub:create_pr_comment': define(['owner', 'repo', 'pullNumber', 'body'], {
    owner: 'acme', repo: 'website', pullNumber: 42, body: 'Looks good.',
  }, (params) => ({
    method: 'POST',
    endpoint: `/repos/${segment(params, 'owner')}/${segment(params, 'repo')}/issues/${segment(params, 'pullNumber')}/comments`,
    directBaseUrl: 'https://api.github.com', data: { body: stringParam(params, 'body') },
  })),
  'GitHub:add_label': define(['owner', 'repo', 'issueNumber', 'labels'], {
    owner: 'acme', repo: 'website', issueNumber: 42, labels: ['triage'],
  }, (params) => ({
    method: 'POST',
    endpoint: `/repos/${segment(params, 'owner')}/${segment(params, 'repo')}/issues/${segment(params, 'issueNumber')}/labels`,
    directBaseUrl: 'https://api.github.com', data: { labels: arrayParam(params, 'labels') },
  })),

  'Trello:create_card': define(['listId', 'name'], { listId: 'list-id', name: 'Follow up', description: 'Created by Pulse' }, (params) => ({
    method: 'POST', endpoint: '/1/cards', directBaseUrl: 'https://api.trello.com',
    data: compact({ idList: stringParam(params, 'listId'), name: stringParam(params, 'name'), desc: optionalString(params, 'description') }),
  })),
  'Trello:move_card': define(['cardId', 'listId'], { cardId: 'card-id', listId: 'target-list-id' }, (params) => ({
    method: 'PUT', endpoint: `/1/cards/${segment(params, 'cardId')}`, directBaseUrl: 'https://api.trello.com',
    data: { idList: stringParam(params, 'listId') },
  })),
  'Trello:add_comment': define(['cardId', 'text'], { cardId: 'card-id', text: 'Automated update' }, (params) => ({
    method: 'POST', endpoint: `/1/cards/${segment(params, 'cardId')}/actions/comments`, directBaseUrl: 'https://api.trello.com',
    data: { text: stringParam(params, 'text') },
  })),

  'Discord:send_message': define(['channelId', 'content'], { channelId: '123456789', content: 'Hello from Pulse' }, (params) => ({
    method: 'POST', endpoint: `/api/v10/channels/${segment(params, 'channelId')}/messages`, directBaseUrl: 'https://discord.com',
    data: { content: stringParam(params, 'content') },
  })),
  'Discord:add_role': define(['guildId', 'userId', 'roleId'], { guildId: 'guild-id', userId: 'user-id', roleId: 'role-id' }, (params) => ({
    method: 'PUT', endpoint: `/api/v10/guilds/${segment(params, 'guildId')}/members/${segment(params, 'userId')}/roles/${segment(params, 'roleId')}`,
    directBaseUrl: 'https://discord.com',
  })),
  'Discord:kick_user': define(['guildId', 'userId'], { guildId: 'guild-id', userId: 'user-id' }, (params) => ({
    method: 'DELETE', endpoint: `/api/v10/guilds/${segment(params, 'guildId')}/members/${segment(params, 'userId')}`,
    directBaseUrl: 'https://discord.com',
  })),

  'Jira:create_issue': define(['projectKey', 'summary', 'issueType'], {
    baseUrl: 'https://company.atlassian.net', projectKey: 'OPS', summary: 'Investigate failed workflow', issueType: 'Task', description: 'Run details...',
  }, (params) => ({
    method: 'POST', endpoint: '/rest/api/3/issue', directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { fields: compact({
      project: { key: stringParam(params, 'projectKey') }, summary: stringParam(params, 'summary'),
      issuetype: { name: stringParam(params, 'issueType') },
      description: optionalString(params, 'description') ? jiraDocument(optionalString(params, 'description')!) : undefined,
    }) },
  })),
  'Jira:transition_issue': define(['issueKey', 'transitionId'], { baseUrl: 'https://company.atlassian.net', issueKey: 'OPS-42', transitionId: '31' }, (params) => ({
    method: 'POST', endpoint: `/rest/api/3/issue/${segment(params, 'issueKey')}/transitions`, directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { transition: { id: stringParam(params, 'transitionId') } },
  })),
  'Jira:add_comment': define(['issueKey', 'body'], { baseUrl: 'https://company.atlassian.net', issueKey: 'OPS-42', body: 'Workflow completed.' }, (params) => ({
    method: 'POST', endpoint: `/rest/api/3/issue/${segment(params, 'issueKey')}/comment`, directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { body: jiraDocument(stringParam(params, 'body')) },
  })),

  'Asana:create_task': define(['name'], { name: 'Follow up with customer', notes: 'Created by Pulse', projectIds: ['project-id'] }, (params) => ({
    method: 'POST', endpoint: '/api/1.0/tasks', directBaseUrl: 'https://app.asana.com',
    data: { data: compact({
      name: stringParam(params, 'name'), notes: optionalString(params, 'notes'), projects: optionalArray(params, 'projectIds'),
      assignee: optionalString(params, 'assignee'), due_on: optionalString(params, 'dueOn'),
    }) },
  })),
  'Asana:complete_task': define(['taskId'], { taskId: 'task-id' }, (params) => ({
    method: 'PUT', endpoint: `/api/1.0/tasks/${segment(params, 'taskId')}`, directBaseUrl: 'https://app.asana.com',
    data: { data: { completed: true } },
  })),
  'Asana:add_comment_to_task': define(['taskId', 'text'], { taskId: 'task-id', text: 'Completed by automation.' }, (params) => ({
    method: 'POST', endpoint: `/api/1.0/tasks/${segment(params, 'taskId')}/stories`, directBaseUrl: 'https://app.asana.com',
    data: { data: { text: stringParam(params, 'text') } },
  })),

  'HubSpot:create_contact': define(['properties'], { properties: { email: 'ada@example.com', firstname: 'Ada' } }, (params) => ({
    method: 'POST', endpoint: '/crm/v3/objects/contacts', directBaseUrl: 'https://api.hubapi.com',
    data: { properties: objectParam(params, 'properties') },
  })),
  'HubSpot:create_deal': define(['properties'], { properties: { dealname: 'New deal', amount: '5000', pipeline: 'default' } }, (params) => ({
    method: 'POST', endpoint: '/crm/v3/objects/deals', directBaseUrl: 'https://api.hubapi.com',
    data: { properties: objectParam(params, 'properties') },
  })),
  'HubSpot:add_note_to_contact': define(['contactId', 'body'], { contactId: 'contact-id', body: 'Customer contacted by workflow.' }, (params) => ({
    method: 'POST', endpoint: '/crm/v3/objects/notes', directBaseUrl: 'https://api.hubapi.com',
    data: {
      properties: { hs_note_body: stringParam(params, 'body'), hs_timestamp: new Date().toISOString() },
      associations: [{ to: { id: stringParam(params, 'contactId') }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }],
    },
  })),

  'Twilio WhatsApp:send_whatsapp_message': define(['accountSid', 'from', 'to', 'body'], {
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', from: 'whatsapp:+14155238886', to: 'whatsapp:+15551234567', body: 'Hello from Pulse',
  }, (params) => ({
    method: 'POST', endpoint: `/2010-04-01/Accounts/${segment(params, 'accountSid')}/Messages.json`, directBaseUrl: 'https://api.twilio.com',
    bodyFormat: 'form',
    data: { From: stringParam(params, 'from'), To: stringParam(params, 'to'), Body: stringParam(params, 'body') },
  })),
  'Twilio WhatsApp:send_sms': define(['accountSid', 'from', 'to', 'body'], {
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', from: '+15551234567', to: '+15557654321', body: 'Hello from Pulse',
  }, (params) => ({
    method: 'POST', endpoint: `/2010-04-01/Accounts/${segment(params, 'accountSid')}/Messages.json`, directBaseUrl: 'https://api.twilio.com',
    bodyFormat: 'form',
    data: { From: stringParam(params, 'from'), To: stringParam(params, 'to'), Body: stringParam(params, 'body') },
  })),
  'Twilio WhatsApp:make_call': define(['accountSid', 'from', 'to', 'twiml'], {
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', from: '+15551234567', to: '+15557654321', twiml: '<Response><Say>Hello from Pulse</Say></Response>',
  }, (params) => ({
    method: 'POST', endpoint: `/2010-04-01/Accounts/${segment(params, 'accountSid')}/Calls.json`, directBaseUrl: 'https://api.twilio.com',
    bodyFormat: 'form',
    data: { From: stringParam(params, 'from'), To: stringParam(params, 'to'), Twiml: stringParam(params, 'twiml') },
  })),

  'Stripe:create_customer': define(['email'], { email: 'ada@example.com', name: 'Ada Lovelace' }, (params) => ({
    method: 'POST', endpoint: '/v1/customers', directBaseUrl: 'https://api.stripe.com', bodyFormat: 'form',
    data: compact({ email: stringParam(params, 'email'), name: optionalString(params, 'name'), description: optionalString(params, 'description') }),
  })),
  'Stripe:create_invoice_item': define(['customerId', 'amount', 'currency'], {
    customerId: 'cus_123', amount: 5000, currency: 'usd', description: 'Implementation fee',
  }, (params) => ({
    method: 'POST', endpoint: '/v1/invoiceitems', directBaseUrl: 'https://api.stripe.com', bodyFormat: 'form',
    data: compact({
      customer: stringParam(params, 'customerId'), amount: stringParam(params, 'amount'),
      currency: stringParam(params, 'currency'), description: optionalString(params, 'description'),
    }),
  })),
  'Stripe:send_invoice': define(['invoiceId'], { invoiceId: 'in_123' }, (params) => ({
    method: 'POST', endpoint: `/v1/invoices/${segment(params, 'invoiceId')}/send`, directBaseUrl: 'https://api.stripe.com', bodyFormat: 'form',
    data: {},
  })),

  'Airtable:create_record': define(['baseId', 'tableName', 'fields'], {
    baseId: 'app123', tableName: 'Leads', fields: { Name: 'Ada Lovelace', Email: 'ada@example.com' },
  }, (params) => ({
    method: 'POST', endpoint: `/v0/${segment(params, 'baseId')}/${segment(params, 'tableName')}`, directBaseUrl: 'https://api.airtable.com',
    data: { fields: objectParam(params, 'fields') },
  })),
  'Airtable:update_record': define(['baseId', 'tableName', 'recordId', 'fields'], {
    baseId: 'app123', tableName: 'Leads', recordId: 'rec123', fields: { Status: 'Contacted' },
  }, (params) => ({
    method: 'PATCH', endpoint: `/v0/${segment(params, 'baseId')}/${segment(params, 'tableName')}/${segment(params, 'recordId')}`,
    directBaseUrl: 'https://api.airtable.com', data: { fields: objectParam(params, 'fields') },
  })),
  'Airtable:find_records': define(['baseId', 'tableName'], {
    baseId: 'app123', tableName: 'Leads', filterByFormula: "{Email} = 'ada@example.com'",
  }, (params) => ({
    method: 'GET', endpoint: `/v0/${segment(params, 'baseId')}/${segment(params, 'tableName')}`, directBaseUrl: 'https://api.airtable.com',
    query: compact({
      filterByFormula: optionalString(params, 'filterByFormula'),
      view: optionalString(params, 'view'),
      maxRecords: optionalNumber(params, 'maxRecords'),
    }) as Record<string, string | number>,
  })),

  'Notion:create_page': define(['parent', 'properties'], {
    parent: { database_id: 'database-id' }, properties: { Name: { title: [{ text: { content: 'New lead' } }] } },
  }, (params) => ({
    method: 'POST', endpoint: '/v1/pages', directBaseUrl: 'https://api.notion.com',
    headers: notionHeaders(), data: { parent: objectParam(params, 'parent'), properties: objectParam(params, 'properties') },
  })),
  'Notion:update_page_properties': define(['pageId', 'properties'], {
    pageId: 'page-id', properties: { Status: { status: { name: 'Done' } } },
  }, (params) => ({
    method: 'PATCH', endpoint: `/v1/pages/${segment(params, 'pageId')}`, directBaseUrl: 'https://api.notion.com',
    headers: notionHeaders(), data: { properties: objectParam(params, 'properties') },
  })),
  'Notion:append_block_children': define(['blockId', 'children'], {
    blockId: 'page-id', children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Automated note' } }] } }],
  }, (params) => ({
    method: 'PATCH', endpoint: `/v1/blocks/${segment(params, 'blockId')}/children`, directBaseUrl: 'https://api.notion.com',
    headers: notionHeaders(), data: { children: arrayParam(params, 'children') },
  })),

  'Zendesk:create_ticket': define(['baseUrl', 'subject', 'body'], {
    baseUrl: 'https://company.zendesk.com', subject: 'Customer needs help', body: 'Ticket created by Pulse',
  }, (params) => ({
    method: 'POST', endpoint: '/api/v2/tickets.json', directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { ticket: compact({
      subject: stringParam(params, 'subject'), comment: { body: stringParam(params, 'body') },
      priority: optionalString(params, 'priority'), type: optionalString(params, 'type'),
    }) },
  })),
  'Zendesk:add_ticket_comment': define(['baseUrl', 'ticketId', 'body'], {
    baseUrl: 'https://company.zendesk.com', ticketId: '123', body: 'Automated update',
  }, (params) => ({
    method: 'PUT', endpoint: `/api/v2/tickets/${segment(params, 'ticketId')}.json`, directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { ticket: { comment: { body: stringParam(params, 'body'), public: booleanParam(params, 'public', false) } } },
  })),
  'Zendesk:update_ticket_status': define(['baseUrl', 'ticketId', 'status'], {
    baseUrl: 'https://company.zendesk.com', ticketId: '123', status: 'solved',
  }, (params) => ({
    method: 'PUT', endpoint: `/api/v2/tickets/${segment(params, 'ticketId')}.json`, directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { ticket: { status: stringParam(params, 'status') } },
  })),

  'Freshdesk:create_ticket': define(['baseUrl', 'email', 'subject', 'description'], {
    baseUrl: 'https://company.freshdesk.com', email: 'customer@example.com', subject: 'Customer needs help', description: 'Ticket created by Pulse',
  }, (params) => ({
    method: 'POST', endpoint: '/api/v2/tickets', directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: compact({
      email: stringParam(params, 'email'), subject: stringParam(params, 'subject'),
      description: stringParam(params, 'description'), priority: optionalNumber(params, 'priority') ?? 1,
      status: optionalNumber(params, 'status') ?? 2,
    }),
  })),
  'Freshdesk:reply_to_ticket': define(['baseUrl', 'ticketId', 'body'], {
    baseUrl: 'https://company.freshdesk.com', ticketId: '123', body: 'Thanks for contacting us.',
  }, (params) => ({
    method: 'POST', endpoint: `/api/v2/tickets/${segment(params, 'ticketId')}/reply`, directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { body: stringParam(params, 'body') },
  })),
  'Freshdesk:update_ticket_status': define(['baseUrl', 'ticketId', 'status'], {
    baseUrl: 'https://company.freshdesk.com', ticketId: '123', status: 5,
  }, (params) => ({
    method: 'PUT', endpoint: `/api/v2/tickets/${segment(params, 'ticketId')}`, directBaseUrl: requiredBaseUrl(params, 'baseUrl'),
    data: { status: optionalNumber(params, 'status') ?? Number(stringParam(params, 'status')) },
  })),

  'Salesforce:create_record': define(['objectType', 'fields'], { instanceUrl: 'https://company.my.salesforce.com', objectType: 'Lead', fields: { LastName: 'Lovelace', Company: 'Analytical Engines' }, apiVersion: '61.0' }, (params) => ({
    method: 'POST', endpoint: `/services/data/v${apiVersion(params)}/sobjects/${segment(params, 'objectType')}`,
    directBaseUrl: requiredBaseUrl(params, 'instanceUrl'), data: objectParam(params, 'fields'),
  })),
  'Salesforce:update_record': define(['objectType', 'recordId', 'fields'], { instanceUrl: 'https://company.my.salesforce.com', objectType: 'Lead', recordId: 'record-id', fields: { Status: 'Working' }, apiVersion: '61.0' }, (params) => ({
    method: 'PATCH', endpoint: `/services/data/v${apiVersion(params)}/sobjects/${segment(params, 'objectType')}/${segment(params, 'recordId')}`,
    directBaseUrl: requiredBaseUrl(params, 'instanceUrl'), data: objectParam(params, 'fields'),
  })),
  'Salesforce:get_record': define(['objectType', 'recordId'], { instanceUrl: 'https://company.my.salesforce.com', objectType: 'Lead', recordId: 'record-id', fields: ['Id', 'Name'], apiVersion: '61.0' }, (params) => ({
    method: 'GET', endpoint: `/services/data/v${apiVersion(params)}/sobjects/${segment(params, 'objectType')}/${segment(params, 'recordId')}`,
    directBaseUrl: requiredBaseUrl(params, 'instanceUrl'),
    query: optionalArray(params, 'fields') ? { fields: optionalArray(params, 'fields')!.map(String).join(',') } : undefined,
  })),

  'Zoho CRM:create_module_entry': define(['module', 'record'], { module: 'Leads', record: { Last_Name: 'Lovelace', Company: 'Analytical Engines' } }, (params) => ({
    method: 'POST', endpoint: `/crm/v2/${segment(params, 'module')}`, directBaseUrl: optionalString(params, 'baseUrl') ?? 'https://www.zohoapis.com',
    data: { data: [objectParam(params, 'record')] },
  })),
  'Zoho CRM:update_module_entry': define(['module', 'recordId', 'record'], { module: 'Leads', recordId: 'record-id', record: { Lead_Status: 'Contacted' } }, (params) => ({
    method: 'PUT', endpoint: `/crm/v2/${segment(params, 'module')}/${segment(params, 'recordId')}`,
    directBaseUrl: optionalString(params, 'baseUrl') ?? 'https://www.zohoapis.com', data: { data: [objectParam(params, 'record')] },
  })),
  'Zoho CRM:add_note': define(['module', 'recordId', 'title', 'content'], {
    module: 'Leads', recordId: 'record-id', title: 'Workflow note', content: 'Follow-up complete.',
  }, (params) => ({
    method: 'POST', endpoint: '/crm/v2/Notes', directBaseUrl: optionalString(params, 'baseUrl') ?? 'https://www.zohoapis.com',
    data: { data: [{
      Note_Title: stringParam(params, 'title'), Note_Content: stringParam(params, 'content'),
      Parent_Id: stringParam(params, 'recordId'), se_module: stringParam(params, 'module'),
    }] },
  })),
};

export function getIntegrationActionGuide(appName: string, action: string): IntegrationActionGuide | null {
  const definition = actionDefinitions[actionKey(appName, action)];
  if (!definition) return null;
  return { requiredParams: definition.requiredParams, example: definition.example };
}

export function buildIntegrationActionRequest(
  appName: string,
  action: string,
  params: Record<string, unknown>
): IntegrationActionRequest {
  const definition = actionDefinitions[actionKey(appName, action)];
  if (!definition) throw new Error(`Unsupported action "${action}" for ${appName}.`);
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('Action parameters must be a JSON object.');
  }
  return definition.build(params);
}

export function validateIntegrationActionParams(
  appName: string,
  action: string,
  params: Record<string, unknown>
): string[] {
  try {
    buildIntegrationActionRequest(appName, action, params);
    return [];
  } catch (error) {
    return [error instanceof Error ? error.message : 'Invalid integration action parameters.'];
  }
}

function define(
  requiredParams: string[],
  example: Record<string, unknown>,
  build: ActionDefinition['build']
): ActionDefinition {
  return { requiredParams, example, build };
}

function actionKey(appName: string, action: string) {
  return `${appName}:${action}`;
}

function stringParam(params: Record<string, unknown>, key: string): string {
  const value = params[key];
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    throw new Error(`Parameter "${key}" is required.`);
  }
  return String(value).trim();
}

function optionalString(params: Record<string, unknown>, key: string): string | undefined {
  const value = params[key];
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function optionalNumber(params: Record<string, unknown>, key: string): number | undefined {
  const value = params[key];
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Parameter "${key}" must be a number.`);
  return parsed;
}

function booleanParam(params: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = params[key];
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Parameter "${key}" must be a boolean.`);
}

function arrayParam(params: Record<string, unknown>, key: string): unknown[] {
  const value = params[key];
  if (!Array.isArray(value)) throw new Error(`Parameter "${key}" must be an array.`);
  return value;
}

function optionalArray(params: Record<string, unknown>, key: string): unknown[] | undefined {
  const value = params[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Error(`Parameter "${key}" must be an array.`);
  return value;
}

function objectParam(params: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = params[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Parameter "${key}" must be an object.`);
  }
  return value as Record<string, unknown>;
}

function optionalObject(params: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = params[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Parameter "${key}" must be an object.`);
  }
  return value as Record<string, unknown>;
}

function segment(params: Record<string, unknown>, key: string): string {
  return encodeURIComponent(stringParam(params, key));
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function requiredBaseUrl(params: Record<string, unknown>, key: string): string | undefined {
  return optionalString(params, key);
}

function apiVersion(params: Record<string, unknown>): string {
  return (optionalString(params, 'apiVersion') ?? '61.0').replace(/^v/i, '');
}

function shopifyApiVersion(params: Record<string, unknown>): string {
  return optionalString(params, 'apiVersion') ?? '2024-10';
}

function notionHeaders(): Record<string, string> {
  return { 'Notion-Version': '2022-06-28' };
}

function gmailRawMessage(params: Record<string, unknown>): string {
  const lines = [
    `To: ${stringParam(params, 'to')}`,
    optionalString(params, 'from') ? `From: ${optionalString(params, 'from')}` : undefined,
    `Subject: ${stringParam(params, 'subject')}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    stringParam(params, 'body'),
  ].filter((line): line is string => line !== undefined);
  return base64UrlEncode(lines.join('\r\n'));
}

function base64UrlEncode(value: string): string {
  let encoded: string;
  if (typeof btoa === 'function') {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    encoded = btoa(binary);
  } else {
    encoded = Buffer.from(value, 'utf8').toString('base64');
  }
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function jiraDocument(text: string) {
  return {
    type: 'doc', version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
}
