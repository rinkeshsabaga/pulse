
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


// Asana Icon
export const AsanaIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="7.5" r="3.5" fill="#f06a6a" stroke="none" />
    <circle cx="6" cy="16.5" r="3.5" fill="#f06a6a" stroke="none" />
    <circle cx="18" cy="16.5" r="3.5" fill="#f06a6a" stroke="none" />
  </svg>
);

// HubSpot Icon
export const HubSpotIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="#ff7a59"
    {...props}
  >
    <path d="M21.36,10.33a.49.49,0,0,0-.49,0L17.5,12.2l-4.1-4.1,1.87-3.37a.48.48,0,0,0-.24-.65L12.78,3a.49.49,0,0,0-.56.12L9,7.66,4.88,3.54,2.64,4.86a.49.49,0,0,0-.11.57L6,11.8,2.73,15.07a.49.49,0,0,0,0,.7l1.32,1.32a.49.49,0,0,0,.7,0L8.2,13.62l4.1,4.1-1.87,3.37a.48.48,0,0,0,.24.65l2.24,1.07a.48.48,0,0,0,.56-.12l3.22-4.54L21,14.07l2.24-1.32a.49.49,0,0,0,.11-.57Z" />
  </svg>
);

// Salesforce Icon
export const SalesforceIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 256 256"
    {...props}
  >
    <g fill="#00a1e0">
      <path d="M117.37,219.33a5,5,0,0,1-4.51-2.75,81,81,0,0,1,1.25-83.31,5,5,0,0,1,8.31,4.24,71.18,71.18,0,0,0-1.1,72.93,5,5,0,0,1-3.95,4.89Z" />
      <path d="M141.37,30a5,5,0,0,1,4-5.8,71.14,71.14,0,0,1,73.49,72.41,5,5,0,0,1-9.84.58,61.16,61.16,0,0,0-62.9-62.3A5,5,0,0,1,141.37,30Z" />
      <path d="M30.4,142.06a5,5,0,0,1,5.85-4,71.16,71.16,0,0,1,62.3,62.9,5,5,0,0,1-5.69,4.12,5.1,5.1,0,0,1-4.15-5.68,61.16,61.16,0,0,0-52.46-52.46A5,5,0,0,1,30.4,142.06Z" />
      <path d="M218.42,138.67a81.1,81.1,0,0,1-83.22,1.25,5,5,0,0,1,4.24-8.31,71.18,71.18,0,0,0,72.93-1.1,5,5,0,1,1,6.05,7.16Z" />
      <path d="M129.58,128.58a25.86,25.86,0,1,1,25.84-25.83A25.87,25.87,0,0,1,129.58,128.58Z" />
    </g>
  </svg>
);

// Zoho Icon
export const ZohoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    {...props}
  >
    <path fill="#f04848" d="M8.5,8.4H3.7L1,12.2V22H11.7V12.2H8.5V8.4Z" />
    <path fill="#21aa47" d="M12.3,8.4V22H23V12.2L19.7,8.4h-3.9v3.8h2.3v6.2h-7V8.4Z" />
    <path fill="#fdb822" d="M8.5,2H3.7L1,5.8V11.2H11.7V5.8H8.5V2Z" />
    <path fill="#4390e2" d="M12.3,2V7.4h10.7V5.8L19.7,2h-3.9V5.8h2.3V6.4h-7V2Z" />
  </svg>
);
