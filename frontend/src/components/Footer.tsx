import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">DeFi Asset Manager</h3>
            <p className="text-gray-400 text-sm">
              Decentralized asset management platform for the future of finance.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white">Dashboard</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Strategies</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Governance</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Analytics</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">API Reference</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white">Discord</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Twitter</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">GitHub</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Medium</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2023 DeFi Asset Manager. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
