'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { getSupabase } from '../../../../lib/supabase';
import { rpcUploadVoucher } from '@oasis/api';

export default function VoucherUploadPage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({
    guest_name: '',
    check_in: '',
    check_out: '',
    booking_id: '',
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');

      const supabase = getSupabase();
      
      // Get PO details
      const { data: po } = await supabase
        .from('pos')
        .select('booking_id, vendor_id')
        .eq('id', params.id as string)
        .single();

      if (!po) throw new Error('PO not found');

      // Upload file to storage
      const fileName = `${po.booking_id}/${po.vendor_id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Call RPC to create voucher record
      await rpcUploadVoucher(po.booking_id, po.vendor_id, fileName, meta);

      return fileName;
    },
    onSuccess: () => {
      alert('Voucher uploaded successfully!');
      router.push('/orders');
    },
  });

  const isValid = 
    file !== null &&
    meta.guest_name.trim() !== '' &&
    meta.check_in !== '' &&
    meta.booking_id.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700 mr-4">
                ← Back
              </button>
              <span className="text-xl font-bold text-gray-900">Vendor Portal</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Upload Voucher</h1>

        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voucher Document (PDF) *
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {file.name} selected
              </p>
            )}
          </div>

          {/* Validation Checklist */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Validation Checklist</h3>
            <p className="text-sm text-gray-600 mb-3">
              Please ensure your voucher contains the following information:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  value={meta.guest_name}
                  onChange={(e) => setMeta({ ...meta, guest_name: e.target.value })}
                  placeholder="Full name as in booking"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className={`text-xs mt-1 ${meta.guest_name ? 'text-green-600' : 'text-gray-500'}`}>
                  {meta.guest_name ? '✓ Guest name provided' : 'Required'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={meta.check_in}
                    onChange={(e) => setMeta({ ...meta, check_in: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <p className={`text-xs mt-1 ${meta.check_in ? 'text-green-600' : 'text-gray-500'}`}>
                    {meta.check_in ? '✓ Date provided' : 'Required'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={meta.check_out}
                    onChange={(e) => setMeta({ ...meta, check_out: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking/Confirmation ID *
                </label>
                <input
                  type="text"
                  value={meta.booking_id}
                  onChange={(e) => setMeta({ ...meta, booking_id: e.target.value })}
                  placeholder="Your internal booking reference"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className={`text-xs mt-1 ${meta.booking_id ? 'text-green-600' : 'text-gray-500'}`}>
                  {meta.booking_id ? '✓ Booking ID provided' : 'Required'}
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 border-2 py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={!isValid || uploadMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Voucher'}
            </button>
          </div>

          {!isValid && (
            <p className="text-sm text-red-600">
              Please complete all required fields and select a file.
            </p>
          )}

          {uploadMutation.isError && (
            <p className="text-sm text-red-600">
              Error: {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Upload failed'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

