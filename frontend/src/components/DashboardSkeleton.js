// frontend/src/components/DashboardSkeleton.js

import React from 'react';

// Pequeños componentes para reutilizar las cajas grises de la animación
const SkeletonCard = () => <article className="skeleton" style={{ height: '160px' }}></article>;

const SkeletonList = () => (
  <article>
    <div className="skeleton" style={{ height: '30px', width: '60%', marginBottom: '1.5rem' }}></div>
    <div className="skeleton" style={{ height: '70px', marginBottom: '1rem' }}></div>
    <div className="skeleton" style={{ height: '70px', marginBottom: '1rem' }}></div>
    <div className="skeleton" style={{ height: '70px' }}></div>
  </article>
);

function DashboardSkeleton() {
  return (
    <div>
      <header className="dashboard-header">
        <div className="skeleton" style={{ height: '40px', width: '250px' }}></div>
        <div className="skeleton" style={{ height: '50px', width: '280px' }}></div>
      </header>
      <section className="summary-cards">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
      <section className="lists-container">
        <SkeletonList />
        <SkeletonList />
      </section>
    </div>
  );
}

export default DashboardSkeleton;