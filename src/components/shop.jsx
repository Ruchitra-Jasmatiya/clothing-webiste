import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import './shop.css';
import defaultCatalog from '../data/defaultCatalog.json';

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */
const CACHE_KEY = 'radhika_catalog_v1'; // last catalog we saw -> instant repeat visits
const SEEN_KEY = 'radhika_seen_v1';     // product ids the visitor has already been told about

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: ignore */ }
};

const validCatalog = (d) =>
  !!d && !d.empty && Array.isArray(d.products) && Array.isArray(d.categories);

const formatPrice = (p) => {
  const n = Number(p);
  return n > 0 ? `₹${n.toLocaleString('en-IN')}` : 'Price on request';
};

// Products and categories come from the owner's /admin page (saved online).
// If that is not reachable, the built-in list is shown so the shop never breaks.
const buildCategories = (catalog) =>
  catalog.categories
    .map((cat) => ({
      id: cat.id,
      label: cat.label,
      img: (catalog.products.find((p) => p.category === cat.id) || {}).img,
    }))
    .filter((cat) => cat.img);

/* ------------------------------------------------------------------ *
 *  Product card
 * ------------------------------------------------------------------ */
const ProductCard = memo(function ProductCard({ item, index, onOpen, onAdd }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const eager = index < 6; // first screen loads at once, the rest wait until scrolled near

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) setLoaded(true);
  }, []);

  return (
    <article className="card" style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
      <div
        className={`card-image ${loaded ? 'loaded' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`View ${item.name} larger`}
        onClick={() => onOpen(index)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(index); } }}
      >
        <img
          ref={imgRef}
          src={item.img}
          alt={item.name}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          draggable="false"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
        {item.isNew && (
          <span className="tag-new">New<span className="tag-long"> Arrival</span></span>
        )}
        <span className="zoom-hint" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
          </svg>
        </span>
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAdd(item)}>Add to Cart</button>
          <button onClick={() => onAdd(item)}>Buy Now</button>
        </div>
      </div>
      <div className="card-details">
        <h3 title={item.name}>{item.name}</h3>
        <div className="price-row">
          <span className="amount">{formatPrice(item.price)}</span>
          <div className="size-list">
            {(item.sizes || []).map((s) => <span key={s}>{s}</span>)}
          </div>
        </div>
        <button className="mobile-add" onClick={() => onAdd(item)}>Add to Cart</button>
      </div>
    </article>
  );
});

/* ------------------------------------------------------------------ *
 *  Full-screen viewer: pinch / double-tap to zoom, swipe for next/prev
 * ------------------------------------------------------------------ */
function Lightbox({ items, index, onClose, onChange, onAdd }) {
  const item = items[index];
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 });
  const stage = useRef(null);
  const pts = useRef(new Map());
  const start = useRef(null);
  const pinch = useRef(null);
  const moved = useRef(false);
  const lastTap = useRef(0);

  useEffect(() => { setZ({ s: 1, x: 0, y: 0 }); }, [index]);

  // lock page scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // warm up the neighbours so swiping feels instant
  useEffect(() => {
    [index - 1, index + 1].forEach((i) => {
      if (items[i]) { const im = new Image(); im.src = items[i].img; }
    });
  }, [index, items]);

  const go = useCallback((d) => {
    const n = index + d;
    if (n >= 0 && n < items.length) onChange(n);
  }, [index, items.length, onChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const clamp = (s, x, y) => {
    const el = stage.current;
    if (!el) return { s, x, y };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return { s, x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  const toggleZoom = (px, py) => {
    if (z.s > 1) { setZ({ s: 1, x: 0, y: 0 }); return; }
    const el = stage.current;
    const r = el.getBoundingClientRect();
    const s = 2.5;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    setZ(clamp(s, (cx - px) * (s - 1), (cy - py) * (s - 1)));
  };

  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pts.current.size === 1) start.current = { x: e.clientX, y: e.clientY, zx: z.x, zy: z.y };
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: z.s };
    }
  };

  const onMove = (e) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2 && pinch.current) {
      const [a, b] = [...pts.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const s = Math.max(1, Math.min(4, (pinch.current.s * d) / pinch.current.d));
      setZ(clamp(s, z.x, z.y));
      moved.current = true;
      return;
    }
    if (pts.current.size === 1 && start.current) {
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
      if (z.s > 1) setZ(clamp(z.s, start.current.zx + dx, start.current.zy + dy));
    }
  };

  const onUp = (e) => {
    const wasSingle = pts.current.size === 1;
    pts.current.delete(e.pointerId);
    pinch.current = null;
    if (!wasSingle || !start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    if (z.s === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { go(dx < 0 ? 1 : -1); return; }
    if (z.s === 1 && dy > 110 && dy > Math.abs(dx) * 1.5) { onClose(); return; }
    if (!moved.current) {
      const now = Date.now();
      if (now - lastTap.current < 300) { toggleZoom(e.clientX, e.clientY); lastTap.current = 0; }
      else lastTap.current = now;
    }
  };

  const onCancel = (e) => { pts.current.delete(e.pointerId); pinch.current = null; start.current = null; };

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="lb-top">
        <span className="lb-count">{index + 1} / {items.length}</span>
        <div className="lb-top-btns">
          <button className="lb-btn" onClick={() => setZ(z.s > 1 ? { s: 1, x: 0, y: 0 } : clamp(2.5, 0, 0))} aria-label="Zoom">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />{z.s > 1 ? <path d="M8 11h6" /> : <path d="M11 8v6M8 11h6" />}
            </svg>
          </button>
          <button className="lb-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>

      <div
        className="lb-stage"
        ref={stage}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <img
          src={item.img}
          alt={item.name}
          draggable="false"
          style={{
            transform: `translate(${z.x}px, ${z.y}px) scale(${z.s})`,
            transition: pts.current.size ? 'none' : 'transform 0.25s ease',
          }}
        />
      </div>

      {index > 0 && (
        <button className="lb-nav prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
      )}
      {index < items.length - 1 && (
        <button className="lb-nav next" onClick={() => go(1)} aria-label="Next">›</button>
      )}

      <div className="lb-bottom">
        <div className="lb-info">
          <h3>{item.name}</h3>
          <div className="lb-meta">
            <span className="lb-price">{formatPrice(item.price)}</span>
            <span className="lb-sizes">{(item.sizes || []).join(' · ')}</span>
          </div>
        </div>
        <button className="lb-add" onClick={() => onAdd(item)}>Add to Cart</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  "New collection" popup
 * ------------------------------------------------------------------ */
function Announce({ data, onClose, onExplore }) {
  return (
    <div className="announce-backdrop" onClick={onClose}>
      <div className="announce-card" role="dialog" aria-modal="true" aria-label={data.title} onClick={(e) => e.stopPropagation()}>
        <button className="announce-x" onClick={onClose} aria-label="Close">×</button>
        <div className="announce-spark" aria-hidden="true">✦</div>
        <p className="announce-kicker">Just In</p>
        <h2>{data.title}</h2>
        <p className="announce-sub">{data.sub}</p>
        <div className="announce-thumbs">
          {data.thumbs.map((src) => (
            <div key={src} className="announce-thumb"><img src={src} alt="" loading="eager" decoding="async" /></div>
          ))}
        </div>
        <button className="announce-cta" onClick={onExplore}>Explore Now</button>
        <button className="announce-later" onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Shop page
 * ------------------------------------------------------------------ */
const Shop = ({ addToCart }) => {
  const [catalog, setCatalog] = useState(() => {
    const cached = read(CACHE_KEY);
    return validCatalog(cached) ? cached : defaultCatalog;
  });
  const [filter, setFilter] = useState('all');
  const [sortType, setSortType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [lightbox, setLightbox] = useState(-1);
  const [announce, setAnnounce] = useState(null);
  const toastTimer = useRef(null);
  const containerRef = useRef(null);

  // Opening animation (unchanged: 2.5s). The shop is already built underneath,
  // so by the time it ends the first images are loaded.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Look for anything new the owner added
  const checkForNew = useCallback((data) => {
    const ids = data.products.map((p) => p.id);
    const seen = read(SEEN_KEY);
    if (!Array.isArray(seen)) { write(SEEN_KEY, ids); return; } // first ever visit: nothing is "new"
    const seenSet = new Set(seen);
    const fresh = data.products.filter((p) => !seenSet.has(p.id));
    if (!fresh.length) return;

    const newCats = data.categories.filter(
      (c) => fresh.some((p) => p.category === c.id) &&
             !data.products.some((p) => seenSet.has(p.id) && p.category === c.id)
    );
    let title;
    if (newCats.length === 1) title = `New Collection: ${newCats[0].label}`;
    else if (newCats.length > 1) title = 'New Collections Added';
    else title = fresh.length === 1 ? 'New Arrival Just Added' : `${fresh.length} New Arrivals Just Added`;

    setAnnounce({
      ids,
      title,
      sub: 'Fresh from the Radhika studio. Be the first to see it.',
      thumbs: fresh.slice(0, 3).map((p) => p.img),
      target: newCats.length === 1 ? newCats[0].id : 'all',
    });
  }, []);

  // Always ask for the newest list; ask again when the visitor returns to the tab and every 30s
  useEffect(() => {
    const load = () => {
      fetch('/api/catalog', { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (!validCatalog(data)) return;
          setCatalog((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
          write(CACHE_KEY, data);
          checkForNew(data);
        })
        .catch(() => {});
    };
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(load, 30000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [checkForNew]);

  const categories = useMemo(() => buildCategories(catalog), [catalog]);
  const activeFilter = filter === 'all' || categories.some((c) => c.id === filter) ? filter : 'all';
  const activeLabel = (categories.find((c) => c.id === activeFilter) || {}).label;

  const products = useMemo(() => {
    const list = activeFilter === 'all'
      ? catalog.products
      : catalog.products.filter((p) => p.category === activeFilter);
    if (!sortType) return list;
    return [...list].sort((a, b) => (sortType === 'low' ? a.price - b.price : b.price - a.price));
  }, [catalog, activeFilter, sortType]);

  const handleFilter = (category) => {
    setFilter(category);
    const el = containerRef.current;
    if (el && window.scrollY > el.offsetTop - 60) window.scrollTo({ top: Math.max(0, el.offsetTop - 60), behavior: 'smooth' });
  };

  const handleAddToCart = useCallback((item) => {
    addToCart(item);
    setShowToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  }, [addToCart]);

  const openViewer = useCallback((i) => setLightbox(i), []);
  const closeViewer = useCallback(() => setLightbox(-1), []);

  const dismissAnnounce = () => {
    if (announce) write(SEEN_KEY, announce.ids);
    setAnnounce(null);
  };
  const exploreAnnounce = () => {
    const target = announce.target;
    dismissAnnounce();
    setSortType('');
    handleFilter(target);
  };

  return (
    <>
      {loading && (
        <div className="opening-animation">
          <div className="logo-box">
            <h1 className="brand-name">RADHIKA</h1>
            <div className="brand-line"></div>
            <p className="tagline">Elegance Redefined</p>
          </div>
        </div>
      )}

      <div className={`shop-wrapper ${loading ? 'is-loading' : 'ready'}`} aria-hidden={loading}>
        {/* --- HEADER WITH TYPING ANIMATION --- */}
        <header className="page-header">
          <div className="header-content">
            {/* The key={filter} ensures the animation restarts when filter changes */}
            <div className="typing-container">
              <h1 key={activeFilter} className="typing-text">
                {activeFilter === 'all' ? 'Radhika Collection' : `${(activeLabel || '').toUpperCase()} EXCLUSIVES`}
              </h1>
            </div>
            <p>Curated fashion for the modern royalty</p>
          </div>
        </header>

        <div className="header-divider" aria-hidden="true"><span>✦</span></div>

        <div className="shop-container" ref={containerRef}>
          {/* SIDEBAR (becomes a swipeable category strip on mobile) */}
          <aside className="sidebar">
            <div className="sidebar-sticky">
              <div className="filter-section">
                <h3 className="sidebar-title">Collections</h3>
                {activeFilter !== 'all' && (
                  <button className="reset-btn" onClick={() => handleFilter('all')}>
                    Show All
                  </button>
                )}

                <div className="category-list">
                  <div
                    className={`category-item cat-all ${activeFilter === 'all' ? 'active' : ''}`}
                    role="button" tabIndex={0}
                    onClick={() => handleFilter('all')}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleFilter('all'); }}
                  >
                    <div className="cat-thumb cat-thumb-all">✦</div>
                    <span className="cat-name">All</span>
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`category-item ${activeFilter === cat.id ? 'active' : ''}`}
                      role="button" tabIndex={0}
                      onClick={() => handleFilter(cat.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleFilter(cat.id); }}
                    >
                      <div className="cat-thumb">
                        <img src={cat.img} alt="" loading="lazy" decoding="async" />
                      </div>
                      <span className="cat-name">{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filter-section sort-section">
                <h3 className="sidebar-title">Sort Price</h3>
                <div className="price-toggles">
                  <button className={sortType === 'low' ? 'on' : ''} onClick={() => setSortType('low')}>Low to High</button>
                  <button className={sortType === 'high' ? 'on' : ''} onClick={() => setSortType('high')}>High to Low</button>
                </div>
              </div>
            </div>
          </aside>

          {/* PRODUCT GRID */}
          <main className="product-area">
            <div className="toolbar">
              <span className="count">{products.length} {products.length === 1 ? 'design' : 'designs'}</span>
              <label className="sort-select">
                <span>Sort</span>
                <select value={sortType} onChange={(e) => setSortType(e.target.value)} aria-label="Sort by price">
                  <option value="">Featured</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                </select>
              </label>
            </div>

            {products.length === 0 ? (
              <p className="empty-note">No designs here yet. Please check back soon.</p>
            ) : (
              <div className="grid">
                {products.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    index={index}
                    onOpen={openViewer}
                    onAdd={handleAddToCart}
                  />
                ))}
              </div>
            )}
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

      {lightbox >= 0 && lightbox < products.length && (
        <Lightbox
          items={products}
          index={lightbox}
          onClose={closeViewer}
          onChange={setLightbox}
          onAdd={handleAddToCart}
        />
      )}

      {!loading && announce && lightbox < 0 && (
        <Announce data={announce} onClose={dismissAnnounce} onExplore={exploreAnnounce} />
      )}
    </>
  );
};

export default Shop;
