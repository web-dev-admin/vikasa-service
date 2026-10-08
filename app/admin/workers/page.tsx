'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data/store';
import { Worker } from '@/types';
import { INITIAL_CATEGORIES } from '@/lib/taxonomy/catalog';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'delete'>('list');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    service: INITIAL_CATEGORIES[0]?.name || '',
    area: '',
  });

  const refreshWorkers = () => {
    setWorkers(dataStore.getWorkers());
  };

  useEffect(() => {
    refreshWorkers();
  }, []);

  const handleAddClick = () => {
    setFormData({
      fullName: '',
      phone: '',
      service: INITIAL_CATEGORIES[0]?.name || '',
      area: '',
    });
    setSelectedWorker(null);
    setView('form');
  };

  const handleEditClick = (worker: Worker) => {
    setFormData({
      fullName: worker.full_name,
      phone: worker.phone,
      service: worker.skills[0] || INITIAL_CATEGORIES[0]?.name || '',
      area: worker.base_location_name,
    });
    setSelectedWorker(worker);
    setView('form');
  };

  const handleDeleteClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setView('delete');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorker) {
      dataStore.updateWorker(selectedWorker.id, {
        full_name: formData.fullName,
        phone: formData.phone,
        skills: [formData.service],
        base_location_name: formData.area,
      });
    } else {
      dataStore.registerWorker({
        full_name: formData.fullName,
        phone: formData.phone,
        experience_years: 1, // default
        skills: [formData.service],
        verification_status: 'verified',
        availability: 'available',
        base_location_name: formData.area,
        latitude: 11.6643,
        longitude: 78.1460,
        service_radius_km: 15,
        service_area_names: [formData.area],
        service_ids: [],
      } as any);
    }
    refreshWorkers();
    setView('list');
  };

  const confirmDelete = () => {
    if (selectedWorker) {
      dataStore.deleteWorker(selectedWorker.id);
      refreshWorkers();
    }
    setView('list');
  };

  return (
    <div className="flex-1 bg-slate-50 p-4 sm:p-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team</h1>
      </div>

      {view === 'list' && (
        <div className="space-y-6">
          <div>
            <button
              onClick={handleAddClick}
              className="px-6 py-3 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
            >
              + Add Technician
            </button>
          </div>

          <div className="bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700">Technician Name</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Service</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Phone</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-900 font-medium">{worker.full_name}</td>
                    <td className="px-4 py-4 text-slate-600">{worker.skills[0] || 'Technician'}</td>
                    <td className="px-4 py-4 text-slate-600">{worker.phone}</td>
                    <td className="px-4 py-4 text-emerald-700 font-bold space-x-3">
                      <button onClick={() => handleEditClick(worker)} className="hover:underline cursor-pointer">
                        Edit
                      </button>
                      <span className="text-slate-300">·</span>
                      <button onClick={() => handleDeleteClick(worker)} className="hover:underline cursor-pointer">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No technicians added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'form' && (
        <div className="bg-white border border-slate-200 p-6 sm:p-8 max-w-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {selectedWorker ? 'Edit Technician' : 'Add Technician'}
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Technician Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Service</label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
              >
                {INITIAL_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Area</label>
              <input
                type="text"
                required
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-sm cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer transition-colors"
              >
                Save Technician
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'delete' && (
        <div className="bg-white border border-slate-200 p-6 sm:p-8 max-w-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Delete this technician?</h2>
          <p className="text-slate-600 mb-6">This action cannot be undone.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm cursor-pointer transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
