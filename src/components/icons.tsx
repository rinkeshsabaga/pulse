
import type { SVGProps } from 'react';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12h3l3-9 4 18 3-9h4" />
  </svg>
);

export const AsanaIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Asana</title>
    <path d="M12 1.09C6.01 1.09 1.09 6.01 1.09 12S6.01 22.91 12 22.91 22.91 17.99 22.91 12 17.99 1.09 12 1.09zm-2.83 6.94a.97.97 0 1 1 0 1.94.97.97 0 0 1 0-1.94zm5.66 0a.97.97 0 1 1 0 1.94.97.97 0 0 1 0-1.94zm-2.83 5.46a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96z"/>
  </svg>
);

export const HubSpotIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>HubSpot</title>
      <path d="M21.594 9.873c-.878-1.74-2.83-2.61-4.87-2.61h-2.203V4.87c0-1.09-.985-1.96-2.195-1.96-1.118 0-2.01 1.07-2.01 2.17v2.39H8.01c-1.95 0-3.81.78-4.87 2.61C2.145 11.434 2.1 13.524 3.05 15.195l4.814 8.718h8.01l4.814-8.718c.95-1.67.904-3.76.906-3.622zM12 16.124a4.12 4.12 0 1 1 0-8.24 4.12 4.12 0 0 1 0 8.24z"/>
    </svg>
);

export const SalesforceIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Salesforce</title>
    <path d="M12.012 2.607c-5.462 0-9.88 4.095-9.88 9.155s4.418 9.155 9.88 9.155c5.46 0 9.878-4.095 9.878-9.155s-4.418-9.155-9.878-9.155zm3.878 12.2c-.37.34-.84.53-1.397.53-.556 0-1.025-.19-1.396-.53-.37-.34-.56-.777-.56-1.31 0-.32.08-.6.23-.84.15-.24.36-.43.63-.58.27-.15.58-.26.93-.34.35-.08.72-.12 1.11-.12.18 0 .33.01.45.02.12.01.23.03.3.04.13.03.25.06.33.1.08.04.13.08.13.14 0 .09-.07.16-.2.2-.13.04-.38.06-.75.06-.4 0-.76-.04-1.1-.11-.34-.07-.63-.19-.88-.34-.25-.15-.44-.35-.59-.59s-.23-.5-.23-.79c0-.42.12-.79.35-1.1.23-.31.54-.55.91-.72.37-.17.8-.25 1.28-.25.56 0 1.06.11 1.5.34.44.23.8.56 1.07.98.27.42.4.92.4 1.5 0 .61-.16 1.16-.49 1.63-.33.47-.79.82-1.38 1.06z"/>
  </svg>
);

export const ZohoIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Zoho</title>
      <path d="M10.23 6.29L6.23 12h3.3L6.23 17.71 10.23 12h-3.3zm3.54 0L9.82 12h3.3L9.82 17.71l3.95-5.71h-3.3zm3.54 0L13.36 12h3.3l-3.3 5.71l3.95-5.71h-3.3zM4.215 0C1.887 0 0 1.887 0 4.215V24h19.785C22.113 24 24 22.113 24 19.785V0H4.215z"/>
    </svg>
);
