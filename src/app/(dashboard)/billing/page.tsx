
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, CreditCard, CheckCircle2, ArrowRight, PlusCircle } from 'lucide-react';
import { UpdateCardDialog } from '@/components/update-card-dialog';

const billingHistory = [
    { invoice: 'INV-2024-005', date: 'June 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-004', date: 'May 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-003', date: 'April 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-002', date: 'March 1, 2024', amount: '$50.00', status: 'Paid' },
];

const plans = [
    {
      name: 'Free',
      price: '$0',
      priceFrequency: '/ month',
      description: 'For individuals and small teams just getting started.',
      features: [
        '1,000 Workflow Runs',
        '2 Team Members',
        'Community Support',
        'Basic Integrations',
      ],
      credits: {
          price: '$10',
          amount: '1,000 Credits'
      },
      isCurrent: true,
      buttonText: 'Current Plan',
      variant: 'outline' as const
    },
    {
      name: 'Growth',
      price: '$49',
      priceFrequency: '/ month',
      description: 'For growing teams that need more power and automation.',
      features: [
        '10,000 Workflow Runs',
        '5 Team Members',
        'Email & Chat Support',
        'Advanced Integrations',
        'Access to AI Features',
      ],
      credits: {
          price: '$10',
          amount: '1,200 Credits'
      },
      buttonText: 'Upgrade',
      variant: 'default' as const
    },
    {
      name: 'Advanced',
      price: '$99',
      priceFrequency: '/ month',
      description: 'For businesses that require advanced features and support.',
      features: [
        '50,000 Workflow Runs',
        '15 Team Members',
        'Priority Support',
        'Custom Integrations',
        'Dedicated AI Models',
      ],
       credits: {
          price: '$10',
          amount: '1,500 Credits'
      },
       buttonText: 'Upgrade',
       variant: 'default' as const
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      priceFrequency: '',
      description: 'For large organizations with custom needs and security requirements.',
      features: [
        'Unlimited Workflow Runs',
        'Unlimited Team Members',
        '24/7 Dedicated Support',
        'On-premise Deployment',
        'Security & Compliance Reviews',
      ],
      credits: {
          price: 'Custom',
          amount: 'Custom Credits'
      },
      buttonText: 'Contact Sales',
      variant: 'outline' as const
    },
];

export default function BillingPage() {
  const [isUpdateCardOpen, setIsUpdateCardOpen] = useState(false);
  const [cardInfo, setCardInfo] = useState({
      endingIn: '4242',
      expires: '06/2028'
  });

  const handleCardUpdate = (newCardData: { endingIn: string; expires: string; }) => {
    setCardInfo(newCardData);
  }

  return (
    <>
    <div className="grid flex-1 items-start gap-8 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col ${plan.name === 'Growth' ? 'border-primary shadow-lg' : ''}`}>
            <CardHeader className="pb-4">
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.priceFrequency && <span className="text-muted-foreground ml-1">{plan.priceFrequency}</span>}
                </div>
                <ul className="space-y-3">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
                <Separator />
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Need more credits?</h4>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">{plan.credits.amount}</p>
                            <p className="text-sm text-muted-foreground">{plan.credits.price}</p>
                        </div>
                        <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Buy
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" variant={plan.variant} disabled={plan.isCurrent}>
                    {plan.buttonText}
                    {!plan.isCurrent && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                        Manage your payment information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">Visa ending in **** {cardInfo.endingIn}</p>
                                <p className="text-sm text-muted-foreground">Expires {cardInfo.expires}</p>
                            </div>
                        </div>
                         <Button variant="outline" onClick={() => setIsUpdateCardOpen(true)}>Update</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
            <CardHeader className="px-7">
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Review your past invoices and payment details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                     <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((item) => (
                     <TableRow key={item.invoice}>
                        <TableCell>
                            <div className="font-medium">{item.invoice}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{item.date}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                            <Badge className="text-xs" variant={item.status === 'Paid' ? 'default' : 'secondary'}>
                                {item.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.amount}</TableCell>
                        <TableCell className="text-right">
                             <Button size="icon" variant="outline">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download Invoice</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
             <Card>
                <CardHeader className="p-4">
                    <CardTitle>Current Plan Usage</CardTitle>
                    <CardDescription>You are on the <span className="font-semibold text-primary">Free</span> Plan.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid gap-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Workflow Runs</span>
                            <span>250 / 1,000</span>
                        </div>
                        <Progress value={25} aria-label="25% of workflow runs used" />
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Team Members</span>
                            <span>1 / 2</span>
                        </div>
                        <Progress value={50} aria-label="50% of team member seats used" />
                     </div>
                </CardContent>
                 <CardFooter className="flex flex-col items-start gap-2 border-t p-4">
                    <p className="text-sm text-muted-foreground">
                        Your plan renews on July 1, 2024.
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto">Manage Subscription</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
    <UpdateCardDialog 
        open={isUpdateCardOpen} 
        onOpenChange={setIsUpdateCardOpen}
        onCardUpdated={handleCardUpdate}
    />
    </>
  );
}
