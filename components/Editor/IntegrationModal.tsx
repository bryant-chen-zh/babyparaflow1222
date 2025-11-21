import React, { useState, useEffect } from 'react';
import { X, Zap, Save, ArrowLeft, Sparkles } from 'lucide-react';
import { IntegrationData } from '../../types';

interface IntegrationModalProps {
  isOpen: boolean;
  title: string;
  initialData: IntegrationData | null;
  onSave: (data: IntegrationData) => void;
  onClose: () => void;
}

// Preset templates
const PRESETS: Record<string, IntegrationData> = {
  sendgrid: {
    provider: 'SendGrid',
    category: 'Email',
    description: 'Send transactional emails and marketing campaigns',
    apiEndpoint: 'https://api.sendgrid.com/v3',
    requiredKeys: ['SENDGRID_API_KEY'],
    documentation: 'https://docs.sendgrid.com'
  },
  stripe: {
    provider: 'Stripe',
    category: 'Payment',
    description: 'Process payments and manage subscriptions',
    apiEndpoint: 'https://api.stripe.com/v1',
    requiredKeys: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    documentation: 'https://stripe.com/docs/api'
  },
  auth0: {
    provider: 'Auth0',
    category: 'Auth',
    description: 'Authentication and authorization platform',
    apiEndpoint: 'https://{domain}.auth0.com',
    requiredKeys: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'],
    documentation: 'https://auth0.com/docs'
  },
  aws_s3: {
    provider: 'AWS S3',
    category: 'Storage',
    description: 'Object storage for files and assets',
    apiEndpoint: 'https://s3.amazonaws.com',
    requiredKeys: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    documentation: 'https://docs.aws.amazon.com/s3/'
  },
  google_calendar: {
    provider: 'Google Calendar',
    category: 'Calendar',
    description: 'Create and manage calendar events',
    apiEndpoint: 'https://www.googleapis.com/calendar/v3',
    requiredKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    documentation: 'https://developers.google.com/calendar'
  },
  google_maps: {
    provider: 'Google Maps',
    category: 'Maps',
    description: 'Location services and mapping',
    apiEndpoint: 'https://maps.googleapis.com/maps/api',
    requiredKeys: ['GOOGLE_MAPS_API_KEY'],
    documentation: 'https://developers.google.com/maps'
  }
};

const CATEGORIES = ['Email', 'Payment', 'Auth', 'Storage', 'Calendar', 'Maps', 'Analytics'];

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, title, initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<IntegrationData>(
    initialData || {
      provider: '',
      category: 'Email',
      description: '',
      apiEndpoint: '',
      requiredKeys: [],
      documentation: ''
    }
  );
  
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handlePresetClick = (presetKey: string) => {
    setFormData(PRESETS[presetKey]);
  };

  const handleAddKey = () => {
    if (newKey.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredKeys: [...(prev.requiredKeys || []), newKey.trim()]
      }));
      setNewKey('');
    }
  };

  const handleRemoveKey = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredKeys: prev.requiredKeys?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors group"
            title="Go Back"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-3">
            <Zap className="text-rose-600" size={18} />
            <h2 className="text-slate-900 font-medium text-sm tracking-wide">Edit Integration: {title}</h2>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="px-5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Save size={14} strokeWidth={3} />
          <span>Save</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
        <div className="max-w-3xl mx-auto py-8 px-8">
          
          {/* Preset Templates */}
          <div className="mb-8 p-6 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-rose-600" size={16} />
              <h3 className="text-sm font-bold text-slate-700">Quick Start Templates</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => handlePresetClick(key)}
                  className="px-3 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg transition-colors"
                >
                  {PRESETS[key].provider}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            
            {/* Provider Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Provider Name</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="e.g., SendGrid, Stripe, Auth0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this integration does..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
              />
            </div>

            {/* API Endpoint */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">API Endpoint</label>
              <input
                type="url"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                placeholder="https://api.example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Required Keys */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Required Environment Variables</label>
              <div className="space-y-2">
                {formData.requiredKeys && formData.requiredKeys.map((key, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700">
                      {key}
                    </div>
                    <button
                      onClick={() => handleRemoveKey(idx)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKey()}
                    placeholder="Add new key (e.g., API_KEY)"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                  />
                  <button
                    onClick={handleAddKey}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Documentation URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Documentation URL</label>
              <input
                type="url"
                value={formData.documentation}
                onChange={(e) => setFormData(prev => ({ ...prev, documentation: e.target.value }))}
                placeholder="https://docs.example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              />
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

