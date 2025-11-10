# Frontend Engineer (Vendor) Guide

**Your Role:** Vendor Web Portal  
**Sections:** 13  
**Duration:** Week 4-6 (8-10 days)  
**Dependencies:** Sections 7 (API Package), 8 (Utils Package)

---

## Overview

You are responsible for the vendor portal where hotels, transport providers, and activity vendors manage their orders and inventory.

**Section 13**: Build Next.js vendor portal with:
- PO (Purchase Order) management
- Voucher upload with validation
- Rate plans editor
- Driver roster management

---

## Section 13: Vendor Portal

### Timeline
- **Start**: After Sections 7 & 8 complete
- **Duration**: 8-10 days

### Prerequisites

```bash
cd apps/vendor

# Verify packages available
ls ../../packages/api/src/index.ts
ls ../../packages/utils/src/index.ts

# Install dependencies (similar to console)
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
npm install @radix-ui/react-select react-hook-form
npm install date-fns
```

### Day 1-2: Auth & Structure

**app/login/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function VendorLoginPage() {
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

      // Check if user is vendor
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user!.id)
        .single();

      if (profile?.role !== 'vendor') {
        throw new Error('Access denied. Vendors only.');
      }

      // Check if vendor exists
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', data.user!.id)
        .single();

      if (!vendor) {
        throw new Error('No vendor account found.');
      }

      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Vendor Portal</h2>
          <p className="text-gray-600 mt-2">Manage your orders and inventory</p>
        </div>
        
        {step === 'email' ? (
          <form onSubmit={sendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-blue-600 hover:text-blue-700 text-sm"
            >
              Change email address
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

### Day 3-4: Purchase Orders List & Detail

**app/orders/page.tsx:**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { formatDateTime, minutesUntil } from '@oasis/utils';
import Link from 'next/link';

export default function OrdersPage() {
  const { data: pos, isLoading } = useQuery({
    queryKey: ['vendor-pos'],
    queryFn: async () => {
      const supabase = getSupabase();
      
      // Get current vendor
      const { data: { user } } = await supabase.auth.getUser();
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user!.id)
        .single();

      // Get POs for this vendor
      const { data, error } = await supabase
        .from('pos')
        .select('*, bookings(id, customer_id)')
        .eq('vendor_id', vendor!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  const groupedPOs = {
    pending: pos?.filter(po => po.status === 'SENT') || [],
    accepted: pos?.filter(po => po.status === 'ACCEPTED') || [],
    confirmed: pos?.filter(po => po.status === 'CONFIRMED') || [],
    declined: pos?.filter(po => po.status === 'DECLINED') || [],
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Purchase Orders</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-orange-600">{groupedPOs.pending.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Accepted</p>
          <p className="text-3xl font-bold text-blue-600">{groupedPOs.accepted.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-3xl font-bold text-green-600">{groupedPOs.confirmed.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Declined</p>
          <p className="text-3xl font-bold text-red-600">{groupedPOs.declined.length}</p>
        </div>
      </div>

      {/* Pending POs (Priority) */}
      {groupedPOs.pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">
            ⏰ Requires Your Response
          </h2>
          <div className="space-y-4">
            {groupedPOs.pending.map((po) => (
              <POCard key={po.id} po={po} isPriority />
            ))}
          </div>
        </div>
      )}

      {/* Other POs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Orders</h2>
        <div className="space-y-4">
          {pos?.map((po) => (
            <POCard key={po.id} po={po} />
          ))}
        </div>
      </div>
    </div>
  );
}

function POCard({ po, isPriority = false }: { po: any; isPriority?: boolean }) {
  const isOverdue = po.due_at && new Date(po.due_at) < new Date();
  const minutesLeft = po.due_at ? minutesUntil(po.due_at) : null;

  return (
    <Link href={`/orders/${po.id}`}>
      <div className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer ${
        isPriority ? 'border-2 border-orange-300' : ''
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">PO #{po.id.slice(0, 8)}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                po.status === 'SENT' ? 'bg-orange-100 text-orange-800' :
                po.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                po.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {po.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600">
              {po.items?.length || 0} items • Created {formatDateTime(po.created_at)}
            </p>

            {po.due_at && (
              <p className={`text-sm mt-2 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                {isOverdue 
                  ? `⚠️ Overdue by ${Math.abs(minutesLeft!)} minutes`
                  : `Due in ${minutesLeft} minutes`
                }
              </p>
            )}
          </div>

          {po.status === 'SENT' && (
            <div className="space-x-2">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Accept
              </button>
              <button className="px-4 py-2 border rounded hover:bg-gray-50">
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
```

**app/orders/[id]/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getSupabase } from '@oasis/api';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: po } = useQuery({
    queryKey: ['po', params.id],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('pos')
        .select('*, bookings(*, quotes(*))')
        .eq('id', params.id as string)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('pos')
        .update({ status: 'ACCEPTED' })
        .eq('id', params.id as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po', params.id] });
      alert('PO accepted. Please upload voucher to confirm.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (reason: string) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('pos')
        .update({ 
          status: 'DECLINED',
          messages: [...(po?.messages || []), { from: 'vendor', text: reason, at: new Date().toISOString() }]
        })
        .eq('id', params.id as string);

      if (error) throw error;
    },
    onSuccess: () => {
      router.push('/orders');
    },
  });

  const handleDecline = () => {
    const reason = prompt('Please provide a reason for declining:');
    if (reason) {
      declineMutation.mutate(reason);
    }
  };

  if (!po) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700">
          ← Back to Orders
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Purchase Order</h1>
            <p className="text-gray-600">PO #{po.id}</p>
          </div>
          
          <span className={`px-3 py-1 rounded font-medium ${
            po.status === 'SENT' ? 'bg-orange-100 text-orange-800' :
            po.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
            po.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {po.status}
          </span>
        </div>

        {/* PO Items */}
        <h2 className="font-semibold mb-4">Order Items</h2>
        <div className="space-y-2 mb-6">
          {po.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between p-4 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-gray-600">Day {item.day} • {item.type}</p>
              </div>
              <p className="font-semibold">₹{item.price}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        {po.status === 'SENT' && (
          <div className="flex gap-4">
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
            >
              Accept Order
            </button>
            <button
              onClick={handleDecline}
              disabled={declineMutation.isPending}
              className="flex-1 border-2 border-red-600 text-red-600 py-3 rounded-lg hover:bg-red-50 font-medium"
            >
              Decline
            </button>
          </div>
        )}

        {po.status === 'ACCEPTED' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium mb-2">
              ✓ Order Accepted
            </p>
            <p className="text-sm text-blue-600">
              Please upload the voucher to confirm this booking.
            </p>
            <button
              onClick={() => router.push(`/orders/${po.id}/upload`)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Voucher
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Day 5-6: Voucher Upload with Validation

**app/orders/[id]/upload/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { getSupabase, rpcUploadVoucher } from '@oasis/api';

export default function VoucherUploadPage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({
    guest_name: '',
    check_in: '',
    check_out: '',
    booking_id: '',
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');

      const supabase = getSupabase();
      
      // Get PO details
      const { data: po } = await supabase
        .from('pos')
        .select('booking_id, vendor_id')
        .eq('id', params.id as string)
        .single();

      if (!po) throw new Error('PO not found');

      // Upload file to storage
      const fileName = `${po.booking_id}/${po.vendor_id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Call RPC to create voucher record
      await rpcUploadVoucher(po.booking_id, po.vendor_id, fileName, meta);

      return fileName;
    },
    onSuccess: () => {
      alert('Voucher uploaded successfully!');
      router.push('/orders');
    },
  });

  const isValid = 
    file !== null &&
    meta.guest_name.trim() !== '' &&
    meta.check_in !== '' &&
    meta.booking_id.trim() !== '';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Voucher</h1>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voucher Document (PDF) *
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-green-600">
              ✓ {file.name} selected
            </p>
          )}
        </div>

        {/* Validation Checklist */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Validation Checklist</h3>
          <p className="text-sm text-gray-600 mb-3">
            Please ensure your voucher contains the following information:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guest Name *
              </label>
              <input
                type="text"
                value={meta.guest_name}
                onChange={(e) => setMeta({ ...meta, guest_name: e.target.value })}
                placeholder="Full name as in booking"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <p className={`text-xs mt-1 ${meta.guest_name ? 'text-green-600' : 'text-gray-500'}`}>
                {meta.guest_name ? '✓ Guest name provided' : 'Required'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  value={meta.check_in}
                  onChange={(e) => setMeta({ ...meta, check_in: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className={`text-xs mt-1 ${meta.check_in ? 'text-green-600' : 'text-gray-500'}`}>
                  {meta.check_in ? '✓ Date provided' : 'Required'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={meta.check_out}
                  onChange={(e) => setMeta({ ...meta, check_out: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking/Confirmation ID *
              </label>
              <input
                type="text"
                value={meta.booking_id}
                onChange={(e) => setMeta({ ...meta, booking_id: e.target.value })}
                placeholder="Your internal booking reference"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <p className={`text-xs mt-1 ${meta.booking_id ? 'text-green-600' : 'text-gray-500'}`}>
                {meta.booking_id ? '✓ Booking ID provided' : 'Required'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 border-2 py-3 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!isValid || uploadMutation.isPending}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Voucher'}
          </button>
        </div>

        {!isValid && (
          <p className="text-sm text-red-600">
            Please complete all required fields and select a file.
          </p>
        )}
      </div>
    </div>
  );
}
```

### Day 7-8: Rate Plans Editor

**app/rates/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { formatDate } from '@oasis/utils';

export default function RatePlansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: ratePlans } = useQuery({
    queryKey: ['rate-plans'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user!.id)
        .single();

      const { data, error } = await supabase
        .from('rate_plans')
        .select('*')
        .eq('vendor_id', vendor!.id)
        .order('season_start', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rate Plans</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Rate Plan
        </button>
      </div>

      {showForm && (
        <RatePlanForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
          }}
        />
      )}

      <div className="space-y-4">
        {ratePlans?.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{plan.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(plan.season_start)} - {formatDate(plan.season_end)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Weekday</p>
                    <p className="font-semibold">₹{plan.weekday_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weekend</p>
                    <p className="font-semibold">₹{plan.weekend_price}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-x-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatePlanForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    season_start: '',
    season_end: '',
    weekday_price: 0,
    weekend_price: 0,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user!.id)
        .single();

      const { error } = await supabase
        .from('rate_plans')
        .insert({ ...formData, vendor_id: vendor!.id });

      if (error) throw error;
    },
    onSuccess,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">New Rate Plan</h2>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Title (e.g., Summer Season 2024)"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Season Start</label>
            <input
              type="date"
              value={formData.season_start}
              onChange={(e) => setFormData({ ...formData, season_start: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Season End</label>
            <input
              type="date"
              value={formData.season_end}
              onChange={(e) => setFormData({ ...formData, season_end: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Weekday Price</label>
            <input
              type="number"
              value={formData.weekday_price}
              onChange={(e) => setFormData({ ...formData, weekday_price: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Weekend Price</label>
            <input
              type="number"
              value={formData.weekend_price}
              onChange={(e) => setFormData({ ...formData, weekend_price: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Rate Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Day 9-10: Driver Management & Polish

**app/drivers/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';

export default function DriversPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user!.id)
        .single();

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('vendor_id', vendor!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Driver Roster</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Driver
        </button>
      </div>

      {showForm && (
        <DriverForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
          }}
        />
      )}

      <div className="grid gap-4">
        {drivers?.map((driver) => (
          <div key={driver.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{driver.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {driver.vehicle_type} • {driver.vehicle_number}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {driver.phone}
                </p>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                  driver.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {driver.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-x-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50">
                  {driver.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: 'sedan',
    vehicle_number: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user!.id)
        .single();

      const { error } = await supabase
        .from('drivers')
        .insert({ ...formData, vendor_id: vendor!.id });

      if (error) throw error;
    },
    onSuccess,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Add New Driver</h2>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Driver Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />

        <select
          value={formData.vehicle_type}
          onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="sedan">Sedan</option>
          <option value="suv">SUV</option>
          <option value="tempo">Tempo Traveller</option>
          <option value="bus">Bus</option>
        </select>

        <input
          type="text"
          placeholder="Vehicle Number (e.g., RJ14AB1234)"
          value={formData.vehicle_number}
          onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !formData.name}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {createMutation.isPending ? 'Adding...' : 'Add Driver'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Deliverables Checklist

- [ ] Vendor login with email OTP
- [ ] Role-based access (vendors only)
- [ ] Dashboard with PO statistics
- [ ] Purchase orders list with filters
- [ ] PO detail page
- [ ] Accept/Decline PO functionality
- [ ] Voucher upload form
- [ ] Voucher validation checklist
- [ ] Metadata extraction (guest name, dates, booking ID)
- [ ] Rate plans list
- [ ] Rate plan creation/editing
- [ ] Seasonal pricing (weekday/weekend)
- [ ] Driver roster management
- [ ] Driver add/edit/activate/deactivate
- [ ] SLA countdown timers on POs
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states

---

## Success Criteria

✅ Complete When:
- Vendors can manage POs end-to-end
- Voucher upload works with validation
- Rate plans can be created and edited
- Driver roster fully manageable
- SLA timers visible and accurate
- UI professional and responsive
- All critical workflows tested

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [React Hook Form](https://react-hook-form.com/)

