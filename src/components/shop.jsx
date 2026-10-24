import React, { useState, useEffect } from 'react';
import './shop.css';
import defaultCatalog from '../data/defaultCatalog.json';

// Products and categories come from the owner's /admin page (saved online).
// If that is not reachable, the built-in list below is shown so the shop never breaks.
const buildCategories = (catalog) =>
  catalog.categories.map(cat => ({
    id: cat.id,
    label: cat.label,
    img: (catalog.products.find(p => p.category === cat.id) || {}).img,
  })).filter(cat => cat.img);

const Shop = ({ addToCart }) => {
    const [catalog, setCatalog] = useState(defaultCatalog);
    const [products, setProducts] = useState(defaultCatalog.products);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2500); 
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        fetch('/api/catalog')
            .then(r => r.json())
            .then(data => {
                if (data && Array.isArray(data.products) && data.products.length) {
                    setCatalog(data);
                    setFilter('all');
                    setProducts(data.products);
                }
            })
            .catch(() => {});
    }, []);

    const categories = buildCategories(catalog);

    const handleFilter = (category) => {
        setFilter(category);
        if (category === 'all') {
            setProducts(catalog.products);
        } else {
            setProducts(catalog.products.filter(item => item.category === category));
        }
    };

    const handleSort = (type) => {
        const sorted = [...products].sort((a, b) => 
            type === 'low' ? a.price - b.price : b.price - a.price
        );
        setProducts(sorted);
    };

    const handleAddToCart = (item) => {
        addToCart(item);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    if (loading) {
        return (
            <div className="opening-animation">
                <div className="logo-box">
                    <h1 className="brand-name">RADHIKA</h1>
                    <div className="brand-line"></div>
                    <p className="tagline">Elegance Redefined</p>
                </div>
            </div>
        );
    }

    return (
        <div className="shop-wrapper">
            {/* --- HEADER WITH TYPING ANIMATION --- */}
            <header className="page-header">
                <div className="header-content">
                    {/* The key={filter} ensures the animation restarts when filter changes */}
                    <div className="typing-container">
                        <h1 key={filter} className="typing-text">
                            {filter === 'all' ? ' Radhika Collection' : `${(categories.find(c => c.id === filter) || { label: filter }).label.toUpperCase()} 
                            EXCLUSIVES`}
                        </h1>
                    </div>
                    <p>Curated fashion for the modern royalty</p>
                </div>
            </header>

            <div className="shop-container">
                {/* SIDEBAR */}
                <aside className="sidebar">
                    <div className="sidebar-sticky">
                        <div className="filter-section">
                            <h3 className="sidebar-title">Collections</h3>
                            {filter !== 'all' && (
                                <button className="reset-btn" onClick={() => handleFilter('all')}>
                                    Show All
                                </button>
                            )}
                            
                            <div className="category-list">
                                {categories.map(cat => (
                                    <div 
                                        key={cat.id} 
                                        className={`category-item ${filter === cat.id ? 'active' : ''}`}
                                        onClick={() => handleFilter(cat.id)}
                                    >
                                        <div className="cat-thumb">
                                            <img src={cat.img} alt={cat.label} loading="lazy" decoding="async" />
                                        </div>
                                        <span className="cat-name">{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3 className="sidebar-title">Sort Price</h3>
                            <div className="price-toggles">
                                <button onClick={() => handleSort('low')}>Low to High</button>
                                <button onClick={() => handleSort('high')}>High to Low</button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* PRODUCT GRID */}
                <main className="product-area">
                    <div className="grid">
                        {products.map((item, index) => (
                            <div 
                                className="card" 
                                key={item.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="card-image">
                                    <img src={item.img} alt={item.name} loading="lazy" decoding="async" />
                                    {item.isNew && <span className="tag-new">New Arrival</span>}
                                    <div className="card-actions">
                                        <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
                                        <button onClick={() => handleAddToCart(item)}>Buy Now</button>
                                    </div>
                                </div>
                                <div className="card-details">
                                    <h3>{item.name}</h3>
                                    <div className="price-row">
                                        <span className="amount">₹{item.price}</span>
                                        <div className="size-list">
                                            {item.sizes.map(s => <span key={s}>{s}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* --- TOAST NOTIFICATION --- */}
            {showToast && (
                <div className="toast-notification">
                    <span className="checkmark">✔</span> 
                    Your item has been added
                </div>
            )}
        </div>
    );
};

export default Shop;