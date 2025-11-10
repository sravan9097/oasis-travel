'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { formatDate } from '@oasis/utils';
import Link from 'next/link';

export default function VendorsPage() {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + New Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors && vendors.length > 0 ? (
          vendors.map((vendor: any) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{vendor.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vendor.type.charAt(0).toUpperCase() + vendor.type.slice(1)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    vendor.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {vendor.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {vendor.contact_email && (
                  <p>📧 {vendor.contact_email}</p>
                )}
                {vendor.contact_phone && (
                  <p>📞 {vendor.contact_phone}</p>
                )}
                <p>SLA: {vendor.sla_hours} hours</p>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {formatDate(vendor.created_at)}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No vendors found</p>
          </div>
        )}
      </div>
    </div>
  );
}

