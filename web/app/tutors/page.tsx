"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  hourlyRate: number;
  bio?: string;
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTutors = async () => {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      try {
        const response = await fetch(`${apiUrl}/tutors`, {
          // Critical: handle httpOnly session cookies if any
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tutors");
        }

        const data = await response.json();
        setTutors(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        
        // Mock data for demonstration if API fails or is empty
        setTutors([
          { id: "1", name: "Alice Smith", subjects: ["Mathematics", "Physics"], hourlyRate: 45 },
          { id: "2", name: "Bob Johnson", subjects: ["Computer Science", "React"], hourlyRate: 60 },
          { id: "3", name: "Charlie Brown", subjects: ["History", "Literature"], hourlyRate: 35 },
          { id: "4", name: "Diana Prince", subjects: ["English", "French"], hourlyRate: 40 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter(tutor => 
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Find Your Perfect Tutor</h1>
          <p className="text-slate-600 mt-2">Browse our community of expert educators.</p>
        </div>
        <div className="w-full md:w-96">
          <Input 
            placeholder="Search by name or subject..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : error && tutors.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <Card key={tutor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                    {tutor.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">${tutor.hourlyRate}</span>
                    <span className="text-slate-500 text-sm block">per hour</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{tutor.name}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.subjects.map((subject) => (
                    <span 
                      key={subject} 
                      className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
                <Button variant="outline" className="w-full">View Profile</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredTutors.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          No tutors found matching your search.
        </div>
      )}
    </div>
  );
}
