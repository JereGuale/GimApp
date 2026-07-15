import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  Package, 
  Star, 
  Pencil, 
  Trash2,
  X,
  Check,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Eye,
  Copy,
  Tag,
  DollarSign,
  Layers,
  Calendar
} from 'lucide-react';
import '../components/Layout.css';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [condition, setCondition] = useState('nuevo');
  const [stock, setStock] = useState('');
  const [imageFiles, setImageFiles] = useState([]); // Support multiple files array
  const [existingImages, setExistingImages] = useState([]); // Support tracking existing images list

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null);

  // Redesign UI States
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [viewerActiveImageIdx, setViewerActiveImageIdx] = useState(0);

  const toggleFeatured = async (product) => {
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('name', product.name);
    formData.append('price', product.price);
    formData.append('category_id', product.category_id);
    formData.append('is_featured', product.is_featured ? '0' : '1');
    if (product.description) formData.append('description', product.description);
    if (product.condition) formData.append('condition', product.condition);
    if (product.stock !== null && product.stock !== undefined) {
      formData.append('stock', product.stock);
    }
    
    // Append current images to keep them
    let currentImages = [];
    if (product.images) {
      if (Array.isArray(product.images)) {
        currentImages = product.images;
      } else if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images);
          currentImages = Array.isArray(parsed) ? parsed : [product.images];
        } catch (e) {
          currentImages = [product.images];
        }
      } else {
        currentImages = [product.images];
      }
    }
    if (currentImages.length === 0 && product.image) {
      currentImages = [product.image];
    }
    currentImages.forEach(img => {
      if (img) {
        const urlStr = typeof img === 'object' ? (img.image_url || img.image_path) : String(img);
        if (urlStr) formData.append('images[]', urlStr);
      }
    });

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || 'Error al actualizar destacado');
      }

      setSuccess(product.is_featured ? 'Producto quitado de destacados' : 'Producto destacado exitosamente');
      loadData();
    } catch (err) {
      setError(err.message || 'Error al actualizar destacado');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStockDisplay = (stockVal) => {
    if (stockVal === null || stockVal === undefined) return 'Ilimitado';
    return `${stockVal} unidades`;
  };
  
  const getStockBadgeClass = (stockVal) => {
    if (stockVal === null || stockVal === undefined) return 'badge-status--featured';
    return Number(stockVal) > 0 ? 'badge-status--active' : 'badge-status--out';
  };

  const getStatusBadge = (p) => {
    if (p.stock !== null && p.stock !== undefined && Number(p.stock) <= 0) {
      return (
        <span className="badge-status badge-status--out">
          <span className="badge-status-dot badge-status-dot--out" />
          Agotado
        </span>
      );
    }
    if (p.status === 'inactive') {
      return (
        <span className="badge-status badge-status--inactive">
          <span className="badge-status-dot badge-status-dot--inactive" />
          Inactivo
        </span>
      );
    }
    return (
      <span className="badge-status badge-status--active">
        <span className="badge-status-dot badge-status-dot--active" />
        Activo
      </span>
    );
  };

  const getProductImageUrls = (p) => {
    if (!p) return [];
    let imgList = [];
    if (p.images) {
      if (Array.isArray(p.images)) {
        imgList = p.images;
      } else if (typeof p.images === 'string') {
        try {
          const parsed = JSON.parse(p.images);
          imgList = Array.isArray(parsed) ? parsed : [p.images];
        } catch (e) {
          imgList = [p.images];
        }
      } else {
        imgList = [p.images];
      }
    }
    if (imgList.length === 0 && p.image) {
      imgList = [p.image];
    }
    return imgList.map(img => getProductImageUrlString(img)).filter(Boolean);
  };

  const handleDuplicate = (p) => {
    try {
      setError('');
      setSuccess('');
      
      setEditId(null);
      setName(p.name ? `${p.name} (Copia)` : 'Producto Copia');
      setPrice(p.price || '');
      setDescription(p.description || '');
      setCategoryId(p.category_id || '');
      setIsFeatured(!!p.is_featured);
      setCondition(p.condition || 'nuevo');
      setStock(p.stock !== null && p.stock !== undefined ? String(p.stock) : '');
      setImageFiles([]);
      
      let currentImages = [];
      if (p.images) {
        if (Array.isArray(p.images)) {
          currentImages = p.images;
        } else if (typeof p.images === 'string') {
          try {
            const parsed = JSON.parse(p.images);
            currentImages = Array.isArray(parsed) ? parsed : [p.images];
          } catch (e) {
            currentImages = [p.images];
          }
        } else {
          currentImages = [p.images];
        }
      }
      
      if (currentImages.length === 0 && p.image) {
        currentImages = [p.image];
      }

      const sanitizedImages = currentImages
        .map(img => {
          if (!img) return '';
          if (typeof img === 'object') return img.image_url || img.image_path || '';
          return String(img);
        })
        .filter(img => img !== '');
      
      setExistingImages(sanitizedImages);
      setModalOpen(true);
    } catch (err) {
      console.error('Error in handleDuplicate:', err);
      setError('No se pudo duplicar el producto: ' + err.message);
    }
  };


  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        apiFetch('/admin/categories'),
        apiFetch('/admin/products'),
      ]);
      setCategories(Array.isArray(cats) ? cats : (cats?.data || []));
      setProducts(prods || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when products list size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setPrice('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setIsFeatured(false);
    setCondition('nuevo');
    setStock('');
    setImageFiles([]);
    setExistingImages([]);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    try {
      setError('');
      setSuccess('');
      
      setEditId(p.id);
      setName(p.name || '');
      setPrice(p.price || '');
      setDescription(p.description || '');
      setCategoryId(p.category_id || '');
      setIsFeatured(!!p.is_featured);
      setCondition(p.condition || 'nuevo');
      setStock(p.stock !== null && p.stock !== undefined ? String(p.stock) : '');
      setImageFiles([]);
      
      let currentImages = [];
      if (p.images) {
        if (Array.isArray(p.images)) {
          currentImages = p.images;
        } else if (typeof p.images === 'string') {
          try {
            const parsed = JSON.parse(p.images);
            currentImages = Array.isArray(parsed) ? parsed : [p.images];
          } catch (e) {
            currentImages = [p.images];
          }
        } else {
          currentImages = [p.images];
        }
      }
      
      if (currentImages.length === 0 && p.image) {
        currentImages = [p.image];
      }

      // Sanitize to ensure we only have non-empty string URLs
      const sanitizedImages = currentImages
        .map(img => {
          if (!img) return '';
          if (typeof img === 'object') return img.image_url || img.image_path || '';
          return String(img);
        })
        .filter(img => img !== '');
      
      setExistingImages(sanitizedImages);
      setModalOpen(true);
    } catch (err) {
      console.error('Error in handleOpenEdit:', err);
      setError('No se pudo abrir el editor del producto: ' + err.message);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      setError('Nombre, precio y categoría son requeridos');
      return;
    }

    // Trigger professional save confirmation
    setConfirmModal({
      title: editId ? '¿Guardar Cambios?' : '¿Crear Producto?',
      message: editId 
        ? `¿Estás seguro de que deseas guardar los cambios realizados en "${name}"?`
        : `¿Estás seguro de que deseas agregar el nuevo producto "${name}" al inventario?`,
      type: 'primary',
      onConfirm: () => executeSave()
    });
  };

  const executeSave = async () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('category_id', categoryId);
    formData.append('is_featured', isFeatured ? '1' : '0');
    formData.append('condition', condition);
    if (stock !== '') {
      formData.append('stock', parseInt(stock) || 0);
    }

    // Append remaining existing images
    if (existingImages && existingImages.length > 0) {
      existingImages.forEach(url => {
        formData.append('images[]', url);
      });
    }

    // Append multiple files correctly under images[]
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images[]', file);
      });
    }

    setError(''); setSuccess('');
    const token = localStorage.getItem('admin_token');

    try {
      let url = `${API_BASE_URL}/admin/products`;
      let options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      };

      if (editId) {
        formData.append('_method', 'PUT');
        url = `${API_BASE_URL}/admin/products/${editId}`;
      }

      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || 'Error al guardar producto');
      }

      setSuccess(editId ? 'Producto actualizado' : 'Producto creado');
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    }
  };

  const handleDelete = (p) => {
    // Trigger professional delete confirmation
    setConfirmModal({
      title: '¿Eliminar Producto?',
      message: `¿Estás seguro de que deseas eliminar el producto "${p.name}"? Esta acción removerá el producto permanentemente y no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setError(''); setSuccess('');
        try {
          await apiFetch(`/admin/products/${p.id}`, { method: 'DELETE' });
          setSuccess('Producto eliminado');
          loadData();
        } catch (err) {
          setError(err.message || 'No se pudo eliminar el producto');
        }
      }
    });
  };

  // Robust URL image string resolver
  const getProductImageUrlString = (url) => {
    if (!url) return '';
    let actualUrl = '';
    if (typeof url === 'object' && url !== null) {
      actualUrl = url.image_url || url.image_path || '';
    } else {
      actualUrl = String(url);
    }
    if (!actualUrl) return '';
    if (actualUrl.startsWith('http')) return actualUrl;
    return `${API_BASE_URL.replace('/api', '')}/storage/${actualUrl}`;
  };

  // Main product list thumbnail resolver (checks both image & images)
  const getProductImage = (p) => {
    if (!p) return null;
    let rawImage = p.image;
    
    if (!rawImage && p.images) {
      let imgList = [];
      if (Array.isArray(p.images)) {
        imgList = p.images;
      } else if (typeof p.images === 'string') {
        try {
          const parsed = JSON.parse(p.images);
          imgList = Array.isArray(parsed) ? parsed : [];
        } catch (e) {}
      }
      if (imgList.length > 0) {
        rawImage = imgList[0];
      }
    }
    
    if (!rawImage) return null;
    return getProductImageUrlString(rawImage);
  };

  // Calculate paginated slice
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Productos</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Gestiona tu catálogo de productos</p>
        </div>
        <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Agregar</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando productos...</span></div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Package size={40} /></div><p>No hay productos en inventario</p></div>
      ) : (
        <>
          {activeDropdown && <div className="actions-dropdown-overlay" onClick={() => setActiveDropdown(null)} />}

          {/* Desktop Table Layout */}
          <div className="products-desktop-view">
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Destacado</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        {getProductImage(p) ? (
                          <img src={getProductImage(p)} alt={p.name} className="product-img-thumbnail" />
                        ) : (
                          <div className="product-img-placeholder">
                            <Package size={22} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            Condición: {p.condition || 'nuevo'}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {categories.find(c => c.id === p.category_id)?.name || 'Sin Categoría'}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge-status ${getStockBadgeClass(p.stock)}`}>
                          {getStockDisplay(p.stock)}
                        </span>
                      </td>
                      <td>
                        {getStatusBadge(p)}
                      </td>
                      <td>
                        {p.is_featured ? (
                          <span className="badge-status badge-status--featured" style={{ gap: 4 }}>
                            <Star size={11} fill="currentColor" /> Sí
                          </span>
                        ) : (
                          <span className="badge-status badge-status--inactive">No</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-dropdown-wrapper">
                          <button 
                            type="button"
                            className={`actions-dropdown-trigger ${activeDropdown === p.id ? 'active' : ''}`}
                            onClick={() => setActiveDropdown(activeDropdown === p.id ? null : p.id)}
                            title="Acciones"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeDropdown === p.id && (
                            <div className="actions-dropdown-menu">
                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  setViewProduct(p);
                                  setViewerActiveImageIdx(0);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Eye size={14} />
                                <span>Ver detalles</span>
                              </button>
                              
                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleOpenEdit(p);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Pencil size={14} />
                                <span>Editar producto</span>
                              </button>

                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleDuplicate(p);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Copy size={14} />
                                <span>Duplicar</span>
                              </button>
                              
                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  toggleFeatured(p);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Star size={14} />
                                <span>{p.is_featured ? 'Quitar destacado' : 'Destacar'}</span>
                              </button>
                              
                              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                              
                              <button 
                                type="button"
                                className="actions-dropdown-item actions-dropdown-item--danger"
                                onClick={() => {
                                  handleDelete(p);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards Layout */}
          <div className="products-mobile-view">
            <div className="mobile-products-grid">
              {paginatedProducts.map(p => (
                <div className="product-mobile-card" key={p.id}>
                  <div className="product-mobile-card-header">
                    {getProductImage(p) ? (
                      <img src={getProductImage(p)} alt={p.name} className="product-mobile-card-img" />
                    ) : (
                      <div className="product-mobile-card-img-placeholder">
                        <Package size={24} />
                      </div>
                    )}
                    <div className="product-mobile-card-title-block">
                      <div className="product-mobile-card-name">{p.name}</div>
                      <div className="product-mobile-card-cat">
                        <Tag size={12} style={{ opacity: 0.6 }} />
                        <span>{categories.find(c => c.id === p.category_id)?.name || 'Sin Categoría'}</span>
                      </div>
                    </div>
                    {/* Compact actions button on mobile cards */}
                    <div className="actions-dropdown-wrapper">
                      <button 
                        type="button"
                        className={`actions-dropdown-trigger ${activeDropdown === p.id ? 'active' : ''}`}
                        onClick={() => setActiveDropdown(activeDropdown === p.id ? null : p.id)}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === p.id && (
                        <div className="actions-dropdown-menu">
                          <button 
                            type="button"
                            className="actions-dropdown-item"
                            onClick={() => {
                              setViewProduct(p);
                              setViewerActiveImageIdx(0);
                              setActiveDropdown(null);
                            }}
                          >
                            <Eye size={14} />
                            <span>Ver detalles</span>
                          </button>
                          <button 
                            type="button"
                            className="actions-dropdown-item"
                            onClick={() => {
                              handleDuplicate(p);
                              setActiveDropdown(null);
                            }}
                          >
                            <Copy size={14} />
                            <span>Duplicar</span>
                          </button>
                          <button 
                            type="button"
                            className="actions-dropdown-item"
                            onClick={() => {
                              toggleFeatured(p);
                              setActiveDropdown(null);
                            }}
                          >
                            <Star size={14} />
                            <span>{p.is_featured ? 'Quitar destacado' : 'Destacar'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="product-mobile-card-details">
                    <div className="product-mobile-card-row">
                      <span className="product-mobile-card-label">
                        <DollarSign size={14} style={{ opacity: 0.7 }} />
                        <span>Precio</span>
                      </span>
                      <span className="product-mobile-card-val" style={{ fontSize: '14px', fontWeight: 700 }}>
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="product-mobile-card-row">
                      <span className="product-mobile-card-label">
                        <Layers size={14} style={{ opacity: 0.7 }} />
                        <span>Stock</span>
                      </span>
                      <span className="product-mobile-card-val">
                        <span className={`badge-status ${getStockBadgeClass(p.stock)}`}>
                          {getStockDisplay(p.stock)}
                        </span>
                      </span>
                    </div>
                    
                    <div className="product-mobile-card-row">
                      <span className="product-mobile-card-label">
                        <FileText size={14} style={{ opacity: 0.7 }} />
                        <span>Estado</span>
                      </span>
                      <span className="product-mobile-card-val">
                        {getStatusBadge(p)}
                      </span>
                    </div>
                    
                    <div className="product-mobile-card-row">
                      <span className="product-mobile-card-label">
                        <Star size={14} style={{ opacity: 0.7 }} />
                        <span>Destacado</span>
                      </span>
                      <span className="product-mobile-card-val">
                        {p.is_featured ? (
                          <span className="badge-status badge-status--featured" style={{ gap: 4 }}>
                            <Star size={11} fill="currentColor" /> Sí
                          </span>
                        ) : (
                          <span className="badge-status badge-status--inactive">No</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="product-mobile-card-actions">
                    <button 
                      type="button"
                      className="btn-mobile-action btn-mobile-action--edit"
                      onClick={() => handleOpenEdit(p)}
                    >
                      <Pencil size={14} />
                      <span>Editar</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-mobile-action btn-mobile-action--delete"
                      onClick={() => handleDelete(p)}
                    >
                      <Trash2 size={14} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {products.length > 0 && (
            <div className="pagination">
              <button 
                type="button"
                className="btn btn--secondary" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">Página {currentPage} de {totalPages || 1}</span>
              <button 
                type="button"
                className="btn btn--secondary" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Form Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 600, padding: 0, borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <Package size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  {editId ? 'Editar producto' : 'Nuevo producto'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {editId ? 'Completa la información para actualizar el producto.' : 'Completa la información para agregar un nuevo producto.'}
                </p>
              </div>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>

            {/* Scrollable Form Body */}
            <form className="modal-form" onSubmit={handleSave}>
              <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '28px' }}>
                
                {/* Section 1: Basic Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <FileText size={16} style={{ color: 'var(--primary)' }} />
                    <span>Información básica</span>
                  </div>
                  <div className="form-group">
                    <label>Nombre del producto *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Proteína Isolate 1kg" required />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Precio (USD) *</label>
                      <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="29.99" required />
                    </div>
                    <div className="form-group">
                      <label>Categoría *</label>
                      <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                        <option value="">Selecciona...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Descripción</label>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{description.length} / 500</span>
                    </div>
                    <textarea rows="3" maxLength="500" value={description} onChange={e => setDescription(e.target.value)} placeholder="Escribe detalles del producto..."></textarea>
                  </div>
                </div>

                {/* Section 2: Inventory & Stock */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <Package size={16} style={{ color: 'var(--primary)' }} />
                    <span>Inventario y estado</span>
                  </div>
                  <div className="form-grid-3" style={{ alignItems: 'center' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Condición *</label>
                      <select value={condition} onChange={e => setCondition(e.target.value)}>
                        <option value="nuevo">Nuevo</option>
                        <option value="usado">Usado</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Stock (unidades) *</label>
                      <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="Ej. 50" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, paddingLeft: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text)', marginTop: 22 }}>
                        <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: 'auto' }} />
                        <span style={{ fontSize: 12, lineHeight: 1.2 }}>Destacar producto</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 3: Product Image & Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <ImageIcon size={16} style={{ color: 'var(--primary)' }} />
                    <span>Imagen del producto</span>
                  </div>
                  
                  {/* Upload Area */}
                  <div 
                    style={{ 
                      border: '2px dashed var(--primary-light)', 
                      borderRadius: '12px', 
                      padding: '24px', 
                      textAlign: 'center', 
                      background: 'rgba(37, 99, 235, 0.01)', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => document.getElementById('product-image-file').click()}
                  >
                    <input 
                      type="file" 
                      id="product-image-file" 
                      accept="image/*" 
                      multiple
                      onChange={e => {
                        const files = Array.from(e.target.files);
                        setImageFiles(prev => [...prev, ...files]);
                      }} 
                      style={{ display: 'none' }} 
                    />
                    <div style={{ color: 'var(--primary)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                      <Plus size={28} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      Arrastra y suelta una imagen aquí o <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>selecciona un archivo</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                      Formatos soportados: JPG, PNG, WEBP • Múltiples • Máx. 5MB
                    </div>
                  </div>

                  {/* Image Preview Box */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Vista previa</div>
                    
                    {/* Render newly uploaded files */}
                    {imageFiles.map((file, idx) => (
                      <div key={`new-img-${idx}`} style={{ display: 'flex', gap: 16, alignItems: 'center', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', background: 'var(--bg)', marginBottom: 8 }}>
                        <img 
                          src={URL.createObjectURL(file)} 
                          style={{ width: 60, height: 60, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 280 }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {(file.size / (1024 * 1024)).toFixed(2)} MB (Por subir)
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn--ghost" 
                          style={{ padding: 6, borderRadius: '50%', color: 'var(--danger-text)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    {/* Render existing images from server */}
                    {editId && existingImages.length > 0 && (
                      <div>
                        {existingImages.map((url, idx) => {
                          const resolvedUrl = getProductImageUrlString(url);
                          return (
                            <div key={`exist-img-${idx}`} style={{ display: 'flex', gap: 16, alignItems: 'center', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', background: 'var(--bg)', marginBottom: 8 }}>
                              <img 
                                src={resolvedUrl} 
                                style={{ width: 60, height: 60, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 280 }}>
                                  Imagen guardada {idx + 1}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  Conservando imagen actual
                                </div>
                              </div>
                              <button 
                                type="button" 
                                className="btn btn--ghost" 
                                style={{ padding: 6, borderRadius: '50%', color: 'var(--danger-text)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExistingImages(prev => prev.filter((_, i) => i !== idx));
                                }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '20px 28px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Check size={16} />
                  <span>Guardar producto</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Professional Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center', padding: '32px 24px' }} onClick={e => e.stopPropagation()}>
            <div style={{
               width: 56,
               height: 56,
               borderRadius: '50%',
               backgroundColor: confirmModal.type === 'danger' ? 'var(--danger-light)' : 'var(--primary-light)',
               color: confirmModal.type === 'danger' ? 'var(--danger-text)' : 'var(--primary)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               margin: '0 auto 16px auto'
            }}>
              {confirmModal.type === 'danger' ? <Trash2 size={24} /> : <Check size={24} />}
            </div>
            
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {confirmModal.title}
            </h3>
            
            <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setConfirmModal(null)}>
                Cancelar
              </button>
              <button 
                className={`btn btn--${confirmModal.type === 'danger' ? 'danger' : 'primary'}`} 
                style={{ flex: 1 }} 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Viewer Modal */}
      {viewProduct && (
        <div className="modal-overlay" onClick={() => setViewProduct(null)}>
          <div className="modal" style={{ maxWidth: 700, padding: 0, borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <Eye size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  Detalles del producto
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Información técnica y visual de tu inventario.
                </p>
              </div>
              <button type="button" className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setViewProduct(null)}><X size={18} /></button>
            </div>

            {/* Body */}
            <div className="viewer-details-grid">
              {/* Left Column: Images */}
              <div className="viewer-image-container">
                {getProductImageUrls(viewProduct).length > 0 ? (
                  <>
                    <img 
                      src={getProductImageUrls(viewProduct)[viewerActiveImageIdx] || getProductImageUrls(viewProduct)[0]} 
                      alt={viewProduct.name} 
                      className="viewer-main-img" 
                    />
                    {getProductImageUrls(viewProduct).length > 1 && (
                      <div className="viewer-thumb-gallery">
                        {getProductImageUrls(viewProduct).map((url, idx) => (
                          <img 
                            key={`viewer-thumb-${idx}`}
                            src={url}
                            alt=""
                            className={`viewer-thumb-img ${viewerActiveImageIdx === idx ? 'active' : ''}`}
                            onClick={() => setViewerActiveImageIdx(idx)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="viewer-main-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5, border: '1px solid var(--border)' }}>
                    <Package size={64} />
                  </div>
                )}
              </div>

              {/* Right Column: Metadata */}
              <div className="viewer-info-pane">
                <div className="viewer-title-section">
                  <span className="viewer-category-tag">
                    {categories.find(c => c.id === viewProduct.category_id)?.name || 'Sin Categoría'}
                  </span>
                  <h2 className="viewer-product-name">{viewProduct.name}</h2>
                  <div className="viewer-price-badge">
                    ${Number(viewProduct.price).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {getStatusBadge(viewProduct)}
                  {viewProduct.is_featured ? (
                    <span className="badge-status badge-status--featured" style={{ gap: 4 }}>
                      <Star size={12} fill="currentColor" /> Destacado
                    </span>
                  ) : null}
                  <span className="badge-status badge-status--inactive" style={{ textTransform: 'uppercase' }}>
                    Condición: {viewProduct.condition || 'nuevo'}
                  </span>
                </div>

                {viewProduct.description ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Descripción</div>
                    <div className="viewer-description-box">
                      {viewProduct.description}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--text-secondary)' }}>Sin descripción disponible</div>
                )}

                <div className="viewer-metadata-grid">
                  <div className="viewer-meta-item">
                    <span className="viewer-meta-label">Stock disponible</span>
                    <span className="viewer-meta-value">
                      {viewProduct.stock !== null && viewProduct.stock !== undefined ? `${viewProduct.stock} Unidades` : 'Ilimitado'}
                    </span>
                  </div>
                  <div className="viewer-meta-item">
                    <span className="viewer-meta-label">Fecha de registro</span>
                    <span className="viewer-meta-value">
                      {formatDate(viewProduct.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '20px 28px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
              <button 
                type="button" 
                className="btn btn--secondary" 
                onClick={() => setViewProduct(null)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn--primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  handleOpenEdit(viewProduct);
                  setViewProduct(null);
                }}
              >
                <Pencil size={16} />
                <span>Editar Producto</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
