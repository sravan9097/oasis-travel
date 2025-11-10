'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../lib/supabase';
import { formatDateTime, minutesUntil } from '@oasis/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrdersPage() {
  const router = useRouter();

  const { data: pos, isLoading } = useQuery({
    queryKey: ['vendor-pos'],
    queryFn: async () => {
      const supabase = getSupabase();
      
      // Get current vendor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return [];
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!vendor) {
        router.push('/login');
        return [];
      }

      // Get POs for this vendor
      const { data, error } = await supabase
        .from('pos')
        .select('*, bookings(id, customer_id)')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) return <div className="p-6">Loading...</div>;

  const groupedPOs = {
    pending: pos?.filter(po => po.status === 'SENT') || [],
    accepted: pos?.filter(po => po.status === 'ACCEPTED') || [],
    confirmed: pos?.filter(po => po.status === 'CONFIRMED') || [],
    declined: pos?.filter(po => po.status === 'DECLINED') || [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Vendor Portal
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/orders"
                className="text-blue-600 font-medium px-3 py-2 rounded-md text-sm"
              >
                Orders
              </Link>
              <Link
                href="/rates"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Rate Plans
              </Link>
              <Link
                href="/drivers"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Drivers
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {pos && pos.length > 0 ? (
              pos.map((po) => (
                <POCard key={po.id} po={po} />
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                No purchase orders found
              </div>
            )}
          </div>
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
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Accept
              </button>
              <button 
                className="px-4 py-2 border rounded hover:bg-gray-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

