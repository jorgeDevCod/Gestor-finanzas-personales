// src/components/FeatureCard.jsx
import React from 'react';
import * as LucideIcons from 'lucide-react';

export const FeatureCard = ({ icon, title, description }) => {
  const Icon = LucideIcons[icon];
  return (
    <div className="bg-slate-100 shadow-md rounded-lg p-4 flex flex-col items-center text-center h-full">
      <Icon className="mb-3 text-blue-600" size={36} />
      <h3 className="font-bold text-lg mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};
