'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate } from '@oasis/utils';
import type { Lead } from '@oasis/api';

interface Props {
  lead: Lead;
}

export function LeadCard({ lead }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow cursor-move hover:shadow-md transition-shadow"
    >
      <Link href={`/leads/${lead.id}`} onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-gray-900">
              Lead #{lead.id.slice(0, 8)}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(lead.created_at)}
            </span>
          </div>
          
          {lead.notes && (
            <p className="text-sm text-gray-600 line-clamp-2">{lead.notes}</p>
          )}
          
          <div className="flex gap-2 text-xs">
            {lead.source && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {lead.source}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

