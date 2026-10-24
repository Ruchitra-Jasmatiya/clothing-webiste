import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/navbar.jsx';
import Home from './components/home.jsx';
import Shop from './components/shop.jsx';
import About from './components/about.jsx';
import Contact from './components/contact.jsx';
import Footer from './components/footer.jsx';
import './App.css';
import './components/home.css';
import './components/shop.css';
import './components/navbar.css';
import './components/footer.css';

// Owner page (/admin) is loaded only when opened, so the shop stays light.
const Admin = lazy(() => import('./components/admin.jsx'));

function Layout({ cart, addToCart, toggleCart }) {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    );
  }
  return (
    <div className="App">
      <Navbar cartCount={cart.length} toggleCart={toggleCart} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop addToCart={addToCart} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prevCart => [...prevCart, item]);
  };

  const toggleCart = () => {
    // Implement cart toggle functionality if needed
    console.log('Cart toggled');
  };

  return (
    <Router>
      <Layout cart={cart} addToCart={addToCart} toggleCart={toggleCart} />
    </Router>
  );
}

export default App;
