'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getSupabase, getBooking, getPOs, getVouchers, getQuote } from '@oasis/api';
import { formatDate, formatDateTime, minutesUntil } from '@oasis/utils';
import * as Tabs from '@radix-ui/react-tabs';
import Link from 'next/link';

export default function TripWorkspacePage() {
  const params = useParams();
  const bookingId = params.id as string;
  const queryClient = useQueryClient();

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId),
  });

  const { data: pos, isLoading: posLoading } = useQuery({
    queryKey: ['pos', bookingId],
    queryFn: () => getPOs(bookingId),
    enabled: !!bookingId,
  });

  const { data: vouchers, isLoading: vouchersLoading } = useQuery({
    queryKey: ['vouchers', bookingId],
    queryFn: () => getVouchers(bookingId),
    enabled: !!bookingId,
  });

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', booking?.quote_id],
    queryFn: () => getQuote(booking!.quote_id),
    enabled: !!booking?.quote_id,
  });

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', bookingId],
    queryFn: async () => {
      if (!booking) return null;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_posts(*), incidents(*)')
        .eq('booking_id', bookingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  if (bookingLoading || posLoading || vouchersLoading || quoteLoading || tripLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Booking not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Trip Workspace</h1>

      <Tabs.Root defaultValue="overview" className="w-full">
        <Tabs.List className="flex border-b mb-6 space-x-1">
          <Tabs.Trigger
            value="overview"
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-colors"
          >
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="quote"
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-colors"
          >
            Quote
          </Tabs.Trigger>
          <Tabs.Trigger
            value="vendors"
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-colors"
          >
            Vendors & POs
          </Tabs.Trigger>
          <Tabs.Trigger
            value="comms"
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-colors"
          >
            Communications
          </Tabs.Trigger>
          <Tabs.Trigger
            value="docs"
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-colors"
          >
            Documents
          </Tabs.Trigger>
          <Tabs.Trigger
            value="issues"
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-colors"
          >
            Issues
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="mt-6">
          <OverviewTab booking={booking} pos={pos || []} vouchers={vouchers || []} />
        </Tabs.Content>

        <Tabs.Content value="quote" className="mt-6">
          <QuoteTab quote={quote} />
        </Tabs.Content>

        <Tabs.Content value="vendors" className="mt-6">
          <VendorsTab pos={pos || []} />
        </Tabs.Content>

        <Tabs.Content value="comms" className="mt-6">
          <CommsTab trip={trip} />
        </Tabs.Content>

        <Tabs.Content value="docs" className="mt-6">
          <DocsTab vouchers={vouchers || []} />
        </Tabs.Content>

        <Tabs.Content value="issues" className="mt-6">
          <IssuesTab incidents={trip?.incidents || []} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function OverviewTab({
  booking,
  pos,
  vouchers,
}: {
  booking: any;
  pos: any[];
  vouchers: any[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-2 text-gray-600">Status</h3>
        <p className="text-2xl font-bold">{booking.status}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-2 text-gray-600">POs Sent</h3>
        <p className="text-2xl font-bold">{pos.length}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-2 text-gray-600">Vouchers</h3>
        <p className="text-2xl font-bold">{vouchers.length}</p>
      </div>
    </div>
  );
}

function QuoteTab({ quote }: { quote: any }) {
  if (!quote) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">No quote available</p>
      </div>
    );
  }

  const total =
    quote.quote_items?.reduce(
      (sum: number, item: any) => sum + item.qty * item.unit_price,
      0
    ) || 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Quote Snapshot</h2>
        <Link
          href={`/quotes/${quote.id}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Full Quote →
        </Link>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Version</label>
            <p className="font-semibold">{quote.version}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <p className="font-semibold">{quote.status}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Total</label>
            <p className="font-semibold text-lg">₹{total.toLocaleString()}</p>
          </div>
        </div>
        {quote.quote_items && quote.quote_items.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <div className="space-y-2">
              {quote.quote_items.slice(0, 5).map((item: any) => (
                <div key={item.id} className="text-sm text-gray-600">
                  Day {item.day_no}: {item.description} - ₹
                  {(item.qty * item.unit_price).toLocaleString()}
                </div>
              ))}
              {quote.quote_items.length > 5 && (
                <p className="text-sm text-gray-500">
                  +{quote.quote_items.length - 5} more items
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VendorsTab({ pos }: { pos: any[] }) {
  const queryClient = useQueryClient();
  const confirmPOMutation = useMutation({
    mutationFn: async (poId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('pos')
        .update({ status: 'CONFIRMED' })
        .eq('id', poId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos'] });
    },
  });

  if (pos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">No purchase orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pos.map((po) => {
        const isOverdue = po.due_at && minutesUntil(po.due_at) < 0;
        return (
          <div
            key={po.id}
            className={`bg-white p-6 rounded-lg shadow ${
              isOverdue ? 'border-2 border-orange-200' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">PO #{po.id.slice(0, 8)}</h3>
                <p className="text-sm text-gray-600">Status: {po.status}</p>
              </div>

              {po.due_at && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Due</p>
                  <p
                    className={`font-semibold ${
                      isOverdue ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {formatDate(po.due_at)}
                  </p>
                  {isOverdue && (
                    <p className="text-xs text-red-600 mt-1">
                      Overdue by {Math.abs(minutesUntil(po.due_at))} minutes
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                View Details
              </button>
              {po.status === 'ACCEPTED' && (
                <button
                  onClick={() => confirmPOMutation.mutate(po.id)}
                  disabled={confirmPOMutation.isPending}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {confirmPOMutation.isPending ? 'Confirming...' : 'Mark Confirmed'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommsTab({ trip }: { trip: any }) {
  const posts = trip?.trip_posts || [];

  return (
    <div className="space-y-4">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        + Create Post
      </button>

      {posts.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">No posts yet</p>
        </div>
      ) : (
        posts.map((post: any) => (
          <div key={post.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold">{post.content?.title || 'Untitled'}</h3>
            <p className="text-gray-600 mt-2">{post.content?.body || ''}</p>
            <p className="text-sm text-gray-400 mt-2">
              Status: {post.status} •{' '}
              {post.posted_at ? formatDateTime(post.posted_at) : 'Not posted'}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

function DocsTab({ vouchers }: { vouchers: any[] }) {
  if (vouchers.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">No vouchers uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vouchers.map((voucher) => (
        <div
          key={voucher.id}
          className="bg-white p-6 rounded-lg shadow flex justify-between items-center"
        >
          <div>
            <h3 className="font-semibold">Voucher #{voucher.id.slice(0, 8)}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {voucher.verified ? (
                <span className="text-green-600">✓ Verified</span>
              ) : (
                <span className="text-orange-600">⚠ Pending Verification</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(voucher.created_at)}
            </p>
          </div>

          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View Document
          </button>
        </div>
      ))}
    </div>
  );
}

function IssuesTab({ incidents }: { incidents: any[] }) {
  if (incidents.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">No incidents reported</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className={`bg-white p-6 rounded-lg shadow border-2 ${
            incident.severity === 'P0'
              ? 'border-red-200 bg-red-50'
              : incident.severity === 'P1'
              ? 'border-orange-200 bg-orange-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span
                className={`inline-block px-2 py-1 rounded text-sm font-medium mb-2 ${
                  incident.severity === 'P0'
                    ? 'bg-red-100 text-red-800'
                    : incident.severity === 'P1'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {incident.severity}
              </span>
              <h3 className="font-semibold mt-2">{incident.category || 'Uncategorized'}</h3>
              <p className="text-gray-600 mt-1">{incident.description}</p>
              <p className="text-sm text-gray-400 mt-2">
                Created: {formatDateTime(incident.created_at)}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                incident.status === 'RESOLVED'
                  ? 'bg-green-100 text-green-800'
                  : incident.status === 'OPEN'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {incident.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

