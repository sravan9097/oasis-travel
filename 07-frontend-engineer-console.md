# Frontend Engineer (Console) Guide

**Your Role:** Operator Web Console  
**Sections:** 12  
**Duration:** Week 4-6 (10-12 days)  
**Dependencies:** Sections 7 (API Package), 8 (Utils Package)

---

## Overview

You are responsible for the operator web console - the command center for managing all travel operations.

**Section 12**: Build comprehensive Next.js operator console with:
- Leads Kanban board
- Quote builder
- Unified Trip Workspace
- Vendor PO management
- SLA monitoring
- Incident management

---

## Section 12: Web Console (Operator)

### Timeline
- **Start**: After Sections 7 & 8 complete
- **Duration**: 10-12 days

### Prerequisites

```bash
cd apps/console

# Verify packages available
ls ../../packages/api/src/index.ts
ls ../../packages/utils/src/index.ts

# Install additional dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
npm install @radix-ui/react-tabs @radix-ui/react-select
npm install react-hook-form @hookform/resolvers
npm install date-fns recharts
```

### Day 1-2: App Structure & Auth

**Create folder structure:**
```
app/
  layout.tsx
  page.tsx
  login/
    page.tsx
  dashboard/
    page.tsx
  leads/
    page.tsx
    [id]/
      page.tsx
  quotes/
    [id]/
      page.tsx
  bookings/
    [id]/
      page.tsx
  vendors/
    page.tsx
    [id]/
      page.tsx
  alerts/
    page.tsx
  admin/
    page.tsx
```

**app/lib/supabase.ts:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { initSupabase } from '@oasis/api';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = initSupabase(supabaseUrl, supabaseAnonKey);
```

**app/login/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setStep('otp');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      
      if (error) throw error;

      // Check if user is operator/admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user!.id)
        .single();

      if (profile?.role !== 'operator' && profile?.role !== 'admin') {
        throw new Error('Access denied. Operators only.');
      }

      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Operator Console</h2>
        
        {step === 'email' ? (
          <form onSubmit={sendOTP} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

### Day 3-4: Leads Kanban Board

**app/leads/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getLeads, getSupabase } from '@oasis/api';
import { formatDate } from '@oasis/utils';
import { LeadCard } from '../components/LeadCard';

const STAGES = ['NEW', 'SCOPING', 'QUOTED', 'WON', 'LOST'];

export default function LeadsPage() {
  const queryClient = useQueryClient();
  
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: string; newStage: string }) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('leads')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;

    updateStageMutation.mutate({ leadId, newStage });
  };

  const groupedLeads = STAGES.reduce((acc, stage) => {
    acc[stage] = leads?.filter((lead) => lead.stage === stage) || [];
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + New Lead
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map((stage) => (
            <div key={stage} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-sm uppercase text-gray-600">
                {stage} ({groupedLeads[stage].length})
              </h3>
              
              <SortableContext
                items={groupedLeads[stage].map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {groupedLeads[stage].map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
```

**app/components/LeadCard.tsx:**
```typescript
import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate } from '@oasis/utils';

interface Props {
  lead: any;
}

export function LeadCard({ lead }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow cursor-move hover:shadow-md"
    >
      <Link href={`/leads/${lead.id}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm">
              Lead #{lead.id.slice(0, 8)}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(lead.created_at)}
            </span>
          </div>
          
          {lead.notes && (
            <p className="text-sm text-gray-600 line-clamp-2">{lead.notes}</p>
          )}
          
          <div className="flex gap-2 text-xs">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {lead.source}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
```

### Day 5-6: Quote Builder

**app/quotes/[id]/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getSupabase, rpcSendQuote } from '@oasis/api';
import { formatINR } from '@oasis/utils';
import { QuoteItemRow } from '../../components/QuoteItemRow';

export default function QuoteBuilderPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const queryClient = useQueryClient();

  const { data: quote } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('quotes')
        .select('*, quote_items(*), leads!inner(request_docs(*))')
        .eq('id', quoteId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const [newItem, setNewItem] = useState({
    day_no: 1,
    item_type: 'hotel',
    description: '',
    qty: 1,
    unit_price: 0,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('quote_items')
        .insert({ ...newItem, quote_id: quoteId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      setNewItem({
        day_no: 1,
        item_type: 'hotel',
        description: '',
        qty: 1,
        unit_price: 0,
      });
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: () => rpcSendQuote(quoteId),
    onSuccess: () => {
      alert('Quote sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
    },
  });

  const total = quote?.quote_items?.reduce(
    (sum: number, item: any) => sum + item.qty * item.unit_price,
    0
  ) || 0;

  if (!quote) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quote Builder</h1>
        <div className="space-x-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Preview PDF
          </button>
          <button
            onClick={() => sendQuoteMutation.mutate()}
            disabled={quote.status !== 'DRAFT'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send Quote
          </button>
        </div>
      </div>

      {/* Quote Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Version</label>
            <p className="font-semibold">{quote.version}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <p className="font-semibold">{quote.status}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Total</label>
            <p className="text-2xl font-bold">{formatINR(total)}</p>
          </div>
        </div>
      </div>

      {/* Day Timeline */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Itinerary</h2>
        
        {/* Group items by day */}
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const dayItems = quote.quote_items?.filter((item: any) => item.day_no === day) || [];
          
          return (
            <div key={day} className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Day {day}</h3>
              
              {dayItems.length === 0 ? (
                <p className="text-gray-400 text-sm">No items added</p>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((item: any) => (
                    <QuoteItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Item Form */}
      {quote.status === 'DRAFT' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add Item</h2>
          
          <div className="grid grid-cols-5 gap-4 mb-4">
            <select
              value={newItem.day_no}
              onChange={(e) => setNewItem({ ...newItem, day_no: Number(e.target.value) })}
              className="border rounded-lg px-3 py-2"
            >
              {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>Day {day}</option>
              ))}
            </select>

            <select
              value={newItem.item_type}
              onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="hotel">Hotel</option>
              <option value="cab">Transport</option>
              <option value="activity">Activity</option>
              <option value="misc">Miscellaneous</option>
            </select>

            <input
              type="text"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Description"
              className="border rounded-lg px-3 py-2 col-span-2"
            />

            <input
              type="number"
              value={newItem.unit_price}
              onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
              placeholder="Price"
              className="border rounded-lg px-3 py-2"
            />
          </div>

          <button
            onClick={() => addItemMutation.mutate()}
            disabled={!newItem.description}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            + Add Item
          </button>
        </div>
      )}
    </div>
  );
}
```

### Day 7-9: Unified Trip Workspace

**app/bookings/[id]/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getSupabase } from '@oasis/api';
import * as Tabs from '@radix-ui/react-tabs';

export default function TripWorkspacePage() {
  const params = useParams();
  const bookingId = params.id as string;

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          quotes(*),
          pos(*),
          vouchers(*),
          trips(*, trip_posts(*), incidents(*))
        `)
        .eq('id', bookingId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (!booking) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Trip Workspace</h1>

      <Tabs.Root defaultValue="overview" className="w-full">
        <Tabs.List className="flex border-b mb-6">
          <Tabs.Trigger value="overview" className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600">
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="quote" className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600">
            Quote
          </Tabs.Trigger>
          <Tabs.Trigger value="vendors" className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600">
            Vendors & POs
          </Tabs.Trigger>
          <Tabs.Trigger value="comms" className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600">
            Communications
          </Tabs.Trigger>
          <Tabs.Trigger value="docs" className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600">
            Documents
          </Tabs.Trigger>
          <Tabs.Trigger value="issues" className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600">
            Issues
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <OverviewTab booking={booking} />
        </Tabs.Content>

        <Tabs.Content value="quote">
          <QuoteTab quote={booking.quotes} />
        </Tabs.Content>

        <Tabs.Content value="vendors">
          <VendorsTab pos={booking.pos} />
        </Tabs.Content>

        <Tabs.Content value="comms">
          <CommsTab trip={booking.trips} />
        </Tabs.Content>

        <Tabs.Content value="docs">
          <DocsTab vouchers={booking.vouchers} />
        </Tabs.Content>

        <Tabs.Content value="issues">
          <IssuesTab incidents={booking.trips?.incidents || []} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function OverviewTab({ booking }: { booking: any }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Status</h3>
        <p className="text-2xl font-bold">{booking.status}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-2">POs Sent</h3>
        <p className="text-2xl font-bold">{booking.pos?.length || 0}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Vouchers</h3>
        <p className="text-2xl font-bold">{booking.vouchers?.length || 0}</p>
      </div>
    </div>
  );
}

function QuoteTab({ quote }: { quote: any }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Quote Snapshot</h2>
      <pre className="bg-gray-50 p-4 rounded overflow-auto">
        {JSON.stringify(quote, null, 2)}
      </pre>
    </div>
  );
}

function VendorsTab({ pos }: { pos: any[] }) {
  return (
    <div className="space-y-4">
      {pos?.map((po) => (
        <div key={po.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">PO #{po.id.slice(0, 8)}</h3>
              <p className="text-sm text-gray-600">Status: {po.status}</p>
            </div>
            
            {po.due_at && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Due</p>
                <p className="font-semibold">{new Date(po.due_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          
          <div className="space-x-2">
            <button className="px-3 py-1 border rounded hover:bg-gray-50">
              View Details
            </button>
            <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
              Mark Confirmed
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommsTab({ trip }: { trip: any }) {
  return (
    <div className="space-y-4">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        + Create Post
      </button>
      
      {trip?.trip_posts?.map((post: any) => (
        <div key={post.id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold">{post.content.title}</h3>
          <p className="text-gray-600 mt-2">{post.content.body}</p>
          <p className="text-sm text-gray-400 mt-2">Status: {post.status}</p>
        </div>
      ))}
    </div>
  );
}

function DocsTab({ vouchers }: { vouchers: any[] }) {
  return (
    <div className="space-y-4">
      {vouchers?.map((voucher) => (
        <div key={voucher.id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Voucher #{voucher.id.slice(0, 8)}</h3>
            <p className="text-sm text-gray-600">
              {voucher.verified ? '✓ Verified' : '⚠ Pending Verification'}
            </p>
          </div>
          
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            View Document
          </button>
        </div>
      ))}
    </div>
  );
}

function IssuesTab({ incidents }: { incidents: any[] }) {
  return (
    <div className="space-y-4">
      {incidents?.map((incident) => (
        <div key={incident.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-block px-2 py-1 rounded text-sm ${
                incident.severity === 'P0' ? 'bg-red-100 text-red-800' :
                incident.severity === 'P1' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {incident.severity}
              </span>
              <h3 className="font-semibold mt-2">{incident.category}</h3>
              <p className="text-gray-600 mt-1">{incident.description}</p>
            </div>
            
            <span className="text-sm text-gray-600">{incident.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Day 10: SLA Monitoring & Alerts

**app/alerts/page.tsx:**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { minutesUntil, formatDateTime } from '@oasis/utils';

export default function AlertsPage() {
  const { data: overduePOs } = useQuery({
    queryKey: ['overdue-pos'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('pos')
        .select('*, vendors(name), bookings(id)')
        .in('status', ['SENT', 'ACCEPTED'])
        .lt('due_at', new Date().toISOString());
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: p0Incidents } = useQuery({
    queryKey: ['p0-incidents'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('incidents')
        .select('*, trips(title)')
        .eq('severity', 'P0')
        .in('status', ['OPEN', 'ACK']);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Alerts & SLA Monitoring</h1>

      {/* P0 Incidents */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          🚨 P0 Emergencies ({p0Incidents?.length || 0})
        </h2>
        
        <div className="space-y-4">
          {p0Incidents?.map((incident) => (
            <div key={incident.id} className="bg-red-50 border-2 border-red-200 p-6 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{incident.trips.title}</h3>
                  <p className="text-red-800 mt-2">{incident.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Created: {formatDateTime(incident.created_at)}
                  </p>
                </div>
                
                <div className="space-x-2">
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Acknowledge
                  </button>
                  <button className="px-4 py-2 border rounded hover:bg-gray-50">
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {!p0Incidents?.length && (
            <p className="text-gray-500">No active P0 incidents</p>
          )}
        </div>
      </div>

      {/* Overdue POs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-orange-600">
          ⚠️ Overdue Purchase Orders ({overduePOs?.length || 0})
        </h2>
        
        <div className="space-y-4">
          {overduePOs?.map((po) => (
            <div key={po.id} className="bg-orange-50 border-2 border-orange-200 p-6 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{po.vendors.name}</h3>
                  <p className="text-sm text-gray-600">
                    PO #{po.id.slice(0, 8)} • Status: {po.status}
                  </p>
                  <p className="text-sm text-orange-800 mt-1">
                    Overdue by {Math.abs(minutesUntil(po.due_at))} minutes
                  </p>
                </div>
                
                <div className="space-x-2">
                  <button className="px-4 py-2 border rounded hover:bg-gray-50">
                    Send Reminder
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    View Booking
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {!overduePOs?.length && (
            <p className="text-gray-500">No overdue purchase orders</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Day 11-12: Polish & Testing

Add remaining components and polish:

- Sidebar navigation
- Dashboard with metrics
- Vendor management page
- Admin settings page
- Responsive design
- Error boundaries
- Loading states
- Toast notifications

---

## Deliverables Checklist

- [ ] Login with email OTP
- [ ] Role-based access (operators only)
- [ ] Dashboard with key metrics
- [ ] Leads Kanban board with drag-drop
- [ ] Lead detail page
- [ ] Quote builder with day timeline
- [ ] Add/edit quote items
- [ ] Send quote functionality
- [ ] Unified Trip Workspace with 6 tabs
- [ ] PO management with status tracking
- [ ] SLA countdown timers
- [ ] Trip Channel post management
- [ ] Voucher verification UI
- [ ] Incident management panel
- [ ] Alerts page with P0/overdue POs
- [ ] Vendor management pages
- [ ] Admin settings page
- [ ] Responsive design (desktop + tablet)
- [ ] Error handling
- [ ] Loading states

---

## Success Criteria

✅ Complete When:
- Operators can manage entire workflow
- Leads board functional with drag-drop
- Quote builder creates quotes
- Trip workspace shows all data
- SLA monitoring works with real-time updates
- Incidents properly categorized and tracked
- UI responsive and professional
- No critical bugs

---

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Radix UI Components](https://www.radix-ui.com/)
- [dnd-kit Documentation](https://docs.dndkit.com/)
- [React Hook Form](https://react-hook-form.com/)

