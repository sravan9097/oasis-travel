'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: async () => {
      const supabase = getSupabase();
      
      // Get current vendor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return null;
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!vendor) {
        router.push('/login');
        return null;
      }

      // Get POs for this vendor
      const { data: pos } = await supabase
        .from('pos')
        .select('status')
        .eq('vendor_id', vendor.id);

      const stats = {
        pending: pos?.filter(po => po.status === 'SENT').length || 0,
        accepted: pos?.filter(po => po.status === 'ACCEPTED').length || 0,
        confirmed: pos?.filter(po => po.status === 'CONFIRMED').length || 0,
        declined: pos?.filter(po => po.status === 'DECLINED').length || 0,
      };

      return stats;
    },
  });

  useEffect(() => {
    // Check auth on mount
    const checkAuth = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Vendor Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/orders"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
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
              <button
                onClick={async () => {
                  const supabase = getSupabase();
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{stats?.pending || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Accepted</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.accepted || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-3xl font-bold text-green-600">{stats?.confirmed || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Declined</p>
            <p className="text-3xl font-bold text-red-600">{stats?.declined || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="/orders"
              className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-center"
            >
              <p className="font-medium text-blue-700">View Orders</p>
            </Link>
            <Link
              href="/rates"
              className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-center"
            >
              <p className="font-medium text-green-700">Manage Rate Plans</p>
            </Link>
            <Link
              href="/drivers"
              className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-center"
            >
              <p className="font-medium text-purple-700">Driver Roster</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

