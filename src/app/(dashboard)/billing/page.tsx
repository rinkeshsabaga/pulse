
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
import { Download, CreditCard, CheckCircle2, ArrowRight, PlusCircle, Zap } from 'lucide-react';
import { UpdateCardDialog } from '@/components/update-card-dialog';
import { useToast } from '@/hooks/use-toast';

const billingHistory = [
    { invoice: 'INV-2024-005', date: 'June 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-004', date: 'May 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-003', date: 'April 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-002', date: 'March 1, 2024', amount: '$50.00', status: 'Paid' },
];

const plansData = [
    {
      name: 'Free',
      price: '$0',
      priceFrequency: '/ month',
      description: 'For individuals and small teams just getting started.',
      features: [
        '1,000 Credits / month',
        '2 Team Members',
        'Community Support',
        'Basic Integrations',
      ],
      credits: {
          price: '$10',
          amount: '1,000 Credits'
      },
      monthlyCredits: 1000,
    },
    {
      name: 'Growth',
      price: '$49',
      priceFrequency: '/ month',
      description: 'For growing teams that need more power and automation.',
      features: [
        '10,000 Credits / month',
        '5 Team Members',
        'Email & Chat Support',
        'Advanced Integrations',
        'Access to AI Features',
      ],
      credits: {
          price: '$10',
          amount: '1,200 Credits'
      },
      monthlyCredits: 10000,
    },
    {
      name: 'Advanced',
      price: '$99',
      priceFrequency: '/ month',
      description: 'For businesses that require advanced features and support.',
      features: [
        '50,000 Credits / month',
        '15 Team Members',
        'Priority Support',
        'Custom Integrations',
        'Dedicated AI Models',
      ],
       credits: {
          price: '$10',
          amount: '1,500 Credits'
      },
      monthlyCredits: 50000,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      priceFrequency: '',
      description: 'For large organizations with custom needs and security requirements.',
      features: [
        'Unlimited Credits',
        'Unlimited Team Members',
        '24/7 Dedicated Support',
        'On-premise Deployment',
        'Security & Compliance Reviews',
      ],
      credits: {
          price: 'Custom',
          amount: 'Custom Credits'
      },
      monthlyCredits: 'Unlimited',
    },
];

const creditPricing = [
    { node: 'Any Trigger', cost: '1 Credit' },
    { node: 'API Request', cost: '1 Credit' },
    { node: 'Custom Code / AI Function', cost: '1 Credit' },
    { node: 'Other Actions', cost: '1 Credit' },
    { node: 'Wait Node', cost: '1 Credit / day' },
];

export default function BillingPage() {
  const [isUpdateCardOpen, setIsUpdateCardOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [cardInfo, setCardInfo] = useState({
      endingIn: '4242',
      expires: '06/2028'
  });
  const { toast } = useToast();

  const handleCardUpdate = (newCardData: { endingIn: string; expires: string; }) => {
    setCardInfo(newCardData);
  }

  const handlePlanChange = (planName: string) => {
    if (planName === 'Enterprise') {
        toast({
            title: 'Contact Sales',
            description: 'Please get in touch with our sales team to discuss your needs.'
        });
        // Optionally, you could open a mailto link:
        // window.location.href = "mailto:sales@sabagapulse.com";
        return;
    }
    setCurrentPlan(planName);
    toast({
        title: 'Plan Updated!',
        description: `You have successfully upgraded to the ${planName} plan.`
    });
  }
  
  const currentPlanDetails = plansData.find(p => p.name === currentPlan);

  return (
    <>
    <div className="grid flex-1 items-start gap-8 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        {plansData.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          let buttonText = 'Upgrade';
          if (isCurrent) buttonText = 'Current Plan';
          if (plan.name === 'Enterprise') buttonText = 'Contact Sales';

          return (
            <Card key={plan.name} className={`flex flex-col ${isCurrent ? 'border-primary shadow-lg' : ''}`}>
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
                  <Button 
                    className="w-full" 
                    variant={isCurrent || plan.name === 'Enterprise' ? 'outline' : 'default'}
                    disabled={isCurrent}
                    onClick={() => handlePlanChange(plan.name)}
                  >
                      {buttonText}
                      {!isCurrent && plan.name !== 'Enterprise' && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Credit Usage & Pricing</CardTitle>
                    <CardDescription>
                        Credits are used for each operation within your workflows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Node Type</TableHead>
                            <TableHead className="text-right">Credits per Use</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {creditPricing.map((item) => (
                            <TableRow key={item.node}>
                                <TableCell>
                                    <div className="font-medium flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-primary/70" />
                                        {item.node}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{item.cost}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
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
                    <CardDescription>You are on the <span className="font-semibold text-primary">{currentPlan}</span> Plan.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid gap-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Monthly Credits</span>
                            <span>250 / {currentPlanDetails?.monthlyCredits}</span>
                        </div>
                        <Progress value={(250 / (currentPlanDetails?.monthlyCredits === 'Unlimited' ? Infinity : currentPlanDetails?.monthlyCredits || 1)) * 100} aria-label="Credit usage" />
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Team Members</span>
                            <span>1 / {currentPlanDetails?.features[1].split(' ')[0]}</span>
                        </div>
                        <Progress value={50} aria-label="50% of team member seats used" />
                     </div>
                </CardContent>
                 <CardFooter className="flex flex-col items-start gap-2 border-t p-4">
                    <p className="text-sm text-muted-foreground">
                        Your plan renews on July 1, 2024.
                    </p>
                    <div className="flex w-full items-center justify-between">
                         <Button variant="link" size="sm" className="p-0 h-auto">Manage Subscription</Button>
                         <Button variant="outline" size="sm">Add Credits</Button>
                    </div>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
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
