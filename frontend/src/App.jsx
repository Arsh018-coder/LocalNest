import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import WebGLBackground from './components/WebGLBackground';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Providers from './pages/Providers';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <div className="min-h-screen relative">
        <WebGLBackground />
        <Header />
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/Providers" element={<Providers />} />
            <Route path="/about" element={<About />} />
            <Route path="/Contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
