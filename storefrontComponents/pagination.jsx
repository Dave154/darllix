"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {Button} from "@/components/ui/button"


export function PaginationComponent({ totalPages = 1, page = 1, setPage }) {
  
  const current = Math.max(1, Math.min(Number(page) || 1, Number(totalPages) || 1));
  const total = Math.max(1, Number(totalPages) || 1);

  if (total < 1) return null;
  const pages = [];
  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);
  pages.push(1);

  if (left > 2) {
    pages.push("left-ellipsis");
  } else {

    for (let i = 2; i < left; i++) pages.push(i);
  }


  for (let i = left; i <= right; i++) {
    if (i > 1 && i < total) pages.push(i);
  }

  if (right < total - 1) {
    pages.push("right-ellipsis");
  } else {
    for (let i = right + 1; i < total; i++) pages.push(i);
  }

  // always include last page (if > 1)
  if (total > 1) pages.push(total);

  function onGo(n) {
    if (n === current) return;
    setPage(n);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {
            total > 1 &&
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (current >= 1) onGo(current - 1);
            }}
            aria-disabled={current <= 1}
          />
          }
        </PaginationItem>

        {pages.map((p, idx) => {
          if (p === "left-ellipsis" || p === "right-ellipsis") {
            return (
              <PaginationItem key={p + idx}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          const n = Number(p);
          const isActive = n === current;
          return (
            <PaginationItem key={`page-${n}`}>
              <Button
                variant='outline'
                className={`${isActive ? 'bg-gray-400/20': 'border-none '}`}
                onClick={(e) => {
                  e.preventDefault();
                  onGo(n);
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {n}
              </Button>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          {
             total > 1 &&
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (current < total) onGo(current + 1);
            }}
            aria-disabled={current >= total}
          />
          }
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
