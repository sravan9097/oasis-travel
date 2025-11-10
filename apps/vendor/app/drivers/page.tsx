'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DriversPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
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
        .from('drivers')
        .select('*')
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
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Rate Plans
              </Link>
              <Link
                href="/drivers"
                className="text-blue-600 font-medium px-3 py-2 rounded-md text-sm"
              >
                Drivers
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {drivers && drivers.length > 0 ? (
            drivers.map((driver) => (
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
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              No drivers found. Add your first driver to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: 'sedan',
    vehicle_number: '',
  });

      const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase(); // Uses local instance from ../lib/supabase
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
        .from('drivers')
        .insert({ ...formData, vendor_id: vendor.id, active: true });

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

