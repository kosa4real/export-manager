"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronRight,
  Truck,
  Building2,
  Sprout,
  Globe2,
  Shield,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function DanEnterprisesLanding() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    {
      icon: <Truck className="w-12 h-12" />,
      title: "Export & Import",
      description:
        "Premium coal export services connecting Nigeria to global markets. We manage the complete supply chain from sourcing to delivery, ensuring quality grading and timely shipments.",
      features: [
        "Quality Grading System",
        "Global Logistics",
        "Reliable Supply Chain",
        "Competitive Pricing",
      ],
    },
    {
      icon: <Building2 className="w-12 h-12" />,
      title: "Real Estate & Construction",
      description:
        "Developing modern infrastructure and residential projects that transform communities. Our construction expertise delivers excellence in every build.",
      features: [
        "Residential Development",
        "Commercial Projects",
        "Quality Materials",
        "Timely Delivery",
      ],
    },
    {
      icon: <Sprout className="w-12 h-12" />,
      title: "Agri Business",
      description:
        "Sustainable agricultural solutions driving food security and economic growth. We invest in modern farming techniques and support local farmers.",
      features: [
        "Modern Farming",
        "Crop Management",
        "Export Quality Produce",
        "Sustainable Practices",
      ],
    },
  ];

  const stats = [
    { number: "500+", label: "Successful Exports" },
    { number: "50+", label: "Global Partners" },
    { number: "15+", label: "Years Experience" },
    { number: "98%", label: "Client Satisfaction" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center font-bold text-xl">
                DE
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Dan Enterprises
              </span>
            </div>

            <div className="hidden md:flex space-x-8">
              <a
                href="#home"
                className="hover:text-emerald-400 transition-colors"
              >
                Home
              </a>
              <a
                href="#services"
                className="hover:text-emerald-400 transition-colors"
              >
                Services
              </a>
              <a
                href="#about"
                className="hover:text-emerald-400 transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="hover:text-emerald-400 transition-colors"
              >
                Contact
              </a>
            </div>

            <button className="hidden md:block px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all">
              Get Started
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-md">
            <div className="px-4 pt-2 pb-4 space-y-3">
              <a
                href="#home"
                className="block py-2 hover:text-emerald-400 transition-colors"
              >
                Home
              </a>
              <a
                href="#services"
                className="block py-2 hover:text-emerald-400 transition-colors"
              >
                Services
              </a>
              <a
                href="#about"
                className="block py-2 hover:text-emerald-400 transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="block py-2 hover:text-emerald-400 transition-colors"
              >
                Contact
              </a>
              <button className="w-full px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg mt-2">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-950 to-teal-900/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNjAsIDI1NSwgMjAwLCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">
                Connecting Nigeria to the World
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Building Bridges in
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Trade, Construction & Agriculture
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Dan Enterprises is your trusted partner in coal export, real
              estate development, and agricultural innovation. We deliver
              excellence across three dynamic sectors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-semibold hover:shadow-xl hover:shadow-emerald-500/50 transition-all flex items-center justify-center group">
                Explore Services
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold border border-slate-700 transition-all">
                Learn More
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our Services
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Comprehensive solutions across multiple industries, powered by
              expertise and innovation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/10 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-slate-400 mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, fidx) => (
                    <li
                      key={fidx}
                      className="flex items-center text-sm text-slate-300"
                    >
                      <ChevronRight className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose Dan Enterprises?
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                With over 15 years of experience in international trade,
                construction, and agriculture, we've built a reputation for
                reliability, quality, and innovation. Our commitment to
                excellence drives everything we do.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Trusted Partner
                    </h3>
                    <p className="text-slate-400">
                      Proven track record with clients across multiple
                      continents
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Growth Focused
                    </h3>
                    <p className="text-slate-400">
                      Continuously expanding our capabilities and market reach
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Global Network
                    </h3>
                    <p className="text-slate-400">
                      Strategic partnerships spanning multiple countries and
                      industries
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-3xl backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    15+
                  </div>
                  <div className="text-xl text-slate-300">
                    Years of Excellence
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Work Together?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Let's discuss how Dan Enterprises can help you achieve your business
            goals
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-semibold hover:shadow-xl hover:shadow-emerald-500/50 transition-all">
              Contact Us
            </button>
            <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold border border-slate-700 transition-all">
              Request Quote
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center font-bold">
                  DE
                </div>
                <span className="text-xl font-bold">Dan Enterprises</span>
              </div>
              <p className="text-slate-400 text-sm">
                Building bridges in trade, construction, and agriculture since
                2010
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Coal Export
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Real Estate
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Agri Business
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2025 Dan Enterprises. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
