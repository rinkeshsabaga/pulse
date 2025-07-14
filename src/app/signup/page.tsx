
'use client';

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/icons"

export default function SignupPage() {
    const router = useRouter();

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd have signup logic here.
        // For this prototype, we'll just redirect to the dashboard.
        router.push('/workflows');
    }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="mx-auto w-full max-w-sm">
            <CardHeader>
                 <div className="flex justify-center mb-4">
                    <Logo className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl text-center font-headline">Create an Account</CardTitle>
                <CardDescription className="text-center">
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSignup}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input id="full-name" placeholder="Sabaga User" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required/>
                        </div>
                        <Button type="submit" className="w-full">
                            Create an account
                        </Button>
                        <Button variant="outline" className="w-full" type="button">
                            Sign up with Google
                        </Button>
                    </div>
                </form>
                <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                    Login
                </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
