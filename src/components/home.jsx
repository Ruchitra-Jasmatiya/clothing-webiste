import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './home.css';
import vid from '../assets/images/vid.mp4';


// --- DATA ---
const bannerImages = [
  { id: 1, type: 'video', src: vid }
 ];

const findsImages = [
  { id: 1, name: 'Velvet Shararas', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoiYMB8iAMwpdDUz5XWznF4vDBJmjGhGVceQ&s' },
  { id: 2, name: 'Silk Kurtis', img: '/shop/3.webp' },
  { id: 3, name: 'Bridal Lehengas', img: '/shop/8.webp' },
  { id: 4, name: 'Royal Anarkalis', img: '/shop/10.webp' },
  { id: 5, name: 'Embroidered Salwar', img: '/shop/5.webp' },
  { id: 6, name: 'Designer Sarees', img: '/shop/4.webp' },
  { id: 7, name: 'Traditional Dupattas', img: '/shop/2.webp' },
  { id: 8, name: 'Festive Blouses', img: '/shop/12.webp' },
];

// "Weaving Dreams" Slideshow Images
const dreamImages = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBByoLmuIjE_Mz0TDeMVD10X0ox2L2dtQvAw&s',
  'https://images.stockcake.com/public/c/2/a/c2a15938-6610-41e0-8414-689ff6bf17f1_large/ethnic-clothing-display-stockcake.jpg',
  'https://content.jdmagicbox.com/comp/chittoor/r8/9999p8572.8572.140409121729.e3r8/catalogue/neelus-beauty-parlour-and-boutique-subedar-street-chittoor-women-beauty-parlours-lvfi22hklk.jpg',
 ];

// "You x Us" Customer Testimonials
const testimonials = [
  {
    id: 1,
    name: 'Ananya Sharma',
    img: 'https://5.imimg.com/data5/SELLER/Default/2023/10/350699689/BV/HM/YZ/28280455/photo-6055480829242619233-y-500x500.jpg',
    feedback: "Wearing Radhika's design made me feel like royalty. The fabric, the fit, everything was just perfect for my brother's wedding. I've never felt more confident!",
    location: 'Mumbai, India'
  },
  {
    id: 2,
    name: 'Priya Mehta',
    img: 'https://static3.azafashions.com/tr:w-450/uploads/product_gallery/1732544696455_1.jpg',
    feedback: "The intricate embroidery and the attention to detail are what set Radhika apart. It’s not just a dress; it’s a piece of art that I’ll cherish forever.",
    location: 'Delhi, India'
  },
  {
    id: 3,
    name: 'Sanya Kapoor',
    img: 'https://images.cbazaar.com/images/blue-silk-zari-embroidered-sequins-elegant-sharara-suit-slscc54335596-u.jpg',
    feedback: "I was looking for something traditional yet modern, and Radhika delivered exactly that. The silhouette was flattering, and I received so many compliments!",
    location: 'Bangalore, India'
  },
  {
    id: 4,
    name: 'Riya Singh',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQx6j6mhdYcLYm4CMoPI-MoIrpnmgZ4tbwfUQ&s',
    feedback: "From the moment I tried it on, I knew this was 'the one'. The comfort is unmatched, and the style is timeless. Thank you for making my special day even better.",
    location: 'Jaipur, India'
  }
];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dreamIndex, setDreamIndex] = useState(0);
  const [findsStartIndex, setFindsStartIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Hero Slider Logic
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === bannerImages.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  // Dream Slideshow Logic (Every 3 seconds)
  useEffect(() => {
    const dreamInterval = setInterval(() => {
      setDreamIndex((prev) => (prev === dreamImages.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(dreamInterval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide(currentSlide === bannerImages.length - 1 ? 0 : currentSlide + 1);
  };
  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? bannerImages.length - 1 : currentSlide - 1);
  };

  // Touch handlers for swiping
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && findsStartIndex < findsImages.length - 4) {
      setFindsStartIndex(findsStartIndex + 4);
    }
    if (isRightSwipe && findsStartIndex > 0) {
      setFindsStartIndex(findsStartIndex - 4);
    }
  };

  return (
    <div className="home-container">
      {/* 2. HERO SLIDER */}
      <section className="hero-section">
        {bannerImages.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            {slide.type === 'video' ? (
              <video
                src={slide.src}
                autoPlay
                muted
                loop
                className="hero-video"
              />
            ) : (
              <div
                className="hero-image"
                style={{ backgroundImage: `url(${slide.src})` }}
              />
            )}
          </div>
        ))}
        <div className="slider-dots">
          {bannerImages.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            ></span>
          ))}
        </div>
      </section>

      {/* 3. FANTASTIC FINDS (New Fonts & Images) */}
      <section
        className="finds-section"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="section-header">
            <h2 className="modern-title">Fantastic Finds</h2>
            <div className="underline-gold"></div>
            <p className="modern-subtitle">Handpicked styles just for you</p>
        </div>

        <div className="finds-grid">
          {findsImages.slice(findsStartIndex, findsStartIndex + 4).map((item) => (
            <div className="finds-card" key={item.id}>
              <div className="rect-shape">
                <img src={item.img} alt={item.name} />
                <div className="finds-overlay">
                  <h3>{item.name}</h3>
                  <Link to="/shop" className="shop-now-btn">Shop Now</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WEAVING DREAMS (Slideshow Section) */}
      <section className="dreams-section">
        <div className="dreams-content">
          <div className="dreams-text">
             <h2>Weaving Dreams into Reality</h2>
             <p>
               Every thread tells a story of passion, heritage, and elegance. 
               We craft more than just clothes; we craft memories.
             </p>
          </div>
          <div className="dreams-slider">
             {dreamImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt="Dream Collection" 
                  className={`dream-img ${index === dreamIndex ? 'active' : ''}`}
                />
             ))}
             <div className="gold-frame-slider"></div>
          </div>
        </div>
      </section>

      {/* 5. YOU X US (New Customer Section) */}
      <section className="you-us-section">
        <div className="you-us-header">
           <h2>You x Us</h2>
           <div className="underline-gold"></div>
           <p className="you-us-intro">
             You x Us is where style becomes a shared story. This space celebrates the beautiful connection between you—our customers—and us—Radhika. Every image featured here is a reflection of real people embracing our designs and making them their own.
           </p>
           <p className="you-us-intro">
             Your confidence, your individuality, and your personal style bring our creations to life. Together, You x Us is not just fashion—it is a collaboration, a bond, and a community shaped by authenticity and elegance.
           </p>
        </div>

        <div className="testimonials-container">
          {testimonials.map((person, index) => (
            <div className={`testimonial-card ${index % 2 === 0 ? 'left-layout' : 'right-layout'}`} key={person.id}>
               <div className="testimonial-image">
                  <img src={person.img} alt={person.name} />
                  <div className="image-border"></div>
               </div>
               <div className="testimonial-text">
                  <h3>{person.name}</h3>
                  <span className="location">{person.location}</span>
                  <div className="quote-box">
                    <p>"{person.feedback}"</p>
                  </div>
                  <div className="feeling-tag">Feeling: <span>Radiant & Confident</span></div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SCROLLING MARQUEE */}
      <div className="marquee-wrapper">
        <div className="marquee-content">
          <span>ROYAL ELEGANCE • TIMELESS FASHION • RADHIKA BOUTIQUE • </span>
          <span>ROYAL ELEGANCE • TIMELESS FASHION • RADHIKA BOUTIQUE • </span>
        </div>
      </div>

      {/* 7. FOOTER */}
      <footer className="footer-section">
        <div className="newsletter">
          <h2>Join the Royal Family</h2>
          <p>Subscribe for exclusive offers and new arrival updates.</p>
          <div className="input-group">
            <input type="email" placeholder="Your Email Address" />
            <button>Subscribe</button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 RADHIKA Boutique. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;