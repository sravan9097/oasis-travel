'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../lib/supabase';
import { formatDate } from '@oasis/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function RatePlansPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const { data: ratePlans } = useQuery({
    queryKey: ['rate-plans'],
    queryFn: async () => {
      const supabase = getSupabase();
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

      const { data, error } = await supabase
        .from('rate_plans')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('season_start', { ascending: false });

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
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Orders
              </Link>
              <Link
                href="/rates"
                className="text-blue-600 font-medium px-3 py-2 rounded-md text-sm"
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
          {ratePlans && ratePlans.length > 0 ? (
            ratePlans.map((plan) => (
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
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              No rate plans found. Create your first rate plan to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatePlanForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const router = useRouter();
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
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!vendor) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('rate_plans')
        .insert({ ...formData, vendor_id: vendor.id });

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

