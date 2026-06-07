import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonToast } from '@ionic/react';
import { heartOutline, trashOutline } from 'ionicons/icons';
import { ApiService, Favourite, getProductImageUrl } from '../services/apiService';
import './Favorites.css';

const Favorites: React.FC = () => {
  const history = useHistory();
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchFavourites = async () => {
    setIsLoading(true);
    try {
      const list = await ApiService.getFavourites();
      setFavourites(list);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  const handleRemoveFavourite = async (e: React.MouseEvent, favId: number) => {
    e.stopPropagation();
    try {
      const res = await ApiService.deleteFavourite(favId);
      if (res.success) {
        setFavourites(favourites.filter((f) => f.favourite_id !== favId));
        setToastMessage('Removed from favorites');
        setShowToast(true);
      } else {
        setFavourites(favourites.filter((f) => f.favourite_id !== favId));
        setToastMessage('Removed from favorites');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      setFavourites(favourites.filter((f) => f.favourite_id !== favId));
      setToastMessage('Removed from favorites');
      setShowToast(true);
    }
  };

  const getInitials = (brand: string) => {
    return brand ? brand.substring(0, 2).toUpperCase() : 'SN';
  };

  return (
    <IonPage>
      <IonHeader className="syrn-favs-header ion-no-border">
        <IonToolbar className="syrn-favs-toolbar">
          <IonTitle className="syrn-brand-font syrn-favs-title">my favorites</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-favs-content" scrollY={true}>
        {isLoading ? (
          <div className="syrn-favs-spinner-container">
            <div className="syrn-spinner" />
          </div>
        ) : (
          <div className="syrn-favs-container">
            {favourites.length === 0 ? (
              <div className="syrn-favs-empty">
                <IonIcon icon={heartOutline} className="syrn-empty-fav-icon" />
                <p>No saved products yet.</p>
                <button
                  className="syrn-btn-primary"
                  onClick={() => history.push('/app/catalog')}
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="syrn-favs-list">
                {favourites.map((fav) => {
                  const prod = fav.product;
                  if (!prod) return null;
                  return (
                    <div
                      key={fav.favourite_id}
                      className="syrn-fav-card"
                      onClick={() => history.push(`/app/catalog/product/${prod.product_id}`)}
                    >
                      <div className="syrn-fav-card-image-container">
                        {getProductImageUrl(prod) ? (
                          <img
                            src={getProductImageUrl(prod) || ''}
                            alt={prod.product_name}
                            className="syrn-fav-card-image"
                          />
                        ) : (
                          <div className="syrn-fav-card-placeholder">
                            <span className="syrn-placeholder-text">
                              {getInitials(prod.brand?.brand_name || '')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="syrn-fav-card-info">
                        <span className="syrn-fav-card-brand">{prod.brand?.brand_name}</span>
                        <h3 className="syrn-fav-card-name">{prod.product_name}</h3>
                        <span className="syrn-fav-card-price">${parseFloat(prod.price).toFixed(2)}</span>
                      </div>

                      <button
                        type="button"
                        className="syrn-fav-card-remove-btn"
                        onClick={(e) => handleRemoveFavourite(e, fav.favourite_id)}
                        title="Remove Favorite"
                      >
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Favorites;
