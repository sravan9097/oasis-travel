'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getLead, getRequestDoc, getQuotes, getSupabase } from '@oasis/api';
import { formatDate } from '@oasis/utils';
import Link from 'next/link';

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLead(leadId),
  });

  const { data: requestDoc, isLoading: docLoading } = useQuery({
    queryKey: ['request-doc', leadId],
    queryFn: () => getRequestDoc(leadId),
    enabled: !!leadId,
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes', leadId],
    queryFn: () => getQuotes(leadId),
    enabled: !!leadId,
  });

  if (leadLoading || docLoading || quotesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Lead not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/leads"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Leads
        </Link>
        <h1 className="text-3xl font-bold">Lead #{lead.id.slice(0, 8)}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          {requestDoc && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Request Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Destinations</label>
                  <p className="font-medium">{requestDoc.destinations.join(', ')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Nights</label>
                  <p className="font-medium">{requestDoc.nights}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Adults</label>
                  <p className="font-medium">{requestDoc.pax_adults}</p>
                </div>
                {requestDoc.start_date && (
                  <div>
                    <label className="text-sm text-gray-600">Start Date</label>
                    <p className="font-medium">{formatDate(requestDoc.start_date)}</p>
                  </div>
                )}
                {requestDoc.budget_max && (
                  <div>
                    <label className="text-sm text-gray-600">Budget</label>
                    <p className="font-medium">₹{requestDoc.budget_max.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quotes */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quotes</h2>
            {quotes && quotes.length > 0 ? (
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">Version {quote.version}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Status: {quote.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          ₹{quote.total_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(quote.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No quotes yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Lead Info</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Stage</label>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
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
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Created</label>
                <p className="font-medium">{formatDate(lead.created_at)}</p>
              </div>
              {lead.source && (
                <div>
                  <label className="text-sm text-gray-600">Source</label>
                  <p className="font-medium">{lead.source}</p>
                </div>
              )}
            </div>
          </div>

          {lead.notes && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

