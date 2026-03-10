"use client";

import { List } from "react-window";
import type { CSSProperties } from "react";

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

interface RowRendererProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

function createRowComponent<T>() {
  return function RowComponent({
    index,
    style,
    items,
    renderItem,
  }: {
    ariaAttributes: Record<string, unknown>;
    index: number;
    style: CSSProperties;
  } & RowRendererProps<T>) {
    return <div style={style}>{renderItem(items[index]!, index)}</div>;
  };
}

/**
 * Generic virtualized list using react-window v2.
 * Use for long lists (100+ items) like timeline shots, activity feeds, etc.
 */
export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
}: VirtualizedListProps<T>) {
  return (
    <List<RowRendererProps<T>>
      defaultHeight={height}
      rowCount={items.length}
      rowHeight={itemHeight}
      overscanCount={overscan}
      className={className}
      rowComponent={createRowComponent<T>()}
      rowProps={{ items, renderItem }}
    />
  );
}
