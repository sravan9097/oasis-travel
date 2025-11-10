'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getSupabase, getQuote, rpcSendQuote } from '@oasis/api';
import { formatINR } from '@oasis/utils';
import { QuoteItemRow } from '../../components/QuoteItemRow';
import Link from 'next/link';

export default function QuoteBuilderPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => getQuote(quoteId),
  });

  const [newItem, setNewItem] = useState({
    day_no: 1,
    item_type: 'hotel' as 'hotel' | 'cab' | 'activity' | 'misc',
    description: '',
    qty: 1,
    unit_price: 0,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { error } = await supabase.from('quote_items').insert({
        ...newItem,
        quote_id: quoteId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      setNewItem({
        day_no: 1,
        item_type: 'hotel',
        description: '',
        qty: 1,
        unit_price: 0,
      });
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: () => rpcSendQuote(quoteId),
    onSuccess: () => {
      alert('Quote sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
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

  if (!quote) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Quote not found
        </div>
      </div>
    );
  }

  const total =
    quote.quote_items?.reduce(
      (sum: number, item: any) => sum + item.qty * item.unit_price,
      0
    ) || 0;

  const canEdit = quote.status === 'DRAFT';
  const maxDay = Math.max(
    ...(quote.quote_items?.map((item: any) => item.day_no || 1) || [1]),
    7
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/leads/${quote.lead_id}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Lead
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quote Builder</h1>
          <div className="space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Preview PDF
            </button>
            <button
              onClick={() => sendQuoteMutation.mutate()}
              disabled={quote.status !== 'DRAFT' || sendQuoteMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {sendQuoteMutation.isPending ? 'Sending...' : 'Send Quote'}
            </button>
          </div>
        </div>
      </div>

      {/* Quote Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Version</label>
            <p className="font-semibold text-lg">{quote.version}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <p className="font-semibold text-lg">
              <span
                className={`inline-block px-3 py-1 rounded text-sm ${
                  quote.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-800'
                    : quote.status === 'SENT'
                    ? 'bg-blue-100 text-blue-800'
                    : quote.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {quote.status}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Total</label>
            <p className="text-2xl font-bold">{formatINR(total)}</p>
          </div>
        </div>
      </div>

      {/* Day Timeline */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Itinerary</h2>

        {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => {
          const dayItems =
            quote.quote_items?.filter((item: any) => item.day_no === day) || [];

          return (
            <div key={day} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
              <h3 className="font-semibold text-lg mb-3">Day {day}</h3>

              {dayItems.length === 0 ? (
                <p className="text-gray-400 text-sm">No items added</p>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((item: any) => (
                    <QuoteItemRow
                      key={item.id}
                      item={item}
                      quoteId={quoteId}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Item Form */}
      {canEdit && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add Item</h2>

          <div className="grid grid-cols-5 gap-4 mb-4">
            <select
              value={newItem.day_no}
              onChange={(e) =>
                setNewItem({ ...newItem, day_no: Number(e.target.value) })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>

            <select
              value={newItem.item_type}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  item_type: e.target.value as 'hotel' | 'cab' | 'activity' | 'misc',
                })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="hotel">Hotel</option>
              <option value="cab">Transport</option>
              <option value="activity">Activity</option>
              <option value="misc">Miscellaneous</option>
            </select>

            <input
              type="text"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              placeholder="Description"
              className="border border-gray-300 rounded-lg px-3 py-2 col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Quantity</label>
              <input
                type="number"
                value={newItem.qty}
                onChange={(e) =>
                  setNewItem({ ...newItem, qty: Number(e.target.value) })
                }
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                value={newItem.unit_price}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit_price: Number(e.target.value) })
                }
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <div className="w-full">
                <label className="block text-sm text-gray-600 mb-1">Total</label>
                <div className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-semibold">
                  {formatINR(newItem.qty * newItem.unit_price)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => addItemMutation.mutate()}
            disabled={!newItem.description || addItemMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {addItemMutation.isPending ? 'Adding...' : '+ Add Item'}
          </button>
        </div>
      )}
    </div>
  );
}

