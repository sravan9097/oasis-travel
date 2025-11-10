'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getVendor, getRatePlans, getSupabase } from '@oasis/api';
import { formatDate } from '@oasis/utils';
import Link from 'next/link';

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => getVendor(vendorId),
  });

  const { data: ratePlans, isLoading: ratePlansLoading } = useQuery({
    queryKey: ['rate-plans', vendorId],
    queryFn: () => getRatePlans(vendorId),
    enabled: !!vendorId,
  });

  const { data: pos, isLoading: posLoading } = useQuery({
    queryKey: ['vendor-pos', vendorId],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('pos')
        .select('*, bookings(id)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendorId,
  });

  if (vendorLoading || ratePlansLoading || posLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Vendor not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/vendors"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Vendors
        </Link>
        <h1 className="text-3xl font-bold">{vendor.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Vendor Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <p className="font-medium">{vendor.type}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <p className="font-medium">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm ${
                      vendor.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {vendor.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              {vendor.contact_email && (
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{vendor.contact_email}</p>
                </div>
              )}
              {vendor.contact_phone && (
                <div>
                  <label className="text-sm text-gray-600">Phone</label>
                  <p className="font-medium">{vendor.contact_phone}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600">SLA Hours</label>
                <p className="font-medium">{vendor.sla_hours} hours</p>
              </div>
              {vendor.gstin && (
                <div>
                  <label className="text-sm text-gray-600">GSTIN</label>
                  <p className="font-medium">{vendor.gstin}</p>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Orders */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Purchase Orders</h2>
            {pos && pos.length > 0 ? (
              <div className="space-y-3">
                {pos.map((po: any) => (
                  <Link
                    key={po.id}
                    href={`/bookings/${po.bookings.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">PO #{po.id.slice(0, 8)}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Status: {po.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {formatDate(po.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No purchase orders</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rate Plans */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Rate Plans</h2>
            {ratePlans && ratePlans.length > 0 ? (
              <div className="space-y-3">
                {ratePlans.map((plan: any) => (
                  <div key={plan.id} className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-sm">{plan.title || 'Untitled'}</div>
                    {plan.season_start && plan.season_end && (
                      <div className="text-xs text-gray-600 mt-1">
                        {formatDate(plan.season_start)} - {formatDate(plan.season_end)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No rate plans</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

