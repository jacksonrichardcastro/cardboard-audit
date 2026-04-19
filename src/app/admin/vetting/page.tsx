"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// Mock data representing database pending sellers
const INITIAL_APPLICATIONS = [
  {
    id: "user_new_1",
    businessName: "Holo Hits",
    description: "I've been selling Pokemon and Lorcana primarily on Whatnot for 2 years.",
    identityVerified: true,
    status: "pending",
    date: "A few minutes ago"
  },
  {
    id: "user_new_2",
    businessName: "Deep Run Collectibles",
    description: "Selling rare NBA and NFL slabs.",
    identityVerified: true,
    status: "pending",
    date: "1 hour ago"
  }
];

export default function AdminVettingDashboard() {
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);

  const handleAction = (id: string, action: "approved" | "rejected") => {
    setApplications(prev => prev.filter(app => app.id !== id));
    // Here we would call a server action updating `sellers.applicationStatus` 
    // and trigger an email to the user.
    console.log(`Application ${id} ${action}`);
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Admin HQ
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Seller Vetting Queue</p>
        </div>

        <Card className="bg-card/40 backdrop-blur-lg border-white/5 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Pending Applications ({applications.length})
            </CardTitle>
            <CardDescription>
              Review identity-verified sellers before they are permitted to list items on CardBound.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500/50" />
                <p>Inbox zero. All applications reviewed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Business Info</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium align-top">
                        <p className="text-foreground text-base">{app.businessName}</p>
                        <p className="text-xs text-muted-foreground mt-1">{app.date}</p>
                      </TableCell>
                      <TableCell className="align-top max-w-sm">
                        <p className="text-sm text-muted-foreground line-clamp-2">{app.description}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        {app.identityVerified ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Stripe Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAction(app.id, "rejected")} className="border-white/10 hover:bg-destructive/20 hover:text-destructive">
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" onClick={() => handleAction(app.id, "approved")} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
