"use client";
import React from "react";

type VirtualizedTableProps<T> = {
  items: T[];
  height: number; // container height in px
  width?: number | string; // container width
  itemSize: number; // row height
  renderRow: (item: T, index: number) => React.ReactNode;
};

export default function VirtualizedTable<T>({ items, height, width = "100%", itemSize, renderRow }: VirtualizedTableProps<T>) {
  return (
    <div style={{ height, width, overflowY: "auto", overflowX: "hidden" }}>
      {items.map((item, index) => (
        <div key={index} style={{ height: itemSize }}>
          {renderRow(item, index)}
        </div>
      ))}
    </div>
  );
}
