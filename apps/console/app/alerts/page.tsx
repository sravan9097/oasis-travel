'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { minutesUntil, formatDateTime } from '@oasis/utils';
import Link from 'next/link';

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: overduePOs, isLoading: posLoading } = useQuery({
    queryKey: ['overdue-pos'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('pos')
        .select('*, vendors(name), bookings(id)')
        .in('status', ['SENT', 'ACCEPTED'])
        .lt('due_at', new Date().toISOString());

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: p0Incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['p0-incidents'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('incidents')
        .select('*, trips(title, booking_id)')
        .eq('severity', 'P0')
        .in('status', ['OPEN', 'ACK']);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const acknowledgeIncidentMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('incidents')
        .update({ status: 'ACK' })
        .eq('id', incidentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p0-incidents'] });
    },
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('incidents')
        .update({ status: 'RESOLVED' })
        .eq('id', incidentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p0-incidents'] });
    },
  });

  if (posLoading || incidentsLoading) {
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
      <h1 className="text-3xl font-bold mb-6">Alerts & SLA Monitoring</h1>

      {/* P0 Incidents */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          🚨 P0 Emergencies ({p0Incidents?.length || 0})
        </h2>

        <div className="space-y-4">
          {p0Incidents && p0Incidents.length > 0 ? (
            p0Incidents.map((incident: any) => (
              <div
                key={incident.id}
                className="bg-red-50 border-2 border-red-200 p-6 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {incident.trips?.title || 'Trip Incident'}
                    </h3>
                    <p className="text-red-800 mt-2">{incident.description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Category: {incident.category || 'Uncategorized'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Created: {formatDateTime(incident.created_at)}
                    </p>
                    {incident.trips?.booking_id && (
                      <Link
                        href={`/bookings/${incident.trips.booking_id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                      >
                        View Booking →
                      </Link>
                    )}
                  </div>

                  <div className="space-x-2 ml-4">
                    {incident.status === 'OPEN' && (
                      <button
                        onClick={() => acknowledgeIncidentMutation.mutate(incident.id)}
                        disabled={acknowledgeIncidentMutation.isPending}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                      >
                        {acknowledgeIncidentMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
                      </button>
                    )}
                    <button
                      onClick={() => resolveIncidentMutation.mutate(incident.id)}
                      disabled={resolveIncidentMutation.isPending}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {resolveIncidentMutation.isPending ? 'Resolving...' : 'Resolve'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">No active P0 incidents</p>
            </div>
          )}
        </div>
      </div>

      {/* Overdue POs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-orange-600">
          ⚠️ Overdue Purchase Orders ({overduePOs?.length || 0})
        </h2>

        <div className="space-y-4">
          {overduePOs && overduePOs.length > 0 ? (
            overduePOs.map((po: any) => {
              const overdueMinutes = Math.abs(minutesUntil(po.due_at));
              return (
                <div
                  key={po.id}
                  className="bg-orange-50 border-2 border-orange-200 p-6 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{po.vendors?.name || 'Unknown Vendor'}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        PO #{po.id.slice(0, 8)} • Status: {po.status}
                      </p>
                      <p className="text-sm text-orange-800 mt-1">
                        Overdue by {overdueMinutes} minutes
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Due: {formatDateTime(po.due_at)}
                      </p>
                      {po.bookings?.id && (
                        <Link
                          href={`/bookings/${po.bookings.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                        >
                          View Booking →
                        </Link>
                      )}
                    </div>

                    <div className="space-x-2 ml-4">
                      <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        Send Reminder
                      </button>
                      {po.bookings?.id && (
                        <Link
                          href={`/bookings/${po.bookings.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-block"
                        >
                          View Booking
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">No overdue purchase orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

