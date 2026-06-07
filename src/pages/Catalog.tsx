import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar } from '@ionic/react';
import { ApiService, Product, Category, getSkinTypeLabel, formatProductPrice, getProductImageUrl } from '../services/apiService';
import './Catalog.css';

const Catalog: React.FC = () => {
  const history = useHistory();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const apiCategories = await ApiService.getCategories();
        const apiProducts = await ApiService.getProducts();

        setCategories(apiCategories);
        setProducts(apiProducts);
      } catch (error) {
        console.error('Error fetching catalog data:', error);
        setCategories([]);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const getInitials = (brand: string) => {
    return brand ? brand.substring(0, 2).toUpperCase() : 'SN';
  };

  return (
    <IonPage>
      <IonHeader className="syrn-catalog-header ion-no-border">
        <IonToolbar className="syrn-catalog-toolbar">
          <IonTitle className="syrn-brand-font syrn-catalog-title">explore syrn</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-catalog-content" scrollY={true}>
        {/* Search Control */}
        <div className="syrn-search-section">
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
            placeholder="Search brands, products..."
            className="syrn-searchbar"
          />
        </div>

        {/* Skin Type Filter Pills */}
        <div className="syrn-filter-section">
          <span className="syrn-filter-label">Skin Type:</span>
          <div className="syrn-filter-pills">
            {['All', 'Dry', 'Oily', 'Sensitive', 'Normal', 'Combination'].map((type) => (
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

        {/* Horizontal Category Slider */}
        <div className="syrn-category-slider-container">
          <div className="syrn-category-slider">
            <button
              type="button"
              className={`syrn-category-slide-item ${selectedCategoryId === null ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(null)}
            >
              All Categories
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

        {/* Product Grid */}
        {isLoading ? (
          <div className="syrn-catalog-spinner-container">
            <div className="syrn-spinner" />
          </div>
        ) : (
          <div className="syrn-product-grid-container">
            {getFilteredProducts().length === 0 ? (
              <div className="syrn-empty-catalog">
                <p>No products found matching your filters.</p>
              </div>
            ) : (
              <div className="syrn-product-grid">
                {getFilteredProducts().map((prod) => (
                  <div
                    key={prod.product_id}
                    className="syrn-product-card"
                    onClick={() => history.push(`/app/catalog/product/${prod.product_id}`)}
                  >
                    <div className="syrn-product-card-image-container">
                      {getProductImageUrl(prod) ? (
                        <img
                          src={getProductImageUrl(prod) || ''}
                          alt={prod.product_name}
                          className="syrn-product-card-image"
                        />
                      ) : (
                        <div className="syrn-product-card-placeholder">
                          <span className="syrn-placeholder-text">
                            {getInitials(prod.brand?.brand_name || '')}
                          </span>
                        </div>
                      )}
                      {getSkinTypeLabel(prod.skin_type) && (
                        <span className="syrn-product-card-tag">
                          {getSkinTypeLabel(prod.skin_type)}
                        </span>
                      )}
                    </div>
                    <div className="syrn-product-card-info">
                      <span className="syrn-product-card-brand">{prod.brand?.brand_name}</span>
                      <h3 className="syrn-product-card-name">{prod.product_name}</h3>
                      <span className="syrn-product-card-price">${formatProductPrice(prod.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Catalog;
