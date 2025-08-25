import React, { useState } from 'react';
import { ContactForm } from '../types';
import { api, handleApiResponse, getErrorMessage } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import '../styles/ContactPage.css';

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
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
      setError(getErrorMessage(err) || t('contact.error_generic', 'Failed to send message. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Success page
  if (success) {
    return (
      <div className="contact-container">
        <Header />
        <div className="success-container">
          <div className="success-content">
            <div className="success-card">
              <div className="success-icon" aria-hidden>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="success-title">
                {t('contact.success_title', 'Message sent!')}
              </h2>
              <p className="success-message">
                {t('contact.success_message', 'Thank you for your message. Our team will reply as soon as possible.')}
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="success-button"
              >
                {t('contact.success_send_another', 'Send another message')}
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
      <section className="contact-hero-section" aria-labelledby="contact-hero-title">
        <div className="contact-hero-grid" />
        
        <div className="contact-particles-container" aria-hidden>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`contact-particle contact-particle-${i % 4}`}
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
            <h1 id="contact-hero-title" className="contact-hero-title">
              {t('contact.hero_title', 'Contact Us')}
            </h1>
            <p className="contact-hero-description">
              {t('contact.hero_description', "Our team is here to support your legal learning journey. Don't hesitate to ask us anything.")}
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main-section" aria-labelledby="contact-main-heading">
        <div className="container">
          <div className="contact-grid">
            
            {/* Contact Information */}
            <div className="contact-info-section" aria-hidden={false}>
              <h2 id="contact-main-heading" className="contact-info-title">{t('contact.info_title', 'Contact information')}</h2>
              
              <div className="contact-methods">
                {/* Email */}
                <div 
                  className="contact-method-card"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="contact-method-content">
                    <div className="contact-method-icon" aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="contact-method-info">
                      <h3>{t('contact.method_email.title', 'Email')}</h3>
                      <p>{t('contact.method_email.desc', 'Send us a message')}</p>
                      <div className="contact-detail">cliniquedesjuristes@gmail.com</div>
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
                    <div className="contact-method-icon" aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="contact-method-info">
                      <h3>{t('contact.method_phone.title', 'Phone')}</h3>
                      <p>{t('contact.method_phone.desc', 'Call us directly')}</p>
                      <div className="contact-detail">+216 56 614 717</div>
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
                    <div className="contact-method-icon" aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="contact-method-info">
                      <h3>{t('contact.method_address.title', 'Address')}</h3>
                      <p>{t('contact.method_address.desc', 'Visit our offices')}</p>
                      <div className="contact-detail">{t('contact.method_address.detail', 'Tunis, Tunisia')}</div>
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
                    <div className="contact-method-icon" aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="contact-method-info">
                      <h3>{t('contact.method_hours.title', 'Opening hours')}</h3>
                      <p>{t('contact.method_hours.desc', 'Our availability hours')}</p>
                      <div className="contact-detail" dangerouslySetInnerHTML={{ __html: t('contact.method_hours.detail', 'Mon-Fri: 9am-6pm<br/>Sat: 9am-1pm') }} />
                    </div>
                  </div>
                  <div className="contact-method-glow" />
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section" aria-labelledby="contact-form-heading">
              <div className="contact-form-container">
                <form onSubmit={handleSubmit} className="contact-form" noValidate>
                  <h2 id="contact-form-heading" className="sr-only">{t('contact.form_heading', 'Contact form')}</h2>

                  {error && (
                    <div className="error-message" role="alert" aria-live="assertive">
                      <div className="error-icon" aria-hidden>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="form-group" style={{ animationDelay: '0.1s' }}>
                    <label htmlFor="name" className="form-label">
                      <span className="label-text">{t('contact.form.name_label', 'Full name')}</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon" aria-hidden>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="name"
                        required
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="form-input"
                        placeholder={t('contact.form.name_placeholder', 'Your full name')}
                        aria-required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="form-group" style={{ animationDelay: '0.2s' }}>
                    <label htmlFor="email" className="form-label">
                      <span className="label-text">{t('contact.form.email_label', 'Email address')}</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon" aria-hidden>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        required
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="form-input"
                        placeholder={t('contact.form.email_placeholder', 'your@email.com')}
                        aria-required
                      />
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div className="form-group" style={{ animationDelay: '0.3s' }}>
                    <label htmlFor="subject" className="form-label">
                      <span className="label-text">{t('contact.form.subject_label', 'Subject')}</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon" aria-hidden>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h5l3 3V11a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M14 11V9a2 2 0 0 1 2-2h5l3-3v9a2 2 0 0 1-2 2h-1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <select
                        id="subject"
                        required
                        value={form.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        className="form-select"
                        aria-required
                      >
                        <option value="">{t('contact.form.subject_placeholder', 'Select a subject')}</option>
                        <option value="general">{t('contact.form.subjects.general', 'General question')}</option>
                        <option value="tech">{t('contact.form.subjects.tech', 'Technical support')}</option>
                        <option value="course">{t('contact.form.subjects.course', 'Course suggestion')}</option>
                        <option value="partnership">{t('contact.form.subjects.partnership', 'Partnership opportunity')}</option>
                        <option value="other">{t('contact.form.subjects.other', 'Other')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="form-group" style={{ animationDelay: '0.4s' }}>
                    <label htmlFor="message" className="form-label">
                      <span className="label-text">{t('contact.form.message_label', 'Your message')}</span>
                      <span className="label-required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <textarea
                        id="message"
                        required
                        rows={6}
                        value={form.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        className="form-textarea"
                        placeholder={t('contact.form.message_placeholder', 'Describe your request in detail...')}
                        aria-required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="form-group" style={{ animationDelay: '0.5s' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="submit-button"
                      aria-busy={loading}
                    >
                      {loading ? (
                        <div className="loading-container" aria-hidden>
                          <div className="loading-spinner"></div>
                          <span>{t('contact.form.sending', 'Sending...')}</span>
                        </div>
                      ) : (
                        t('contact.form.submit', 'Send message')
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