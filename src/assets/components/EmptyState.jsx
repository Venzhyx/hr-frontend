import React from 'react';

const EmptyState = ({ icon, title, desc, action }) => (
  <div className="py-16 text-center text-gray-400">
    <div className="flex justify-center mb-3">
      {typeof icon === 'string'
        ? <span className="text-4xl">{icon}</span>
        : icon
      }
    </div>
    <p className="font-medium text-gray-600">{title}</p>
    {desc && <p className="text-sm mt-1">{desc}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
