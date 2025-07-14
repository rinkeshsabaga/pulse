
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
import { Download, CreditCard, PlusCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const billingHistory = [
    { invoice: 'INV-2024-005', date: 'June 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-004', date: 'May 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-003', date: 'April 1, 2024', amount: '$50.00', status: 'Paid' },
    { invoice: 'INV-2024-002', date: 'March 1, 2024', amount: '$50.00', status: 'Paid' },
];

export default function BillingPage() {
  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
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
                                <p className="font-semibold">Visa ending in **** 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 06/2028</p>
                            </div>
                        </div>
                         <Button variant="outline">Update</Button>
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
        
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
            <Card className="shadow-none border-dashed">
                <CardHeader className="p-4">
                    <CardTitle>Upgrade to Pro</CardTitle>
                    <CardDescription>
                        Unlock more workflow runs, advanced features, and priority support.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <Button size="sm" className="w-full">
                       <ExternalLink className="mr-2 h-4 w-4" />
                        Upgrade
                    </Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="p-4">
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>You are currently on the Free Plan.</CardDescription>
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
                            <span>1 / 1</span>
                        </div>
                        <Progress value={100} aria-label="100% of team member seats used" />
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
  );
}
