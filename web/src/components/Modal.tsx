"use client";

import React from 'react';

interface Service {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, service }) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{service.title}</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <p className="mb-4">{service.description}</p>
        <ul className="list-disc pl-5 space-y-2">
          {service.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Modal;
