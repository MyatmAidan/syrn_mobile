import React from 'react';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, IonBadge } from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';
import { gridOutline, calendarOutline, personOutline, cartOutline, receiptOutline } from 'ionicons/icons';

import Catalog from '../pages/Catalog';
import ProductDetail from '../pages/ProductDetail';
import Routines from '../pages/Routines';
import Favorites from '../pages/Favorites';
import Profile from '../pages/Profile';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import OrderPayment from '../pages/OrderPayment';
import EditProfile from '../pages/EditProfile';
import AuthGate from './AuthGate';
import { useCart } from '../context/CartContext';
import './MainTabs.css';

const TabBarWithBadge: React.FC = () => {
  const { itemCount } = useCart();

  return (
    <IonTabBar slot="bottom" className="syrn-tab-bar">
      <IonTabButton tab="catalog" href="/app/catalog" className="syrn-tab-button">
        <IonIcon icon={gridOutline} />
        <IonLabel>Catalog</IonLabel>
      </IonTabButton>
      <IonTabButton tab="routines" href="/app/routines" className="syrn-tab-button">
        <IonIcon icon={calendarOutline} />
        <IonLabel>Routines</IonLabel>
      </IonTabButton>
      <IonTabButton tab="cart" href="/app/cart" className="syrn-tab-button syrn-tab-cart">
        <IonIcon icon={cartOutline} />
        <IonLabel>Cart</IonLabel>
        {itemCount > 0 && (
          <IonBadge className="syrn-cart-badge">{itemCount > 99 ? '99+' : itemCount}</IonBadge>
        )}
      </IonTabButton>
      <IonTabButton tab="orders" href="/app/orders" className="syrn-tab-button">
        <IonIcon icon={receiptOutline} />
        <IonLabel>Orders</IonLabel>
      </IonTabButton>
      <IonTabButton tab="profile" href="/app/profile" className="syrn-tab-button">
        <IonIcon icon={personOutline} />
        <IonLabel>Profile</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

const MainTabs: React.FC = () => {
  return (
    <AuthGate>
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/app/catalog">
          <Catalog />
        </Route>
        <Route exact path="/app/catalog/product/:id">
          <ProductDetail />
        </Route>
        <Route exact path="/app/routines">
          <Routines />
        </Route>
        <Route exact path="/app/favorites">
          <Favorites />
        </Route>
        <Route exact path="/app/profile">
          <Profile />
        </Route>
        <Route exact path="/app/profile/edit">
          <EditProfile />
        </Route>
        <Route exact path="/app/cart">
          <Cart />
        </Route>
        <Route exact path="/app/checkout">
          <Checkout />
        </Route>
        <Route exact path="/app/orders">
          <Orders />
        </Route>
        <Route exact path="/app/orders/:id">
          <OrderDetail />
        </Route>
        <Route exact path="/app/orders/:id/pay">
          <OrderPayment />
        </Route>
        <Route exact path="/app">
          <Redirect to="/app/catalog" />
        </Route>
      </IonRouterOutlet>

      <TabBarWithBadge />
    </IonTabs>
    </AuthGate>
  );
};

export default MainTabs;
