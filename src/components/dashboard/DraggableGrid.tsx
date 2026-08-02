"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ReactNode } from "react";

/**
 * The dashboard's card grid, reordered by dragging.
 *
 * A composition boundary, not a data boundary: the server component still
 * fetches everything and renders every card's contents, this only takes the
 * finished elements and lets a visitor rearrange which order they sit in.
 * Recomposing the grid client-side rather than making the cards themselves
 * client components keeps every card's own data fetch on the server, where it
 * already was.
 */

export type GridItem = {
  key: string;
  className?: string;
  children: ReactNode;
};

function SortableCard({ item }: { item: GridItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`group relative ${item.className ?? ""}`}
    >
      {/* A dedicated handle rather than the whole card: the card underneath
          still has buttons, links and inputs of its own, and a drag listener
          on the whole surface would swallow every click meant for one of
          them. */}
      <button
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        className="absolute right-3 top-3 z-10 flex size-7 cursor-grab items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.4" />
          <circle cx="15" cy="6" r="1.4" />
          <circle cx="9" cy="12" r="1.4" />
          <circle cx="15" cy="12" r="1.4" />
          <circle cx="9" cy="18" r="1.4" />
          <circle cx="15" cy="18" r="1.4" />
        </svg>
      </button>

      {item.children}
    </div>
  );
}

/**
 * Fire-and-forget: the drag already happened and the UI already moved. A
 * signed-out response or a network hiccup means next visit reverts to the
 * last saved order, not that this one has to be undone in front of the
 * visitor.
 */
function persistOrder(order: string[]): void {
  fetch("/api/dashboard/layout", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ order }),
  }).catch(() => {});
}

export default function DraggableGrid({
  items,
  initialOrder,
  className,
}: {
  items: GridItem[];
  /** Keys, in the order to show them on first paint. */
  initialOrder: string[];
  className?: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const byKey = new Map(items.map((item) => [item.key, item]));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((current) => {
      const from = current.indexOf(String(active.id));
      const to = current.indexOf(String(over.id));
      if (from === -1 || to === -1) return current;

      const next = arrayMove(current, from, to);
      persistOrder(next);
      return next;
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className={className}>
          {order.map((key) => {
            const item = byKey.get(key);
            return item ? <SortableCard key={key} item={item} /> : null;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
