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
  Tag,
  DollarSign,
  Layers,
  Calendar,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ArrowLeft,
  Search,
  Grid
} from 'lucide-react';
import '../components/Layout.css';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Category view & Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // null = Categories Grid, 'all' = All Products, ID = Specific Category
  const [searchTerm, setSearchTerm] = useState('');

  // Inline Category Creation & Management Modal states
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');
  const [catLoading, setCatLoading] = useState(false);

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
  const [optionsStr, setOptionsStr] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null);

  // Redesign UI States
  const [activeDropdown, setActiveDropdown] = useState(null);

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

  // Reset pagination when products, filter category or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, selectedCategoryId, searchTerm]);

  // Close active dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeDropdown === null) return;
      if (!e.target.closest('.actions-dropdown-wrapper')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeDropdown]);

  // Inline Category Management Handlers
  const handleOpenAddCategory = () => {
    setEditCatId(null);
    setNewCatName('');
    setCatError('');
    setCatModalOpen(true);
  };

  const handleOpenEditCategory = (e, cat) => {
    e.stopPropagation();
    setEditCatId(cat.id);
    setNewCatName(cat.name || '');
    setCatError('');
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError('El nombre de la categoría es requerido');
      return;
    }
    setCatError('');
    setCatLoading(true);
    try {
      if (editCatId) {
        await apiFetch(`/admin/categories/${editCatId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: newCatName.trim() }),
        });
        setSuccess(`Categoría actualizada a "${newCatName.trim()}"`);
      } else {
        await apiFetch('/admin/categories', {
          method: 'POST',
          body: JSON.stringify({ name: newCatName.trim() }),
        });
        setSuccess(`Categoría "${newCatName.trim()}" creada exitosamente`);
      }
      setNewCatName('');
      setEditCatId(null);
      setCatModalOpen(false);
      loadData();
    } catch (err) {
      setCatError(err.message || 'Error al guardar la categoría');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = (e, cat) => {
    e.stopPropagation();
    setConfirmModal({
      title: '¿Eliminar Categoría?',
      message: `¿Estás seguro de que deseas eliminar la categoría "${cat.name}"? Los productos asignados conservarán la vista como sin categoría.`,
      type: 'danger',
      onConfirm: async () => {
        setError(''); setSuccess('');
        try {
          await apiFetch(`/admin/categories/${cat.id}`, { method: 'DELETE' });
          setSuccess('Categoría eliminada');
          if (selectedCategoryId === cat.id) {
            setSelectedCategoryId(null);
          }
          loadData();
        } catch (err) {
          setError(err.message || 'No se pudo eliminar la categoría');
        }
      }
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setPrice('');
    setDescription('');
    // Pre-select current active category if viewing a specific category
    const defaultCat = (selectedCategoryId && selectedCategoryId !== 'all' && selectedCategoryId !== 'uncategorized')
      ? selectedCategoryId
      : (categories[0]?.id || '');
    setCategoryId(defaultCat);
    setIsFeatured(false);
    setCondition('nuevo');
    setStock('');
    setImageFiles([]);
    setExistingImages([]);
    setOptionsStr('');
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
      
      // Parse available options / sizes
      let parsedOptions = [];
      if (p.options) {
        if (Array.isArray(p.options)) {
          parsedOptions = p.options;
        } else if (typeof p.options === 'string') {
          try {
            parsedOptions = JSON.parse(p.options);
          } catch (e) {
            parsedOptions = p.options.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
      }
      setOptionsStr(Array.isArray(parsedOptions) ? parsedOptions.join(', ') : '');

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

    // Parse optionsStr by commas and append as array
    const parsedOptions = optionsStr
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);
    
    if (parsedOptions.length > 0) {
      parsedOptions.forEach(opt => {
        formData.append('options[]', opt);
      });
    } else {
      // If empty options string, send an empty array value to clear it
      formData.append('options[]', '');
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

  // Filter products by selected category and search term
  const filteredProducts = products.filter(p => {
    // Category Filter
    if (selectedCategoryId === 'uncategorized') {
      if (p.category_id && categories.some(c => Number(c.id) === Number(p.category_id))) {
        return false;
      }
    } else if (selectedCategoryId && selectedCategoryId !== 'all' && selectedCategoryId !== null) {
      if (Number(p.category_id) !== Number(selectedCategoryId)) {
        return false;
      }
    }

    // Search Term Filter
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(query);
      const matchDesc = p.description?.toLowerCase().includes(query);
      const catName = categories.find(c => Number(c.id) === Number(p.category_id))?.name?.toLowerCase();
      const matchCat = catName ? catName.includes(query) : false;
      return matchName || matchDesc || matchCat;
    }

    return true;
  });

  // Calculate paginated slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Uncategorized products count
  const uncategorizedCount = products.filter(p => !p.category_id || !categories.some(c => Number(c.id) === Number(p.category_id))).length;

  const getCategoryName = (catId) => {
    if (catId === 'all') return 'Todos los Productos';
    if (catId === 'uncategorized') return 'Sin Categoría';
    return categories.find(c => Number(c.id) === Number(catId))?.name || 'Categoría';
  };

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando catálogo...</span></div>
      ) : products.length === 0 ? (
        <>
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
          <div className="empty-state"><div className="empty-icon"><Package size={40} /></div><p>No hay productos en inventario</p></div>
        </>
      ) : selectedCategoryId === null && searchTerm.trim() === '' ? (
        /* ==================================================================
           VISTA PRINCIPAL: CUADRÍCULA DE CATEGORÍAS (Categorized Main View)
           ================================================================== */
        <>
          <div className="page-header">
            <div>
              <h2 style={{ margin: 0 }}>Catálogo por Categorías</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Selecciona una categoría para ver y administrar sus productos
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn--secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAddCategory}>
                <span>+ Categoría</span>
              </button>
              <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
                <Plus size={16} />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Bar de búsqueda global de catálogo */}
          <div className="category-search-bar">
            <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input 
              type="text" 
              className="category-search-input" 
              placeholder="Buscar cualquier producto o categoría por nombre..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn btn--ghost" style={{ padding: 4, borderRadius: '50%' }} onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Grid de Categorías */}
          <div className="categories-grid">
            
            {/* Tarjeta 1: Todos los Productos */}
            <div className="category-card" onClick={() => setSelectedCategoryId('all')}>
              <div className="category-card-header">
                <div className="category-card-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                  <Layers size={22} />
                </div>
                <span className="category-card-badge">{products.length} productos</span>
              </div>
              <div>
                <h3 className="category-card-title">Todos los Productos</h3>
                <p className="category-card-desc">Visualiza y gestiona el inventario completo de tu gimnasio sin filtros.</p>
              </div>
              <div className="category-card-footer">
                <div className="category-thumbnails-stack">
                  {products.slice(0, 3).map((p, idx) => {
                    const imgUrl = getProductImage(p);
                    return imgUrl ? (
                      <img key={p.id} src={imgUrl} alt={p.name} className="category-thumbnail-mini" />
                    ) : (
                      <div key={p.id} className="category-thumbnail-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={12} />
                      </div>
                    );
                  })}
                </div>
                <span className="category-card-action">
                  Ver todos <ChevronRight size={16} />
                </span>
              </div>
            </div>

            {/* Tarjetas de Categorías Específicas */}
            {categories.map(cat => {
              const catProds = products.filter(p => Number(p.category_id) === Number(cat.id));
              return (
                <div key={cat.id} className="category-card" onClick={() => setSelectedCategoryId(cat.id)}>
                  <div className="category-card-header">
                    <div className="category-card-icon">
                      <Folder size={22} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button 
                        type="button" 
                        className="btn btn--ghost" 
                        style={{ padding: '4px 6px', height: 'auto', color: 'var(--text-secondary)' }}
                        title="Editar categoría"
                        onClick={(e) => handleOpenEditCategory(e, cat)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="btn btn--ghost" 
                        style={{ padding: '4px 6px', height: 'auto', color: 'var(--danger-text)' }}
                        title="Eliminar categoría"
                        onClick={(e) => handleDeleteCategory(e, cat)}
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className="category-card-badge">{catProds.length} productos</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="category-card-title">{cat.name}</h3>
                    <p className="category-card-desc">
                      {catProds.length === 1 ? '1 producto registrado en esta sección.' : `${catProds.length} productos registrados en esta sección.`}
                    </p>
                  </div>
                  <div className="category-card-footer">
                    <div className="category-thumbnails-stack">
                      {catProds.slice(0, 3).map(p => {
                        const imgUrl = getProductImage(p);
                        return imgUrl ? (
                          <img key={p.id} src={imgUrl} alt={p.name} className="category-thumbnail-mini" />
                        ) : (
                          <div key={p.id} className="category-thumbnail-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={12} />
                          </div>
                        );
                      })}
                    </div>
                    <span className="category-card-action">
                      Explorar <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Tarjeta opcional: Sin Categoría */}
            {uncategorizedCount > 0 && (
              <div className="category-card" onClick={() => setSelectedCategoryId('uncategorized')}>
                <div className="category-card-header">
                  <div className="category-card-icon" style={{ background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-secondary)' }}>
                    <Package size={22} />
                  </div>
                  <span className="category-card-badge">{uncategorizedCount} productos</span>
                </div>
                <div>
                  <h3 className="category-card-title">Sin Categoría</h3>
                  <p className="category-card-desc">Productos creados que aún no tienen una categoría asignada.</p>
                </div>
                <div className="category-card-footer">
                  <span className="category-card-action">
                    Ver <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            )}

          </div>
        </>
      ) : (
        /* ==================================================================
           VISTA DETALLADA DE PRODUCTOS POR CATEGORÍA (Drill-Down Detail View)
           ================================================================== */
        <>
          {/* Breadcrumbs Navigation Bar */}
          <div className="breadcrumbs-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="back-btn" onClick={() => setSelectedCategoryId(null)}>
                <ArrowLeft size={16} />
                <span>Volver a Categorías</span>
              </button>
              <div className="breadcrumbs-path">
                <span>Categorías</span>
                <ChevronRight size={14} />
                <span className="breadcrumbs-current">{getCategoryName(selectedCategoryId)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn--secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAddCategory}>
                <FolderPlus size={16} />
                <span>+ Categoría</span>
              </button>
              <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
                <Plus size={16} />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar for Quick Switch */}
          <div className="category-chips-wrapper">
            <button 
              type="button" 
              className={`category-chip ${selectedCategoryId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId('all')}
            >
              <span>Todos</span>
              <span className="category-chip-count">{products.length}</span>
            </button>

            {categories.map(cat => {
              const count = products.filter(p => Number(p.category_id) === Number(cat.id)).length;
              return (
                <button 
                  key={cat.id}
                  type="button" 
                  className={`category-chip ${Number(selectedCategoryId) === Number(cat.id) ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  <span>{cat.name}</span>
                  <span className="category-chip-count">{count}</span>
                </button>
              );
            })}

            {uncategorizedCount > 0 && (
              <button 
                type="button" 
                className={`category-chip ${selectedCategoryId === 'uncategorized' ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId('uncategorized')}
              >
                <span>Sin Categoría</span>
                <span className="category-chip-count">{uncategorizedCount}</span>
              </button>
            )}
          </div>

          {/* Bar de búsqueda dentro de la categoría */}
          <div className="category-search-bar">
            <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input 
              type="text" 
              className="category-search-input" 
              placeholder={`Filtrar productos en ${getCategoryName(selectedCategoryId)}...`} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn btn--ghost" style={{ padding: 4, borderRadius: '50%' }} onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Listado de Productos Filtrados */}
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Package size={40} /></div>
              <p style={{ fontWeight: 600 }}>No hay productos en esta categoría o búsqueda</p>
              <button 
                className="btn btn--secondary" 
                style={{ marginTop: 12 }} 
                onClick={() => { setSearchTerm(''); setSelectedCategoryId('all'); }}
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <>
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
                      {paginatedProducts.map((p, index) => {
                        const isLastRow = index >= paginatedProducts.length - 1 && index > 0;
                        return (
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
                                <div className={`actions-dropdown-menu ${isLastRow ? 'open-up' : ''}`}>
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
                        );
                      })}
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              {filteredProducts.length > 0 && (
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

                {/* Section 2.5: Opciones / Tallas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <Tag size={16} style={{ color: 'var(--primary)' }} />
                    <span>Variantes y Tallas</span>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Tallas o Presentaciones disponibles</label>
                    <input 
                      type="text" 
                      value={optionsStr} 
                      onChange={e => setOptionsStr(e.target.value)} 
                      placeholder="Ej: S, M, L, XL (separadas por comas)" 
                    />
                    <small style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                      Define las tallas de ropa o variaciones de peso de suplementos separadas por comas. Si se deja vacío, no se mostrará selector en el móvil.
                    </small>
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

      {/* Inline Category Creation Modal */}
      {catModalOpen && (
        <div className="modal-overlay" onClick={() => setCatModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 420, padding: 0, borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <FolderPlus size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {editCatId ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {editCatId ? 'Modifica el nombre de la categoría' : 'Agrega una categoría al catálogo de productos'}
                </p>
              </div>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setCatModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div style={{ padding: '24px' }}>
                {catError && (
                  <div className="alert alert--error" style={{ marginBottom: 16 }}>
                    <AlertTriangle size={16} />
                    <span>{catError}</span>
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'block' }}>
                    Nombre de la categoría *
                  </label>
                  <input 
                    type="text" 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    placeholder="Ej. Suplementos, Accesorios, Ropa..." 
                    required 
                    autoFocus
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setCatModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={catLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {catLoading ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
                  <span>Guardar categoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
