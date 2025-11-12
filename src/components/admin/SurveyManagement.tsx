'use client';

import { useState, useEffect } from 'react';
import { Download, Mail, Calendar, MapPin, Users, TrendingUp, Gift } from 'lucide-react';

interface SurveySubmission {
  id: string;
  timestamp: string;
  email: string;
  name: string;
  gender: string;
  ageRange: string;
  location: string;
  howDidYouFindUs: string;
  candlePreferences: string[];
  otherInfo?: string;
  couponCode: string;
  couponUsed: boolean;
}

export default function SurveyManagement() {
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/survey/list');
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Name',
      'Email',
      'Gender',
      'Age Range',
      'Location',
      'How Found Us',
      'Candle Preferences',
      'Other Info',
      'Coupon Code',
      'Coupon Used'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredSubmissions.map(sub => [
        new Date(sub.timestamp).toLocaleString(),
        sub.name,
        sub.email,
        sub.gender,
        sub.ageRange,
        sub.location,
        sub.howDidYouFindUs,
        `"${sub.candlePreferences.join(', ')}"`,
        `"${sub.otherInfo || ''}"`,
        sub.couponCode,
        sub.couponUsed ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export email list only
  const exportEmailList = () => {
    const emailList = filteredSubmissions.map(sub => sub.email).join('\n');
    const blob = new Blob([emailList], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-list-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unused' ? !sub.couponUsed :
      sub.couponUsed;

    const matchesSearch = 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.location.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: submissions.length,
    unusedCoupons: submissions.filter(s => !s.couponUsed).length,
    usedCoupons: submissions.filter(s => s.couponUsed).length,
    topSource: getTopValue(submissions.map(s => s.howDidYouFindUs)),
    topPreference: getTopValue(submissions.flatMap(s => s.candlePreferences)),
    topLocation: getTopValue(submissions.map(s => s.location))
  };

  function getTopValue(arr: string[]): string {
    if (arr.length === 0) return 'N/A';
    const counts: { [key: string]: number } = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="serif-font text-2xl font-bold text-gray-900">
          Survey Responses & Newsletter
        </h2>
        <div className="flex gap-3">
          <button
            onClick={exportEmailList}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Export Emails
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Full CSV
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Responses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Unused Coupons</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.unusedCoupons}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Used Coupons</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.usedCoupons}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-gray-600">Top Source</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{stats.topSource}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🕯️</span>
            <span className="text-sm text-gray-600">Top Preference</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{stats.topPreference}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-600">Top Location</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{stats.topLocation}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setFilter('unused')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unused'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unused ({stats.unusedCoupons})
            </button>
            <button
              onClick={() => setFilter('used')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'used'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Used ({stats.usedCoupons})
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Preferences
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(submission.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {submission.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {submission.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {submission.location}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {submission.howDidYouFindUs}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {submission.candlePreferences.slice(0, 2).map((pref, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs"
                        >
                          {pref}
                        </span>
                      ))}
                      {submission.candlePreferences.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{submission.candlePreferences.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {submission.couponCode}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.couponUsed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {submission.couponUsed ? 'Used' : 'Unused'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No survey responses found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

