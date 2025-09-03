import React, { useState } from 'react';

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Homeowner",
      location: "Downtown District",
      service: "Home Services",
      rating: 5,
      text: "ServiceHub has completely transformed how I find and book home services. The quality of providers is exceptional, and the booking process is so smooth. I found my regular cleaner and handyman through this platform.",
      image: "https://readdy.ai/api/search-image?query=professional%20woman%20smiling%20headshot%20portrait%20natural%20lighting%20contemporary%20business%20attire%20confident%20expression%20clean%20background%20modern%20photography&width=80&height=80&seq=avatar1&orientation=squarish"
    },
    {
      id: 2,
      name: "Mike Chen",
      role: "Business Owner",
      location: "Business District",
      service: "Professional Services",
      rating: 5,
      text: "As a small business owner, I needed reliable professional services quickly. ServiceHub delivered exactly what I needed with vetted providers and transparent pricing. Highly recommend!",
      image: "https://readdy.ai/api/search-image?query=professional%20man%20smiling%20headshot%20portrait%20natural%20lighting%20contemporary%20business%20attire%20confident%20expression%20clean%20background%20modern%20photography&width=80&height=80&seq=avatar2&orientation=squarish"
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Working Mother",
      location: "Suburban Area",
      service: "Beauty & Personal Care",
      rating: 5,
      text: "Being a working mom, I barely have time for myself. ServiceHub's beauty services that come to my home have been a game-changer. Professional, convenient, and affordable.",
      image: "https://readdy.ai/api/search-image?query=professional%20woman%20smiling%20headshot%20portrait%20natural%20lighting%20contemporary%20business%20attire%20confident%20expression%20clean%20background%20modern%20photography&width=80&height=80&seq=avatar3&orientation=squarish"
    },
    {
      id: 4,
      name: "David Wilson",
      role: "Retiree",
      location: "Residential Area",
      service: "Health & Wellness",
      rating: 5,
      text: "At my age, getting around isn't as easy as it used to be. ServiceHub's health and wellness providers who visit my home have been wonderful. Professional and caring service.",
      image: "https://readdy.ai/api/search-image?query=professional%20senior%20man%20smiling%20headshot%20portrait%20natural%20lighting%20contemporary%20business%20attire%20confident%20expression%20clean%20background%20modern%20photography&width=80&height=80&seq=avatar4&orientation=squarish"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
  };

  // Render stars for rating
  const renderStars = (rating) =>
    Array(5).fill(0).map((_, i) => (
      <i
        key={i}
        className="ri-star-fill text-yellow-400 text-xl mx-1"
      ></i>
    ));

  const current = testimonials[currentTestimonial];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#414A4C' }}>
            What Our Customers Say
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: '#414A4C', opacity: '0.8' }}>
            Real stories from real customers who have experienced the LocalNest difference.
          </p>
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div
            className="relative p-8 md:p-12 rounded-2xl transition-all duration-500"
            style={{
              backgroundColor: 'rgba(245, 245, 245, 0.9)',
              border: '1px solid rgba(199, 233, 75, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <img
                src={current.image}
                alt={current.name}
                className="w-20 h-20 rounded-full object-cover border-4"
                style={{ borderColor: '#C7E94B' }}
              />
            </div>
            <div className="flex items-center justify-center mb-4">{renderStars(current.rating)}</div>
            <blockquote
              className="text-xl md:text-2xl font-medium mb-6 italic leading-relaxed"
              style={{ color: '#414A4C' }}
            >
              "{current.text}"
            </blockquote>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
              <h4 className="text-lg font-bold" style={{ color: '#414A4C' }}>
                {current.name}
              </h4>
              <span className="text-sm" style={{ color: '#414A4C', opacity: '0.8' }}>
                • {current.role}
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm" style={{ color: '#414A4C', opacity: '0.8' }}>
              <span className="flex items-center">
                <i className="ri-map-pin-line mr-1"></i>
                {current.location}
              </span>
              <span className="flex items-center">
                <i className="ri-service-line mr-1"></i>
                {current.service}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center mt-8 space-x-4">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: '#C7E94B', color: '#414A4C' }}
              aria-label="Previous testimonial"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentTestimonial ? 'scale-125' : 'opacity-50'
                  }`}
                  style={{ backgroundColor: '#C7E94B' }}
                  aria-label={`Go to testimonial ${index + 1}`}
                ></button>
              ))}
            </div>
            <button
              onClick={nextTestimonial}
              className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: '#C7E94B', color: '#414A4C' }}
              aria-label="Next testimonial"
            >
              <i className="ri-arrow-right-line text-xl"></i>
            </button>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div
            className="inline-flex items-center px-8 py-4 rounded-full"
            style={{
              backgroundColor: 'rgba(199, 233, 75, 0.1)',
              border: '1px solid rgba(199, 233, 75, 0.3)',
            }}
          >
            <i className="ri-heart-line text-xl mr-3" style={{ color: '#C7E94B' }}></i>
            <span className="text-lg font-medium" style={{ color: '#414A4C' }}>
              Join 10,000+ satisfied customers
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
