import React, { useState } from 'react';
import { ContactForm } from '../types';
import { api, handleApiResponse, getErrorMessage } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ContactPage.css';

const ContactPage: React.FC = () => {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/contact', form);
      handleApiResponse(response);
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Success page with same theme as HomePage
  if (success) {
    return (
      <div className="contact-container">
        <Header />
        <div className="success-container">
          <div className="success-content">
            <div className="success-card">
              <div className="success-icon">✅</div>
              <h2 className="success-title">
                Message Envoyé!
              </h2>
              <p className="success-message">
                Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="success-button"
              >
                Envoyer un Autre Message
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="contact-container">
      <Header />

      {/* Hero Section */}
      <section className="contact-hero-section">
        <div className="contact-hero-grid" />
        
        <div className="contact-particles-container">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`contact-particle contact-particle-${i % 5}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="contact-hero-content">
          <div className="container">
            <h1 className="contact-hero-title">
              📞 Contactez-Nous
            </h1>
            <p className="contact-hero-description">
              Nous sommes là pour vous aider dans votre parcours d'apprentissage juridique
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main-section">
        <div className="container">
          <div className="contact-grid">
            
            {/* Contact Information */}
            <div className="contact-info-section">
              <div className="contact-methods">
                {/* Email */}
                <div 
                  className="contact-method-card"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="contact-method-content">
                    <div className="contact-method-icon">📧</div>
                    <div className="contact-method-info">
                      <h3>Email</h3>
                      <p>Envoyez-nous un email</p>
                      <div className="contact-detail">contact@cliniquejuriste.com</div>
                    </div>
                  </div>
                  <div className="contact-method-glow" />
                </div>

                {/* Telephone */}
                <div 
                  className="contact-method-card"
                  style={{ animationDelay: '0.2s' }}
                >
                  <div className="contact-method-content">
                    <div className="contact-method-icon">📱</div>
                    <div className="contact-method-info">
                      <h3>Téléphone</h3>
                      <p>Appelez-nous directement</p>
                      <div className="contact-detail">+33 1 23 45 67 89</div>
                    </div>
                  </div>
                  <div className="contact-method-glow" />
                </div>

                {/* Address */}
                <div 
                  className="contact-method-card"
                  style={{ animationDelay: '0.3s' }}
                >
                  <div className="contact-method-content">
                    <div className="contact-method-icon">📍</div>
                    <div className="contact-method-info">
                      <h3>Adresse</h3>
                      <p>Visitez nos bureaux</p>
                      <div className="contact-detail">123 Rue de la Justice, Paris, France</div>
                    </div>
                  </div>
                  <div className="contact-method-glow" />
                </div>

                {/* Hours */}
                <div 
                  className="contact-method-card"
                  style={{ animationDelay: '0.4s' }}
                >
                  <div className="contact-method-content">
                    <div className="contact-method-icon">⏰</div>
                    <div className="contact-method-info">
                      <h3>Horaires</h3>
                      <p>Nos heures d'ouverture</p>
                      <div className="contact-detail">Lun-Ven: 9h-18h, Sam: 9h-12h</div>
                    </div>
                  </div>
                  <div className="contact-method-glow" />
                </div>

             
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <div className="contact-form-container">
               

                <form onSubmit={handleSubmit} className="contact-form">
                  {error && (
                    <div className="error-message">
                      <span className="error-icon">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="form-group" style={{ animationDelay: '0.1s' }}>
                    <label htmlFor="name" className="form-label">
                      👤 Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="form-input"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="form-group" style={{ animationDelay: '0.2s' }}>
                    <label htmlFor="email" className="form-label">
                      📧 Adresse e-mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="form-input"
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Subject Field */}
                  <div className="form-group" style={{ animationDelay: '0.3s' }}>
                    <label htmlFor="subject" className="form-label">
                      📋 Sujet *
                    </label>
                    <select
                      id="subject"
                      required
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Choisissez un sujet</option>
                      <option value="question-generale">Question générale</option>
                      <option value="support-technique">Support technique</option>
                      <option value="suggestion-cours">Suggestion de cours</option>
                      <option value="partenariat">Opportunité de partenariat</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  {/* Message Field */}
                  <div className="form-group" style={{ animationDelay: '0.4s' }}>
                    <label htmlFor="message" className="form-label">
                      💬 Message *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="form-textarea"
                      placeholder="Décrivez votre demande en détail..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="form-group" style={{ animationDelay: '0.5s' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="submit-button"
                    >
                      {loading ? (
                        <div className="loading-container">
                          <div className="loading-dots">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                          <span>Envoi en cours...</span>
                        </div>
                      ) : (
                        '🚀 Envoyer le Message'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ContactPage;