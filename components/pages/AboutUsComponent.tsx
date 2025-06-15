"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import type { JSX } from "react";
import { Ship, Globe, TrendingUp, Award, Users, Calendar, Building, Target, Eye, Anchor, MapPin, CheckCircle, ArrowRight, Play, Star, Zap, Shield, Heart } from "lucide-react";

interface Stat {
  number: string;
  label: string;
  subtext: string;
  icon: React.ComponentType<any>;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface Value {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

interface Leader {
  name: string;
  position: string;
  experience: string;
  image: string;
}

export function AboutUsComponent(): JSX.Element {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const stats: Stat[] = [
    { number: "70+", label: "Years of Excellence", subtext: "Since 1952", icon: Calendar },
    { number: "156", label: "Active Vessels", subtext: "Modern Fleet", icon: Ship },
    { number: "45+", label: "Global Ports", subtext: "Worldwide Network", icon: Globe },
    { number: "2.1M", label: "TEU Annually", subtext: "Cargo Capacity", icon: Award }
  ];

  const milestones: Milestone[] = [
    { year: "1952", title: "Foundation", description: "SCMT established as Iraq's national maritime carrier", icon: Building },
    { year: "1970s", title: "Expansion Era", description: "Rapid fleet growth and route diversification", icon: TrendingUp },
    { year: "1990s", title: "Modernization", description: "Technology integration and operational excellence", icon: Zap },
    { year: "2000s", title: "Global Reach", description: "International partnerships and market expansion", icon: Globe },
    { year: "2020s", title: "Digital Future", description: "Smart shipping and sustainable operations", icon: Target }
  ];

  const values: Value[] = [
    {
      icon: Shield,
      title: "Safety First",
      description: "Uncompromising commitment to the safety of our crew, cargo, and environment"
    },
    {
      icon: Star,
      title: "Excellence",
      description: "Delivering superior maritime services that exceed customer expectations"
    },
    {
      icon: Heart,
      title: "Integrity",
      description: "Building trust through transparent and ethical business practices"
    },
    {
      icon: Globe,
      title: "Global Vision",
      description: "Connecting Iraq to the world through strategic maritime networks"
    }
  ];

  const leadership: Leader[] = [
    {
      name: "Captain Ahmed Al-Rashid",
      position: "Chief Executive Officer",
      experience: "25+ years in maritime operations",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Sarah Al-Maktoum",
      position: "Chief Operations Officer",
      experience: "20+ years in logistics management",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332e234?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Eng. Omar Hassan",
      position: "Chief Technology Officer",
      experience: "18+ years in maritime technology",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const cardGradientStyle = {
    backgroundImage: `
      linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
      linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
    `,
    backgroundBlendMode: 'overlay',
  };

  return (
    <div className="w-full max-w-[1600.24px] mx-auto text-white min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="backdrop-blur border border-slate-700 rounded-full p-4" style={cardGradientStyle}>
             <Image
                             src="/white-logo.png"
                             width={100}
                             height={100}
                             alt="SCMT Logo"
                             className="inline-block align-middle mb-2"
                             style={{ objectFit: 'contain' }}
                           />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white">
            State Company for
            <br />
            <span className="text-cyan-400">Maritime Transport</span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            For over seven decades, SCMT has been Iraq's gateway to the world, connecting nations through reliable maritime excellence and unwavering commitment to progress.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-cyan-500 hover:bg-cyan-600 px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-white">
              <span>Discover Our Story</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Watch Video</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index} 
                className={`group ${isVisible.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-200`}
                style={{ transitionDelay: `${index * 30}ms` }}
              >
                <div className="backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 hover:border-slate-600/50 transition-all duration-300" style={cardGradientStyle}>
                  <div className="flex items-center justify-between mb-6">
                    <IconComponent className="w-8 h-8 text-white" />
                    <div className="w-12 h-1 bg-white rounded-full opacity-60"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-white">
                      {stat.number}
                    </div>
                    <div className="text-white font-medium">{stat.label}</div>
                    <div className="text-slate-200 text-sm">{stat.subtext}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-20 px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`space-y-8 ${isVisible.story ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'} transition-all duration-250`}>
            <div>
              <div className="inline-flex items-center space-x-2 border border-slate-700 rounded-full px-4 py-2 mb-8" style={cardGradientStyle}>
                <Building className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">OUR STORY</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                Seven Decades of Maritime Leadership
              </h2>
            </div>
            
            <div className="space-y-6 text-slate-300 leading-relaxed text-lg">
              <p>
                Founded in 1952 as Iraq's national maritime carrier, the State Company for Maritime Transport (SCMT) has grown from a small fleet serving regional routes to become a cornerstone of Iraq's international trade infrastructure.
              </p>
              
              <p>
                Under the Ministry of Transportation, we have continuously evolved to meet the changing demands of global commerce while maintaining our commitment to safety, reliability, and operational excellence.
              </p>
              
              <p>
                Today, SCMT stands as a testament to Iraqi maritime expertise, combining traditional values with cutting-edge technology to serve customers across the Mediterranean, Persian Gulf, and Red Sea corridors.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="border border-slate-700/50 rounded-lg p-6" style={cardGradientStyle}>
                <div className="text-3xl font-bold text-white mb-2">98%</div>
                <div className="text-white">Client Satisfaction</div>
              </div>
              <div className="border border-slate-700/50 rounded-lg p-6" style={cardGradientStyle}>
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-white">Operations Support</div>
              </div>
            </div>
          </div>
          
          <div className={`${isVisible.story ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} transition-all duration-250`}>
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden border border-slate-700/50">
                <img 
                  src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop"
                  alt="SCMT Maritime Operations"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 backdrop-blur-sm border border-slate-700 rounded-lg p-6" style={cardGradientStyle}>
                <div className="text-2xl font-bold text-white">1952</div>
                <div className="text-white text-sm">Since</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section id="timeline" className="py-20 px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 border border-slate-700 rounded-full px-4 py-2 mb-8" style={cardGradientStyle}>
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">OUR JOURNEY</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Milestones of Excellence
          </h2>
          
          <p className="text-slate-400 text-xl max-w-3xl mx-auto">
            From humble beginnings to maritime leadership - discover the key moments that shaped SCMT's remarkable journey
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-700"></div>
          
          <div className="space-y-16">
            {milestones.map((milestone, index) => {
              const IconComponent = milestone.icon;
              return (
                <div 
                  key={index}
                  className={`relative flex items-start space-x-8 ${isVisible.timeline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-250`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 border-2 border-cyan-400 rounded-full flex items-center justify-center" style={cardGradientStyle}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-grow border border-slate-700/50 rounded-lg p-8 transition-all duration-300" style={cardGradientStyle}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-white">{milestone.year}</div>
                      <div className="text-slate-200 text-sm">Milestone {index + 1}</div>
                    </div>
                    
                    <h4 className="text-xl font-semibold text-white mb-3">{milestone.title}</h4>
                    <p className="text-slate-100 leading-relaxed">{milestone.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 border border-slate-700 rounded-full px-4 py-2 mb-8" style={cardGradientStyle}>
            <Heart className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">OUR VALUES</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Principles That Guide Us
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            
            return (
              <div 
                key={index}
                className={`group border border-slate-700/50 rounded-lg p-8 hover:border-slate-600/50 transition-all duration-300 ${isVisible.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ 
                  ...cardGradientStyle,
                  transitionDelay: `${index * 50}ms` 
                }}
              >
                <div className="w-16 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center mb-6">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h4 className="text-xl font-semibold text-white mb-4">
                  {value.title}
                </h4>
                
                <p className="text-slate-100 leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leadership Section */}
      <section id="leadership" className="py-20 px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 border border-slate-700 rounded-full px-4 py-2 mb-8" style={cardGradientStyle}>
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">LEADERSHIP</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Experienced Leadership Team
          </h2>
          
          <p className="text-slate-400 text-xl max-w-3xl mx-auto">
            Our success is driven by seasoned maritime professionals with decades of combined experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {leadership.map((leader, index) => (
            <div 
              key={index}
              className={`border border-slate-700/50 rounded-lg p-8 text-center hover:border-slate-600/50 transition-all duration-300 ${isVisible.leadership ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ 
                ...cardGradientStyle,
                transitionDelay: `${index * 50}ms` 
              }}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-2 border-slate-600">
                <img 
                  src={leader.image} 
                  alt={leader.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h4 className="text-xl font-semibold text-white mb-2">{leader.name}</h4>
              <p className="text-white font-medium mb-3">{leader.position}</p>
              <p className="text-slate-100">{leader.experience}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-20 px-8">
        <div className="border border-slate-700/50 rounded-lg p-16 text-center max-w-6xl mx-auto" style={cardGradientStyle}>
          <div className="inline-flex items-center space-x-2 bg-slate-700/50 border border-slate-600 rounded-full px-4 py-2 mb-12">
            <Eye className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">2030 VISION</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">
            Charting the Future of Maritime Excellence
          </h2>
          
          <p className="text-xl text-slate-100 leading-relaxed max-w-4xl mx-auto mb-16">
            By 2030, SCMT will be recognized as the leading maritime transport company in the Middle East, 
            setting global standards for innovation, sustainability, and operational excellence while driving 
            Iraq's economic transformation through strategic maritime connectivity.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-8">
              <div className="text-4xl font-bold text-white mb-3">100+</div>
              <div className="text-slate-100">Global Ports</div>
            </div>
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-8">
              <div className="text-4xl font-bold text-white mb-3">Carbon</div>
              <div className="text-slate-100">Neutral Fleet</div>
            </div>
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-8">
              <div className="text-4xl font-bold text-white mb-3">#1</div>
              <div className="text-slate-100">Regional Leader</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="border border-slate-700/50 rounded-lg p-16 text-center max-w-4xl mx-auto" style={cardGradientStyle}>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Ready to Sail with SCMT?
          </h2>
          
          <p className="text-xl text-slate-100 mb-12 leading-relaxed">
            Join thousands of satisfied customers who trust SCMT for their maritime transport needs. 
            Let's navigate the future together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 group">
              <span>Get Started Today</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 px-8 py-4 rounded-lg font-semibold transition-all duration-300">
              Contact Our Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}