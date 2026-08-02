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
import { useEffect, useRef, useState, type ReactNode } from "react";

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

function SortableCard({
  item,
  registerNode,
}: {
  item: GridItem;
  /** Hands the rendered node up to the grid, so it can measure rows after layout. */
  registerNode: (key: string, node: HTMLDivElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        registerNode(item.key, node);
      }}
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
        // Always visible, not just on hover: half this site's traffic is a
        // phone, which has no hover state at all — a handle that only
        // appears on :hover is a handle a touch visitor can never find.
        // `touch-none` stops the browser reading the first touch as a page
        // scroll instead of the start of a drag.
        className="absolute right-3 top-3 z-10 flex size-7 touch-none cursor-grab items-center justify-center rounded-md bg-surface-raised text-muted transition-colors hover:text-foreground focus-visible:text-foreground active:cursor-grabbing"
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
function persistOrder(page: string, order: string[]): void {
  fetch("/api/dashboard/layout", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ page, order }),
  }).catch(() => {});
}

export default function DraggableGrid({
  page,
  items,
  initialOrder,
  className,
}: {
  /** Which page's saved order this grid reads and writes — see `LAYOUT_PAGES`. */
  page: string;
  items: GridItem[];
  /** Keys, in the order to show them on first paint. */
  initialOrder: string[];
  className?: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const byKey = new Map(items.map((item) => [item.key, item]));

  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(new Map<string, HTMLDivElement>());

  function registerNode(key: string, node: HTMLDivElement | null) {
    if (node) nodesRef.current.set(key, node);
    else nodesRef.current.delete(key);
  }

  /**
   * Stretches the last card in any incomplete row to fill what's left of it.
   *
   * `grid-auto-flow: dense` backfills a gap a wide card leaves *before* it —
   * see the comment where each page sets it — but it cannot close a gap that
   * survives *after* dense has done its best, because by definition nothing
   * later in the order fits there either. That happens on any row, not only
   * the grid's last one: a row of single-width cards sitting above a
   * full-width summary card (the P&L curve, say) is already "last" as far as
   * dense packing within that row is concerned, even though more rows follow
   * it. So every row is checked here, not just the final one.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function fillRowGaps() {
      if (!container || getComputedStyle(container).display !== "grid") return;

      const nodes = order
        .map((key) => nodesRef.current.get(key))
        .filter((node): node is HTMLDivElement => Boolean(node));

      // Cleared before remeasuring, not just set when needed: a stretch that
      // made sense at desktop width has to let go once the viewport narrows
      // to where that card is no longer trailing alone in its row.
      for (const node of nodes) node.style.gridColumnEnd = "";
      if (nodes.length === 0) return;

      // Grouped by top offset, rounded — dense packing and subpixel layout
      // can leave two cards on the same row a fraction of a pixel apart.
      // Keeping the last node seen per row is enough: within one row that is
      // whichever card sits furthest right, since nothing later in the order
      // was placed before it on that same row.
      const rows = new Map<number, HTMLDivElement>();
      for (const node of nodes) rows.set(Math.round(node.offsetTop), node);

      const containerRight = container.getBoundingClientRect().right;

      for (const last of rows.values()) {
        const gap = containerRight - last.getBoundingClientRect().right;

        // A couple of pixels of slack for rounding; anything past that is a
        // real gap the row was left with.
        if (gap > 2) last.style.gridColumnEnd = "-1";
      }
    }

    fillRowGaps();

    const observer = new ResizeObserver(fillRowGaps);
    observer.observe(container);
    return () => observer.disconnect();
  }, [order]);

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
      persistOrder(page, next);
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
        <div ref={containerRef} className={className}>
          {order.map((key) => {
            const item = byKey.get(key);
            return item ? (
              <SortableCard key={key} item={item} registerNode={registerNode} />
            ) : null;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
