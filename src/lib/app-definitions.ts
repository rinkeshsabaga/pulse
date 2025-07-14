
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
