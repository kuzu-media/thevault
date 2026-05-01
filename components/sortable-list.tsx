"use client";
import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderItems } from "@/lib/actions";

// Items must be { id, content: ReactNode }. We can't accept a render function
// because Server Components can't pass functions across the client boundary.

export type SortableItem = { id: string; content: React.ReactNode };

export function SortableList({ items }: { items: SortableItem[] }) {
  const [order, setOrder] = useState(items);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((i) => i.id === active.id);
    const newIndex = order.findIndex((i) => i.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(async () => {
      await reorderItems(next.map((i) => i.id));
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={order.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {order.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {item.content}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex items-stretch gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        title="Drag"
        className="cursor-grab select-none rounded-sm border border-vault-line/40 bg-vault-panel/30 px-1 font-mono text-[12px] text-ink-mute hover:border-brass/40 hover:text-brass active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}
