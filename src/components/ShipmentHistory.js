'use client'

import { useState, useEffect } from 'react';
import { History, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ShipmentHistory({ shipmentCode }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!shipmentCode) return;

        async function fetchHistory() {
            try {
                const res = await fetch(`/api/history/${shipmentCode}`); 
                const data = await res.json();

                if (!res.ok || data.error) {
                    throw new Error(data.error || 'Failed to fetch history');
                }

                setHistory(data.history || []);
            } catch (err) {
                console.error('History fetch error:', err);
                setError('Could not load history.');
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [shipmentCode]);

    const getStatusIcon = (status) => {
        const icons = {
            'Delivered': <CheckCircle className="w-5 h-5 text-green-600" />,
            'In Transit': <MapPin className="w-5 h-5 text-blue-600" />,
            'On Hold': <AlertCircle className="w-5 h-5 text-yellow-600" />,
            'Cancelled': <AlertCircle className="w-5 h-5 text-red-600" />,
        };
        return icons[status] || <Clock className="w-5 h-5 text-gray-600" />;
    };

    const getStatusColor = (status) => {
        const colors = {
            'Delivered': 'bg-green-100 text-green-800 border-green-200',
            'In Transit': 'bg-blue-100 text-blue-800 border-blue-200',
            'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Cancelled': 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (loading) {
        return (
            <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200" style={{borderTopColor:'var(--brand-primary)'}}></div>
                Loading history...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-red-600 text-sm py-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-6 text-gray-400 text-sm">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No additional history available.
            </div>
        );
    }

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4" style={{color:'var(--brand-primary)'}} />
                <span className="font-semibold text-gray-900 text-sm">Full Shipment History</span>
            </div>

            {/* Timeline View */}
            <div className="space-y-4">
                {history.map((item, index) => (
                    <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-0 -translate-x-1/2 bg-white border-4 border-purple-500 rounded-full w-4 h-4"></div>
                        
                        <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200 hover:shadow-lg transition duration-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        {getStatusIcon(item.status)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.timestamp).toLocaleString('en-US', { 
                                                dateStyle: 'medium', 
                                                timeStyle: 'short' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {item.location && (
                                <div className="flex items-start gap-2 text-sm text-gray-700 mb-2">
                                    <MapPin className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                                    <span className="font-medium">{item.location}</span>
                                </div>
                            )}

                            {item.remarks && (
                                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <p className="text-sm text-gray-700 leading-relaxed">{item.remarks}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
 <div className='h-1'></div>
            {/* Alternative: Table View (commented out, can be toggled) */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-medium">Date & Time</th>
                            <th className="px-4 py-2.5 text-left font-medium">Location</th>
                            <th className="px-4 py-2.5 text-left font-medium">Status</th>
                            <th className="px-4 py-2.5 text-left font-medium">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((item, index) => (
                            <tr
                                key={index}
                                className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition`}
                            >
                                <td className="p-4 text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {new Date(item.timestamp).toLocaleString('en-US', { 
                                            dateStyle: 'medium', 
                                            timeStyle: 'short' 
                                        })}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-800">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-purple-600" />
                                        {item.location || '—'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-800">{item.remarks || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}