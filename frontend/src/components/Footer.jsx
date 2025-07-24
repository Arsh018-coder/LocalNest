import React from 'react';

const Footer = () => {
  return (
    <footer className=" bg-secondary text-dominant px-6 py-3">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">
              Local<span className="text-accent">Nest</span>
            </h3>
            <p className="opacity-80">
              Connecting local talent with local needs. Building stronger communities one service at a time.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 opacity-80">
              <li><a href="#" className="hover:text-accent transition-colors">Home Cleaning</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Plumbing</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Tutoring</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Gardening</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 opacity-80">
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-secondary hover:bg-opacity-80 transition-all">
                <span className="text-sm font-bold">f</span>
              </a>
              <a href="#" className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-secondary hover:bg-opacity-80 transition-all">
                <span className="text-sm font-bold">t</span>
              </a>
              <a href="#" className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-secondary hover:bg-opacity-80 transition-all">
                <span className="text-sm font-bold">in</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-dominant border-opacity-20 mt-8 pt-8 text-center opacity-80">
          <p>&copy; 2025 LocalNest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
