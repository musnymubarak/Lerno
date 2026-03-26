import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Master Any Subject with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Lerno
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Connect with expert tutors for personalized 1-on-1 learning. 
              The most trusted peer-to-peer education marketplace.
            </p>

            {/* Mock Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Input 
                  placeholder="What do you want to learn? (Math, Physics, JS...)" 
                  className="bg-white border-transparent focus:ring-0 h-12"
                />
              </div>
              <Link href="/tutors">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8">
                  Find Tutors
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Tutors
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure Payments
              </span>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 blur-[120px] rounded-full" />
        </div>
      </section>

      {/* Featured Categories / Stats can go here */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-8 text-center text-slate-900">
                <h3 className="text-xl font-bold mb-2">Expert Instruction</h3>
                <p className="text-slate-600">Learn from professionals and subject matter experts qualified in their fields.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8 text-center">
                <h3 className="text-xl font-bold mb-2">Flexible Scheduling</h3>
                <p className="text-slate-600">Book sessions that fit your busy life, anytime and anywhere in the world.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8 text-center">
                <h3 className="text-xl font-bold mb-2">Affordable Rates</h3>
                <p className="text-slate-600">Find quality education that fits your budget with transparent hourly pricing.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
