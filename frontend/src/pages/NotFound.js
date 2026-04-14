import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F9F8F6' }}
    >
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <img src="/anchr-circle-small.svg" alt="Anchr" className="w-16 h-16 opacity-40" />
        </div>

        <p
          className="font-heading text-8xl font-light tracking-tight mb-2"
          style={{ color: '#A4C3B2' }}
        >
          404
        </p>

        <h1
          className="font-heading text-2xl font-light tracking-tight mb-3"
          style={{ color: '#2A3A35' }}
        >
          Page not found
        </h1>

        <p
          className="text-sm mb-10"
          style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
        >
          This page doesn't exist. Let's get you back on track.
        </p>

        <Button
          onClick={() => navigate('/dashboard')}
          className="h-12 px-8 rounded-full text-white font-medium transition-colors duration-300 inline-flex items-center gap-2"
          style={{ background: '#6B9080' }}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
