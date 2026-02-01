'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  QrCode,
  Eye,
  Copy,
  ExternalLink,
  Download,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';

interface EventForm {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  form_type: string;
  form_fields: any[];
  is_active: boolean;
  qr_code_url: string | null;
  view_count: number;
  submission_count: number;
  created_at: string;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  review: 'Review',
  waiver: 'Waiver',
  feedback: 'Feedback',
  registration: 'Registration',
  custom: 'Custom',
};

const FORM_TYPE_COLORS: Record<string, string> = {
  review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  waiver: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  feedback: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  registration: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
};

export default function EventFormsManagement() {
  const [forms, setForms] = useState<EventForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [selectedForm, setSelectedForm] = useState<EventForm | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [formUrl, setFormUrl] = useState('');

  useEffect(() => {
    fetchForms();
  }, [filterType, filterActive]);

  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterActive !== 'all') params.append('active', filterActive);

      const response = await fetch(`/api/admin/event-forms?${params}`);
      const data = await response.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? All submissions will also be deleted.')) return;

    try {
      const response = await fetch(`/api/admin/event-forms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete form');
      }

      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    }
  };

  const handleToggleActive = async (form: EventForm) => {
    try {
      const response = await fetch(`/api/admin/event-forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !form.is_active }),
      });

      if (!response.ok) {
        throw new Error('Failed to update form');
      }

      fetchForms();
    } catch (error) {
      console.error('Error updating form:', error);
      alert('Failed to update form');
    }
  };

  const handleGenerateQR = async (form: EventForm) => {
    setSelectedForm(form);
    setGeneratingQR(true);
    setShowQRModal(true);

    try {
      const response = await fetch(`/api/admin/event-forms/${form.id}/qr-code`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      setQrCodeUrl(data.qrCodeUrl);
      setFormUrl(data.formUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
      setShowQRModal(false);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    alert('Form URL copied to clipboard!');
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${selectedForm?.slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (form: EventForm) => {
    // Navigate to form editor (to be implemented)
    const params = new URLSearchParams({
      section: 'event-form-editor',
      id: form.id,
    });
    window.history.pushState({}, '', `?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleCreate = () => {
    const params = new URLSearchParams({
      section: 'event-form-editor',
    });
    window.history.pushState({}, '', `?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = 
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Forms</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {forms.length} total forms • {forms.filter(f => f.is_active).length} active
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Form
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Types</option>
          <option value="review">Review</option>
          <option value="waiver">Waiver</option>
          <option value="feedback">Feedback</option>
          <option value="registration">Registration</option>
          <option value="custom">Custom</option>
        </select>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Forms List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No forms found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredForms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {form.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          /{form.slug}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FORM_TYPE_COLORS[form.form_type]}`}>
                        {FORM_TYPE_LABELS[form.form_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(form)}
                        className="flex items-center gap-1"
                      >
                        {form.is_active ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {form.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          {form.submission_count}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGenerateQR(form)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Generate QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <a
                          href={`/forms/${form.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Form"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleEdit(form)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                QR Code - {selectedForm?.title}
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {generatingQR ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-pink-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Form URL:</p>
                  <p className="text-sm text-gray-900 dark:text-white break-all">{formUrl}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </button>
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download QR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
