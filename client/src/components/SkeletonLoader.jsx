import React from 'react';

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-16"></div>
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
  </div>
);

export const TextSkeleton = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div
          className="bg-gray-200 dark:bg-gray-700 rounded"
          style={{ height: `${Math.random() * 20 + 10}px` }}
        ></div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:p-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24"></div>
      </div>
    ))}
  </div>
);

export { TableSkeleton, CardSkeleton, TextSkeleton, StatsSkeleton };
