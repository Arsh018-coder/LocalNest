import React from 'react';
import Hero from '../components/Hero';
import ServiceCard from '../components/ServiceCard';
import TestimonialsSection from '../components/TestimonialsSection';


const Home = () => {
  const featuredServices = [
    {
      id: 1,
      name: 'Home Cleaning',
      description: 'Professional house cleaning services',
      icon: '🏠',
      providers: 24
    },
    {
      id: 2,
      name: 'Plumbing',
      description: 'Expert plumbing repair and installation',
      icon: '🔧',
      providers: 18
    },
    {
      id: 3,
      name: 'Tutoring',
      description: 'Academic support for all subjects',
      icon: '📚',
      providers: 32
    }
  ];

  return (
    <div>
      <Hero />
      
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-secondary mb-12">
            Featured Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {featuredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>
      <TestimonialsSection />
    </div>
  );
};

export default Home;
