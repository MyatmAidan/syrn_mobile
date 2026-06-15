import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  RefresherEventDetail,
} from '@ionic/react';
import {
  sparklesOutline,
  searchOutline,
  gridOutline,
  listOutline,
  albumsOutline,
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import {
  ApiService,
  Product,
  Category,
  getSkinTypeLabel,
  formatProductPrice,
  getProductImageUrl,
} from '../services/apiService';
import './Catalog.css';

const SKIN_TYPES = ['All', 'Dry', 'Oily', 'Sensitive', 'Normal', 'Combination'];
const VIEW_MODE_KEY = 'catalog_view_mode';

type ViewMode = 'grid' | 'list' | 'compact';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const VIEW_OPTIONS: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: 'grid', icon: gridOutline, label: 'Grid' },
  { mode: 'list', icon: listOutline, label: 'List' },
  { mode: 'compact', icon: albumsOutline, label: 'Compact' },
];

interface CatalogSkeletonProps {
  viewMode: ViewMode;
}

const CatalogSkeleton: React.FC<CatalogSkeletonProps> = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="syrn-skeleton-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="syrn-skeleton-list-item syrn-glass">
            <div className="syrn-skeleton syrn-skeleton-list-thumb" />
            <div className="syrn-skeleton-list-text">
              <div className="syrn-skeleton syrn-skeleton-text" />
              <div className="syrn-skeleton syrn-skeleton-text short" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const columns = viewMode === 'compact' ? 3 : 2;
  return (
    <div className={`syrn-skeleton-grid syrn-skeleton-grid--${columns}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="syrn-skeleton-card syrn-glass">
          <div className="syrn-skeleton syrn-skeleton-image" />
          {viewMode === 'grid' && (
            <>
              <div className="syrn-skeleton syrn-skeleton-text" />
              <div className="syrn-skeleton syrn-skeleton-text short" />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

interface ProductImageProps {
  product: Product;
  className?: string;
  initialsClassName?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({
  product,
  className = 'syrn-product-card-image',
  initialsClassName = 'syrn-placeholder-text',
}) => {
  const imageUrl = getProductImageUrl(product);
  const initials = product.brand?.brand_name
    ? product.brand.brand_name.substring(0, 2).toUpperCase()
    : 'SN';

  if (imageUrl) {
    return <img src={imageUrl} alt={product.product_name} className={className} />;
  }

  return (
    <div className="syrn-product-card-placeholder">
      <span className={initialsClassName}>{initials}</span>
    </div>
  );
};

interface ProductSkinTagProps {
  skinType: Product['skin_type'];
  className?: string;
}

const ProductSkinTag: React.FC<ProductSkinTagProps> = ({ skinType, className = 'syrn-product-card-tag' }) => {
  const label = getSkinTypeLabel(skinType);
  if (!label) return null;

  return (
    <span className={className}>
      <IonIcon icon={sparklesOutline} className="syrn-product-tag-icon" />
      {label}
    </span>
  );
};

const Catalog: React.FC = () => {
  const history = useHistory();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Preferences.get({ key: VIEW_MODE_KEY }).then(({ value }) => {
      if (value === 'grid' || value === 'list' || value === 'compact') {
        setViewMode(value);
      }
    });
  }, []);

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode);
    await Preferences.set({ key: VIEW_MODE_KEY, value: mode });
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apiCategories, apiProducts] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getProducts(),
      ]);
      setCategories(apiCategories);
      setProducts(apiProducts);
    } catch (error) {
      console.error('Error fetching catalog data:', error);
      setCategories([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchData();
    event.detail.complete();
  };

  const getFilteredProducts = () => {
    return products.filter((product) => {
      const productCategoryId = product.category?.category_id ?? product.category_id;
      const matchesCategory =
        selectedCategoryId === null ||
        Number(productCategoryId) === Number(selectedCategoryId);

      const matchesSearch =
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand?.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const skinName = getSkinTypeLabel(product.skin_type);
      const matchesSkin =
        selectedSkinType === 'All' ||
        skinName?.toLowerCase() === selectedSkinType.toLowerCase();

      return matchesCategory && matchesSearch && matchesSkin;
    });
  };

  const filtered = getFilteredProducts();

  const openProduct = (productId: number) => {
    history.push(`/app/catalog/product/${productId}`);
  };

  const renderGridCard = (prod: Product, index: number) => (
    <div
      key={prod.product_id}
      className="syrn-product-card syrn-stagger-item"
      style={{ animationDelay: `${Math.min(index, 7) * 60}ms` }}
      onClick={() => openProduct(prod.product_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openProduct(prod.product_id)}
    >
      <div className="syrn-product-card-image-container">
        <ProductImage product={prod} />
        <ProductSkinTag skinType={prod.skin_type} />
      </div>
      <div className="syrn-product-card-info">
        <span className="syrn-product-card-brand">{prod.brand?.brand_name}</span>
        <h3 className="syrn-product-card-name">{prod.product_name}</h3>
        <span className="syrn-product-card-price">${formatProductPrice(prod.price)}</span>
      </div>
    </div>
  );

  const renderListCard = (prod: Product, index: number) => (
    <div
      key={prod.product_id}
      className="syrn-product-list-card syrn-stagger-item"
      style={{ animationDelay: `${Math.min(index, 7) * 50}ms` }}
      onClick={() => openProduct(prod.product_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openProduct(prod.product_id)}
    >
      <div className="syrn-product-list-thumb">
        <ProductImage
          product={prod}
          className="syrn-product-list-image"
          initialsClassName="syrn-placeholder-text syrn-placeholder-text--sm"
        />
      </div>
      <div className="syrn-product-list-body">
        <div className="syrn-product-list-top">
          <span className="syrn-product-card-brand">{prod.brand?.brand_name}</span>
          <ProductSkinTag skinType={prod.skin_type} className="syrn-product-list-tag" />
        </div>
        <h3 className="syrn-product-list-name">{prod.product_name}</h3>
        {prod.category?.category_name && (
          <span className="syrn-product-list-category">{prod.category.category_name}</span>
        )}
        <span className="syrn-product-list-price">${formatProductPrice(prod.price)}</span>
      </div>
    </div>
  );

  const renderCompactCard = (prod: Product, index: number) => (
    <div
      key={prod.product_id}
      className="syrn-product-compact-card syrn-stagger-item"
      style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
      onClick={() => openProduct(prod.product_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openProduct(prod.product_id)}
    >
      <div className="syrn-product-compact-image-container">
        <ProductImage
          product={prod}
          className="syrn-product-compact-image"
          initialsClassName="syrn-placeholder-text syrn-placeholder-text--xs"
        />
      </div>
      <span className="syrn-product-compact-price">${formatProductPrice(prod.price)}</span>
    </div>
  );

  const renderProducts = () => {
    if (viewMode === 'list') {
      return (
        <div className="syrn-product-list">
          {filtered.map((prod, index) => renderListCard(prod, index))}
        </div>
      );
    }

    if (viewMode === 'compact') {
      return (
        <div className="syrn-product-compact-grid">
          {filtered.map((prod, index) => renderCompactCard(prod, index))}
        </div>
      );
    }

    return (
      <div className="syrn-product-grid">
        {filtered.map((prod, index) => renderGridCard(prod, index))}
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader className="syrn-catalog-header ion-no-border">
        <IonToolbar className="syrn-catalog-toolbar" />
      </IonHeader>

      <IonContent className="syrn-catalog-content syrn-page-bg" scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="syrn-catalog-hero">
          <p className="syrn-catalog-greeting">✨ {getGreeting()}</p>
          <h1 className="syrn-catalog-hero-title syrn-brand-font syrn-animate-gradient-text">Explore Syrn</h1>
          <p className="syrn-catalog-hero-sub">Curated skincare for your unique glow</p>
        </div>

        <div className="syrn-search-section">
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
            placeholder="Search brands, products..."
            className="syrn-searchbar"
          />
        </div>

        <div className="syrn-filter-section">
          <span className="syrn-filter-label">Skin</span>
          <div className="syrn-filter-pills">
            {SKIN_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`syrn-filter-pill ${selectedSkinType === type ? 'active' : ''}`}
                onClick={() => setSelectedSkinType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="syrn-category-slider-container">
          <div className="syrn-category-slider">
            <button
              type="button"
              className={`syrn-category-slide-item ${selectedCategoryId === null ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(null)}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                type="button"
                className={`syrn-category-slide-item ${selectedCategoryId === cat.category_id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(cat.category_id)}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>

        <div className="syrn-catalog-toolbar-row">
          <span className="syrn-catalog-count">
            {isLoading ? 'Loading…' : `${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
          </span>
          <div className="syrn-view-toggle" role="group" aria-label="View mode">
            {VIEW_OPTIONS.map(({ mode, icon, label }) => (
              <button
                key={mode}
                type="button"
                className={`syrn-view-toggle-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => handleViewModeChange(mode)}
                aria-label={`${label} view`}
                aria-pressed={viewMode === mode}
              >
                <IonIcon icon={icon} />
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <CatalogSkeleton viewMode={viewMode} />
        ) : (
          <div className={`syrn-product-grid-container syrn-product-view--${viewMode}`}>
            {filtered.length === 0 ? (
              <div className="syrn-empty-catalog">
                <IonIcon icon={searchOutline} className="syrn-empty-icon" />
                <p>No products found matching your filters.</p>
              </div>
            ) : (
              renderProducts()
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Catalog;
