
import type { SVGProps } from 'react';
import {
  MessageSquare,
  Sheet as SheetIcon,
  Github,
  LayoutList,
  Bot,
  GitBranch,
  KeyRound,
  Webhook,
  Mail,
  FlaskConical,
  Database,
  ArrowRightLeft,
  Clock,
  ShoppingCart,
  StopCircle,
  Code,
  AppWindow,
} from 'lucide-react';
import {
  AsanaIcon,
  HubSpotIcon,
  SalesforceIcon,
  ZohoIcon,
} from '@/components/icons';

export type AppDefinition = {
  name: string;
  icon: React.ElementType<SVGProps<SVGSVGElement>>;
  iconClassName?: string;
  triggers: { value: string; label: string }[];
  actions: { value: string; label: string; params?: any[] }[];
};

export const APP_DEFINITIONS: AppDefinition[] = [
  {
    name: 'Shopify',
    icon: ShoppingCart,
    iconClassName: 'text-[#95BF47]',
    triggers: [
      { value: 'order_created', label: 'Order Created' },
      { value: 'order_paid', label: 'Order Paid' },
      { value: 'refund_created', label: 'Refund Created' },
    ],
    actions: [
      { value: 'create_customer', label: 'Create Customer' },
      { value: 'add_order_tag', label: 'Add Tag to Order' },
      { value: 'create_draft_order', label: 'Create Draft Order' },
    ],
  },
  {
    name: 'WooCommerce',
    icon: ShoppingCart,
    iconClassName: 'text-[#96588A]',
    triggers: [
      { value: 'order_created', label: 'Order Created' },
      { value: 'order_updated', label: 'Order Updated' },
      { value: 'product_low_stock', label: 'Product Low Stock' },
    ],
    actions: [
      { value: 'create_order', label: 'Create Order' },
      { value: 'update_order_status', label: 'Update Order Status' },
      { value: 'create_customer', label: 'Create Customer' },
    ],
  },
  {
    name: 'Gmail',
    icon: Mail,
    iconClassName: 'text-[#EA4335]',
    triggers: [
      { value: 'new_email', label: 'New Email' },
      { value: 'new_labeled_email', label: 'New Labeled Email' },
      { value: 'new_attachment', label: 'New Attachment' },
    ],
    actions: [
      { value: 'send_email', label: 'Send Email' },
      { value: 'create_draft', label: 'Create Draft' },
      { value: 'add_label', label: 'Add Label to Email' },
    ],
  },
  {
    name: 'Slack',
    icon: MessageSquare,
    iconClassName: 'text-[#4A154B]',
    triggers: [
      { value: 'new_message', label: 'New Message in Channel' },
      { value: 'new_mention', label: 'New Mention' },
      { value: 'reaction_added', label: 'Reaction Added' },
    ],
    actions: [
      { value: 'send_message', label: 'Send Message to Channel' },
      { value: 'create_channel', label: 'Create Channel' },
      { value: 'set_status', label: 'Set User Status' },
    ],
  },
  {
    name: 'Google Sheets',
    icon: SheetIcon,
    iconClassName: 'text-[#188038]',
    triggers: [
      { value: 'new_row', label: 'New Row Added' },
      { value: 'row_updated', label: 'Row Updated' },
      { value: 'new_worksheet', label: 'New Worksheet Created' },
    ],
    actions: [
      { value: 'add_row', label: 'Add Row' },
      { value: 'update_cell', label: 'Update Cell' },
      { value: 'clear_row', label: 'Clear Row' },
    ],
  },
  {
    name: 'GitHub',
    icon: Github,
    iconClassName: 'text-neutral-900 dark:text-neutral-100',
    triggers: [
      { value: 'new_commit', label: 'New Commit on Branch' },
      { value: 'pr_opened', label: 'Pull Request Opened' },
      { value: 'new_issue', label: 'New Issue Created' },
    ],
    actions: [
      { value: 'create_issue', label: 'Create Issue' },
      { value: 'create_pr_comment', label: 'Create PR Comment' },
      { value: 'add_label', label: 'Add Label to Issue/PR' },
    ],
  },
  {
    name: 'Trello',
    icon: LayoutList,
    iconClassName: 'text-[#0052CC]',
    triggers: [
      { value: 'card_created', label: 'New Card Created' },
      { value: 'card_moved', label: 'Card Moved to List' },
      { value: 'member_added', label: 'Member Added to Card' },
    ],
    actions: [
        { value: 'create_card', label: 'Create Card' },
        { value: 'move_card', label: 'Move Card to List' },
        { value: 'add_comment', label: 'Add Comment to Card' },
    ],
  },
  {
    name: 'Discord',
    icon: Bot,
    iconClassName: 'text-[#5865F2]',
    triggers: [
      { value: 'new_message', label: 'New Message in Channel' },
      { value: 'member_joined', label: 'New Member Joined Server' },
    ],
    actions: [
        { value: 'send_message', label: 'Send Message' },
        { value: 'add_role', label: 'Add Role to User' },
        { value: 'kick_user', label: 'Kick User' },
    ],
  },
  {
    name: 'Twilio WhatsApp',
    icon: MessageSquare,
    iconClassName: 'text-[#25D366]',
    triggers: [
      { value: 'message_received', label: 'WhatsApp Message Received' },
      { value: 'message_status_changed', label: 'Message Status Changed' },
    ],
    actions: [
      { value: 'send_whatsapp_message', label: 'Send WhatsApp Message' },
      { value: 'send_sms', label: 'Send SMS' },
      { value: 'make_call', label: 'Make Phone Call' },
    ],
  },
  {
    name: 'Stripe',
    icon: AppWindow,
    iconClassName: 'text-[#635BFF]',
    triggers: [
      { value: 'payment_succeeded', label: 'Payment Succeeded' },
      { value: 'checkout_completed', label: 'Checkout Session Completed' },
      { value: 'invoice_payment_failed', label: 'Invoice Payment Failed' },
    ],
    actions: [
      { value: 'create_customer', label: 'Create Customer' },
      { value: 'create_invoice_item', label: 'Create Invoice Item' },
      { value: 'send_invoice', label: 'Send Invoice' },
    ],
  },
  {
    name: 'Airtable',
    icon: AppWindow,
    iconClassName: 'text-[#18BFFF]',
    triggers: [
      { value: 'new_record', label: 'New Record' },
      { value: 'record_updated', label: 'Record Updated' },
      { value: 'new_view_record', label: 'New Record in View' },
    ],
    actions: [
      { value: 'create_record', label: 'Create Record' },
      { value: 'update_record', label: 'Update Record' },
      { value: 'find_records', label: 'Find Records' },
    ],
  },
  {
    name: 'Notion',
    icon: AppWindow,
    iconClassName: 'text-neutral-900 dark:text-neutral-100',
    triggers: [
      { value: 'page_created', label: 'Page Created' },
      { value: 'database_updated', label: 'Database Updated' },
      { value: 'new_database_item', label: 'New Database Item' },
    ],
    actions: [
      { value: 'create_page', label: 'Create Page' },
      { value: 'update_page_properties', label: 'Update Page Properties' },
      { value: 'append_block_children', label: 'Append Blocks to Page' },
    ],
  },
  {
    name: 'Zendesk',
    icon: AppWindow,
    iconClassName: 'text-[#03363D]',
    triggers: [
      { value: 'ticket_created', label: 'Ticket Created' },
      { value: 'ticket_updated', label: 'Ticket Updated' },
      { value: 'new_user', label: 'New User' },
    ],
    actions: [
      { value: 'create_ticket', label: 'Create Ticket' },
      { value: 'add_ticket_comment', label: 'Add Ticket Comment' },
      { value: 'update_ticket_status', label: 'Update Ticket Status' },
    ],
  },
  {
    name: 'Freshdesk',
    icon: AppWindow,
    iconClassName: 'text-[#25C16F]',
    triggers: [
      { value: 'ticket_created', label: 'Ticket Created' },
      { value: 'ticket_updated', label: 'Ticket Updated' },
      { value: 'contact_created', label: 'Contact Created' },
    ],
    actions: [
      { value: 'create_ticket', label: 'Create Ticket' },
      { value: 'reply_to_ticket', label: 'Reply to Ticket' },
      { value: 'update_ticket_status', label: 'Update Ticket Status' },
    ],
  },
  {
    name: 'Jira',
    icon: GitBranch,
    iconClassName: 'text-[#0052CC]',
    triggers: [
      { value: 'issue_created', label: 'Issue Created' },
      { value: 'status_updated', label: 'Issue Status Updated' },
    ],
    actions: [
        { value: 'create_issue', label: 'Create Issue' },
        { value: 'transition_issue', label: 'Transition Issue' },
        { value: 'add_comment', label: 'Add Comment to Issue' },
    ],
  },
  {
    name: 'Asana',
    icon: AsanaIcon,
    triggers: [
      { value: 'new_task', label: 'New Task Created' },
      { value: 'task_completed', label: 'Task Completed' },
      { value: 'new_project', label: 'New Project Created' },
    ],
    actions: [
        { value: 'create_task', label: 'Create Task' },
        { value: 'complete_task', label: 'Complete Task' },
        { value: 'add_comment_to_task', label: 'Add Comment to Task' },
    ],
  },
  {
    name: 'HubSpot',
    icon: HubSpotIcon,
    triggers: [
      { value: 'new_contact', label: 'New Contact Created' },
      { value: 'contact_updated', label: 'Contact Updated' },
      { value: 'new_deal', label: 'New Deal Created' },
    ],
    actions: [
        { value: 'create_contact', label: 'Create or Update Contact' },
        { value: 'create_deal', label: 'Create Deal' },
        { value: 'add_note_to_contact', label: 'Add Note to Contact' },
    ],
  },
  {
    name: 'Salesforce',
    icon: SalesforceIcon,
    triggers: [
      { value: 'new_lead', label: 'New Lead Created' },
      { value: 'opportunity_stage_changed', label: 'Opportunity Stage Changed' },
      { value: 'new_case', label: 'New Case Created' },
    ],
    actions: [
        { value: 'create_record', label: 'Create Record (Lead, Contact, etc.)' },
        { value: 'update_record', label: 'Update Record' },
        { value: 'get_record', label: 'Get Record by ID' },
    ],
  },
  {
    name: 'Zoho CRM',
    icon: ZohoIcon,
    triggers: [
      { value: 'new_lead', label: 'New Lead' },
      { value: 'deal_stage_updated', label: 'Deal Stage Updated' },
      { value: 'new_contact', label: 'New Contact' },
    ],
    actions: [
        { value: 'create_module_entry', label: 'Create Module Entry (Lead, Contact)' },
        { value: 'update_module_entry', label: 'Update Module Entry' },
        { value: 'add_note', label: 'Add Note' },
    ],
  },
];
