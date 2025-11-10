'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getSupabase } from '../../../lib/supabase';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['vendor-pos'] });
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
      queryClient.invalidateQueries({ queryKey: ['po', params.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-pos'] });
      router.push('/orders');
    },
  });

  const handleDecline = () => {
    const reason = prompt('Please provide a reason for declining:');
    if (reason) {
      declineMutation.mutate(reason);
    }
  };

  if (!po) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700 mr-4">
                ← Back
              </button>
              <span className="text-xl font-bold text-gray-900">Vendor Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
}

