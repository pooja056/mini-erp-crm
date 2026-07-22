import React, { useRef } from 'react';
import { Challan } from '../types';
import { Printer, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  challan: Challan | null;
  onClose: () => void;
}

export const ChallanPdfModal: React.FC<Props> = ({ challan, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!challan) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${challan.challanNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF download.');
    }
  };

  const snap = challan.customerSnap || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '800px', backgroundColor: '#fff', color: '#111827' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h2 style={{ color: '#111827' }}>Sales Challan Invoice</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ color: '#111827', borderColor: '#d1d5db' }}>
              <Printer size={16} /> Print
            </button>
            <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm">
              <Download size={16} /> Export PDF
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
              <X size={20} color="#4b5563" />
            </button>
          </div>
        </div>

        {/* Printable Section */}
        <div ref={printRef} style={{ padding: '1.5rem', background: '#ffffff', color: '#111827' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5' }}>WHOLESALE DISTRIBUTORS INC.</h1>
              <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>100 Distribution Way, Logistics Hub, City</p>
              <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>Phone: +91 98765 00000 | Email: billing@company.com</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>OFFICIAL CHALLAN</h2>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', marginTop: '0.25rem' }}>#{challan.challanNumber}</p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Date: {new Date(challan.createdAt).toLocaleDateString()}
              </p>
              <span style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: challan.status === 'CONFIRMED' ? '#d1fae5' : '#fef3c7',
                color: challan.status === 'CONFIRMED' ? '#065f46' : '#92400e'
              }}>
                STATUS: {challan.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.3rem' }}>Customer Details:</h4>
              <strong style={{ fontSize: '1rem', color: '#111827' }}>{snap.name || challan.customer?.name}</strong>
              <p style={{ fontSize: '0.85rem', color: '#374151' }}>{snap.businessName || challan.customer?.businessName}</p>
              <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>{snap.address || challan.customer?.address}</p>
              <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>Mobile: {snap.mobile || challan.customer?.mobile}</p>
              {snap.gstNumber && <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>GSTIN: {snap.gstNumber}</p>}
            </div>
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.3rem' }}>Dispatch & Issuer Details:</h4>
              <p style={{ fontSize: '0.85rem', color: '#374151' }}>Issued By: {challan.createdBy?.name} ({challan.createdBy?.role})</p>
              <p style={{ fontSize: '0.85rem', color: '#374151' }}>Payment Terms: Net 30 Days</p>
              <p style={{ fontSize: '0.85rem', color: '#374151' }}>Mode of Transport: Road Freight</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.8rem', color: '#374151' }}>#</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.8rem', color: '#374151' }}>Product Details</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.8rem', color: '#374151' }}>SKU</th>
                <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.8rem', color: '#374151' }}>Unit Price</th>
                <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.8rem', color: '#374151' }}>Qty</th>
                <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.8rem', color: '#374151' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.6rem', fontSize: '0.85rem', color: '#6b7280' }}>{idx + 1}</td>
                  <td style={{ padding: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{item.productName}</td>
                  <td style={{ padding: '0.6rem', fontSize: '0.85rem', color: '#4b5563' }}>{item.productSku}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.85rem', color: '#374151' }}>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{item.quantity}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>₹{item.subtotal?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: '300px' }}>
              <p>Received goods in clean & sound condition.</p>
              <div style={{ marginTop: '3rem', borderTop: '1px dashed #9ca3af', paddingTop: '0.3rem' }}>
                Authorized Customer Signature
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>Total Quantity: <strong>{challan.totalQty} items</strong></p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '0.5rem' }}>
                Total Amount: <span style={{ color: '#4f46e5' }}>₹{challan.totalAmount.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
