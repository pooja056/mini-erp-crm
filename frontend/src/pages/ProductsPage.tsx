import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product, Pagination } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Edit, AlertTriangle, ArrowUpRight, ArrowDownLeft, Package, MapPin, Tag, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToCsv } from '../utils/exportCsv';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Product Create/Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    location: '',
  });
  const [productFormError, setProductFormError] = useState('');

  // Stock Adjust Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    qtyChanged: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });
  const [stockFormError, setStockFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: debouncedSearch,
        category: categoryFilter,
        lowStock: lowStockOnly ? 'true' : 'false',
      }).toString();

      const res = await api.get<{ products: Product[]; pagination: Pagination }>(`/products?${query}`);
      setProducts(res.products || []);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      toast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, categoryFilter, lowStockOnly]);

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 5,
      location: '',
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    setSubmitting(true);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
        toast('Product updated successfully', 'success');
      } else {
        await api.post('/products', productForm);
        toast('Product created successfully', 'success');
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setProductFormError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const openStockAdjustModal = (p: Product) => {
    setSelectedProductForStock(p);
    setStockForm({
      qtyChanged: 1,
      movementType: 'IN',
      reason: 'Purchase Order Received / Warehouse Stock Count',
    });
    setStockFormError('');
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock) return;
    setStockFormError('');
    setSubmitting(true);

    try {
      await api.post(`/products/${selectedProductForStock.id}/adjust-stock`, stockForm);
      setIsStockModalOpen(false);
      fetchProducts();
      toast('Stock adjusted successfully', 'success');
    } catch (err: any) {
      setStockFormError(err.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const canEditProduct = ['ADMIN', 'WAREHOUSE'].includes(user?.role || '');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Product & Inventory Module</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Catalog management, stock levels, warehouse location tracking, and stock movement logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => {
              const data = products.map(p => ({
                Name: p.name,
                SKU: p.sku,
                Category: p.category,
                'Unit Price': p.unitPrice,
                'Current Stock': p.currentStock,
                'Min Alert': p.minStockAlert,
                Location: p.location
              }));
              exportToCsv('products.csv', data);
              toast('Exported to CSV', 'info');
            }} 
            className="btn btn-secondary"
          >
            <Download size={18} />
            <span className="hidden-mobile">Export</span>
          </button>
          <Link to="/stock-logs" className="btn btn-secondary">
            Stock Logs
          </Link>
          {canEditProduct && (
            <button onClick={openCreateProductModal} className="btn btn-primary">
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by product name, SKU, warehouse location..."
              style={{ paddingLeft: '2.4rem' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <input
            type="text"
            className="form-control"
            placeholder="Filter by Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--warning-text)' }}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
            />
            <span>Show Low Stock Only ⚠️</span>
          </label>
        </div>
      </div>

      {/* Product List Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading inventory catalog...</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Level</th>
                  <th>Min Alert Qty</th>
                  <th>Location / Warehouse</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.currentStock <= p.minStockAlert;
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{p.name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                            <Tag size={12} /> SKU: {p.sku}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{p.category}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: isLow ? 'var(--warning-text)' : '#fff' }}>
                              {p.currentStock}
                            </span>
                            {isLow && (
                              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                <AlertTriangle size={10} style={{ marginRight: '2px' }} /> LOW STOCK
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.minStockAlert} units</td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={12} color="var(--accent-secondary)" /> {p.location}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            {canEditProduct && (
                              <>
                                <button
                                  onClick={() => openStockAdjustModal(p)}
                                  className="btn btn-secondary btn-sm"
                                  title="Record Stock IN or Stock OUT"
                                  style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                                >
                                  Stock IN/OUT
                                </button>
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  className="btn btn-secondary btn-sm"
                                  title="Edit Product Details"
                                >
                                  <Edit size={14} /> Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} products)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        {productFormError && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {productFormError}
          </div>
        )}

        <form onSubmit={handleSaveProduct}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>SKU / Code *</label>
              <input
                type="text"
                className="form-control"
                placeholder="SKU-1001"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Electronics, Furniture, etc."
                required
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                required
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {!editingProduct && (
              <div className="form-group">
                <label>Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={productForm.currentStock}
                  onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}

            <div className="form-group">
              <label>Min Stock Alert Quantity *</label>
              <input
                type="number"
                min="0"
                className="form-control"
                required
                value={productForm.minStockAlert}
                onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Warehouse / Location *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Warehouse A - Bay 4"
              required
              value={productForm.location}
              onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Stock: ${selectedProductForStock?.name || ''}`}
      >
        {stockFormError && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {stockFormError}
          </div>
        )}

        <form onSubmit={handleSaveStock}>
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#151d2a',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.875rem'
          }}>
            <div>Current Stock: <strong>{selectedProductForStock?.currentStock} units</strong></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Location: {selectedProductForStock?.location}
            </div>
          </div>

          <div className="form-group">
            <label>Movement Type *</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mtype"
                  value="IN"
                  checked={stockForm.movementType === 'IN'}
                  onChange={() => setStockForm({ ...stockForm, movementType: 'IN' })}
                />
                <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>Stock IN (Add)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mtype"
                  value="OUT"
                  checked={stockForm.movementType === 'OUT'}
                  onChange={() => setStockForm({ ...stockForm, movementType: 'OUT' })}
                />
                <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>Stock OUT (Reduce)</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Quantity *</label>
            <input
              type="number"
              min="1"
              className="form-control"
              required
              value={stockForm.qtyChanged}
              onChange={(e) => setStockForm({ ...stockForm, qtyChanged: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="form-group">
            <label>Reason for Movement *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Purchase order arrival, Damaged return, Warehouse audit"
              required
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsStockModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Updating...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
