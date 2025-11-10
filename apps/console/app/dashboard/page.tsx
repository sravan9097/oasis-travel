'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabase, getLeads } from '@oasis/api';
import { formatDate } from '@oasis/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const supabase = getSupabase();
      
      const [leadsRes, quotesRes, bookingsRes, incidentsRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('quotes').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase
          .from('incidents')
          .select('id', { count: 'exact', head: true })
          .eq('severity', 'P0')
          .in('status', ['OPEN', 'ACK']),
      ]);

      return {
        totalLeads: leadsRes.count || 0,
        totalQuotes: quotesRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        p0Incidents: incidentsRes.count || 0,
      };
    },
  });

  if (leadsLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentLeads = leads?.slice(0, 5) || [];
  const leadsByStage = {
    NEW: leads?.filter((l) => l.stage === 'NEW').length || 0,
    SCOPING: leads?.filter((l) => l.stage === 'SCOPING').length || 0,
    QUOTED: leads?.filter((l) => l.stage === 'QUOTED').length || 0,
    WON: leads?.filter((l) => l.stage === 'WON').length || 0,
    LOST: leads?.filter((l) => l.stage === 'LOST').length || 0,
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Leads</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalLeads || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Quotes</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalQuotes || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Active Bookings</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalBookings || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-2 border-red-200">
          <div className="text-sm text-red-600 mb-1">P0 Incidents</div>
          <div className="text-3xl font-bold text-red-600">{stats?.p0Incidents || 0}</div>
        </div>
      </div>

      {/* Leads by Stage */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Leads by Stage</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(leadsByStage).map(([stage, count]) => (
            <div key={stage} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 mt-1">{stage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Leads</h2>
          <Link
            href="/leads"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentLeads.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No leads yet</p>
          ) : (
            recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      Lead #{lead.id.slice(0, 8)}
                    </div>
                    {lead.notes && (
                      <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {lead.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        lead.stage === 'NEW'
                          ? 'bg-blue-100 text-blue-800'
                          : lead.stage === 'WON'
                          ? 'bg-green-100 text-green-800'
                          : lead.stage === 'LOST'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {lead.stage}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(lead.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

