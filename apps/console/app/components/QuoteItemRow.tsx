'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { formatINR } from '@oasis/utils';
import type { QuoteItem } from '@oasis/api';

interface Props {
  item: QuoteItem;
  quoteId: string;
  canEdit: boolean;
}

export function QuoteItemRow({ item, quoteId, canEdit }: Props) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const { error } = await supabase.from('quote_items').delete().eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
    },
  });

  const total = item.qty * item.unit_price;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Day {item.day_no}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              item.item_type === 'hotel'
                ? 'bg-blue-100 text-blue-800'
                : item.item_type === 'cab'
                ? 'bg-green-100 text-green-800'
                : item.item_type === 'activity'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.item_type}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
        <div className="text-xs text-gray-500 mt-1">
          Qty: {item.qty} × {formatINR(item.unit_price)} = {formatINR(total)}
        </div>
      </div>
      {canEdit && (
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      )}
    </div>
  );
}

