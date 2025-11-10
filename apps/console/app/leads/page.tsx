'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getLeads, getSupabase, rpcUpdateLeadStage } from '@oasis/api';
import { LeadCard } from '../components/LeadCard';
import type { Lead } from '@oasis/api';

const STAGES: Lead['stage'][] = ['NEW', 'SCOPING', 'QUOTED', 'WON', 'LOST'];

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: string; newStage: Lead['stage'] }) => {
      await rpcUpdateLeadStage(leadId, newStage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;

    if (STAGES.includes(newStage as Lead['stage'])) {
      updateStageMutation.mutate({
        leadId,
        newStage: newStage as Lead['stage'],
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const groupedLeads = STAGES.reduce((acc, stage) => {
    acc[stage] = leads?.filter((lead) => lead.stage === stage) || [];
    return acc;
  }, {} as Record<string, Lead[]>);

  const activeLead = leads?.find((lead) => lead.id === activeId);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + New Lead
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map((stage) => (
            <div
              key={stage}
              id={stage}
              className="bg-gray-50 rounded-lg p-4 min-h-[500px]"
            >
              <h3 className="font-semibold mb-4 text-sm uppercase text-gray-600">
                {stage} ({groupedLeads[stage].length})
              </h3>

              <SortableContext
                items={groupedLeads[stage].map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {groupedLeads[stage].map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  {groupedLeads[stage].length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Drop leads here
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="bg-white p-4 rounded-lg shadow-lg opacity-90">
              <div className="font-medium text-sm">
                Lead #{activeLead.id.slice(0, 8)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

