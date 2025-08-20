import React, { useState } from 'react';
import { ContactForm } from '../types';
import { api, handleApiResponse, getErrorMessage } from '../lib/api';

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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-green animate-gradient flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center animate-fadeIn">
          <div className="glass p-8 hover-lift">
            <div className="text-6xl mb-6 animate-bounce">✅</div>
            <h2 className="text-3xl font-bold text-white mb-4 text-glow">
              Message Envoyé!
            </h2>
            <p className="text-xl text-white mb-8 text-shadow">
              Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="btn-cool btn-primary-cool hover-scale px-8 py-3"
            >
              📝 Envoyer un Autre Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-blue animate-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fadeIn">
            <h1 className="text-5xl font-bold mb-6 animate-float">
              📞 Contactez-Nous
            </h1>
            <p className="text-xl mb-8 text-shadow">
              Nous sommes là pour vous aider dans votre parcours d'apprentissage
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="animate-slideInLeft">
              <h2 className="text-3xl font-bold text-gradient mb-8">
                💬 Restons en Contact
              </h2>
              
              <div className="space-y-6">
                {/* Contact Methods */}
                {[
                  {
                    icon: '📧',
                    title: 'Email',
                    description: 'Envoyez-nous un email',
                    details: 'contact@cliniquejuriste.com',
                    delay: '0.1s'
                  },
                  {
                    icon: '📱',
                    title: 'Téléphone',
                    description: 'Appelez-nous directement',
                    details: '+33 1 23 45 67 89',
                    delay: '0.2s'
                  },
                  {
                    icon: '📍',
                    title: 'Adresse',
                    description: 'Visitez nos bureaux',
                    details: '123 Rue de la Justice, Paris, France',
                    delay: '0.3s'
                  },
                  {
                    icon: '⏰',
                    title: 'Horaires',
                    description: 'Nos heures d\'ouverture',
                    details: 'Lun-Ven: 9h-18h, Sam: 9h-12h',
                    delay: '0.4s'
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="card-cool hover-lift animate-slideInLeft group"
                    style={{animationDelay: item.delay}}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl animate-bounce" style={{animationDelay: item.delay}}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-gradient transition-all">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-1">{item.description}</p>
                        <p className="text-blue-600 font-medium">{item.details}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Social Media */}
                <div className="card-cool hover-lift animate-fadeIn" style={{animationDelay: '0.5s'}}>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    🌐 Suivez-Nous
                  </h3>
                  <div className="flex space-x-4">
                    {[
                      { icon: '📘', name: 'Facebook', color: 'text-blue-600' },
                      { icon: '🐦', name: 'Twitter', color: 'text-blue-400' },
                      { icon: '💼', name: 'LinkedIn', color: 'text-blue-700' },
                      { icon: '📺', name: 'YouTube', color: 'text-red-600' }
                    ].map((social, index) => (
                      <button
                        key={index}
                        className={`text-2xl ${social.color} hover-scale animate-pulse`}
                        style={{animationDelay: `${index * 0.1}s`}}
                        title={social.name}
                      >
                        {social.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="animate-slideInRight">
              <div className="card-cool hover-lift">
                <h2 className="text-3xl font-bold text-gradient mb-8">
                  📝 Envoyez-nous un Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg animate-slideInRight">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">⚠️</span>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="animate-slideInLeft" style={{animationDelay: '0.1s'}}>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover-glow"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="animate-slideInRight" style={{animationDelay: '0.2s'}}>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Adresse e-mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover-glow"
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Subject Field */}
                  <div className="animate-slideInLeft" style={{animationDelay: '0.3s'}}>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      📋 Sujet *
                    </label>
                    <select
                      id="subject"
                      required
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover-glow"
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
                  <div className="animate-slideInRight" style={{animationDelay: '0.4s'}}>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      💬 Message *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover-glow resize-none"
                      placeholder="Décrivez votre demande en détail..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="animate-scaleUp" style={{animationDelay: '0.5s'}}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-cool btn-primary-cool w-full hover-scale animate-glow py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="loading-dots scale-50 mr-2">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                          Envoi en cours...
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

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fadeIn">
            <h2 className="text-4xl font-bold text-gradient mb-6">
              ❓ Questions Fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Trouvez rapidement les réponses à vos questions les plus courantes
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "Comment puis-je m'inscrire à un cours?",
                answer: "Il suffit de créer un compte gratuit, puis de naviguer vers la page des cours et cliquer sur 'S'inscrire' pour le cours qui vous intéresse."
              },
              {
                question: "Les cours sont-ils gratuits?",
                answer: "Nous proposons des cours gratuits et premium. Les cours gratuits vous donnent accès au contenu de base, tandis que les cours premium offrent un contenu avancé et un support personnalisé."
              },
              {
                question: "Puis-je obtenir un certificat?",
                answer: "Oui! Une fois que vous avez terminé un cours avec succès, vous recevrez un certificat de completion que vous pouvez télécharger et partager."
              },
              {
                question: "Comment contacter un instructeur?",
                answer: "Vous pouvez contacter vos instructeurs directement via la messagerie intégrée dans chaque cours ou utiliser ce formulaire de contact."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="card-cool hover-lift animate-slideInLeft"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-gradient transition-all">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;