import React from 'react';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row text-xs text-muted-foreground">
        <p>
          Production-Oriented Monorepo Starter • Next.js & Fastify & PostgreSQL & Redis & MinIO
        </p>
        <p className="font-mono">
          Phase 1 Foundation • Zero Hackathon Assumptions
        </p>
      </div>
    </footer>
  );
}
