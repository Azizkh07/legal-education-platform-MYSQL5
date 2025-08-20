
import React, { useState } from 'react';

interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  birthDate: string;
  specialization: string;
}

const UserProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>({
    name: "Ahmed Hassan",
    email: "ahmed.hassan@example.com",
    phone: "+33 6 12 34 56 78",
    bio: "Étudiant en droit passionné par le droit constitutionnel et les droits de l'homme.",
    location: "Paris, France",
    website: "https://ahmed-hassan.com",
    birthDate: "1995-05-15",
    specialization: "Droit Constitutionnel"
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  const handleSave = () => {
    setIsEditing(false);
    // API call to save profile
  };

  const handleChange = (field: keyof UserProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center animate-slideInLeft">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mr-6">
                <span className="text-teal-600 text-3xl font-bold">{profile.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 arabic-text">{profile.name}</h1>
                <p className="text-gray-600">{profile.specialization}</p>
                <p className="text-sm text-gray-500">{profile.location}</p>
              </div>
            </div>
            <div className="animate-slideInRight">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300"
                >
                  Modifier le Profil
                </button>
              ) : (
                <div className="space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300"
                  >
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 animate-fadeIn">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'profile', label: 'Informations Personnelles', icon: '👤' },
                { key: 'security', label: 'Sécurité', icon: '🔒' },
                { key: 'preferences', label: 'Préférences', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-slideInLeft">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom Complet
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    ) : (
                      <p className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 arabic-text">
                        {profile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    ) : (
                      <p className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    ) : (
                      <p className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spécialisation
                    </label>
                    {isEditing ? (
                      <select
                        value={profile.specialization}
                        onChange={(e) => handleChange('specialization', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      >
                        <option value="Droit Constitutionnel">Droit Constitutionnel</option>
                        <option value="Droit Commercial">Droit Commercial</option>
                        <option value="Droit du Travail">Droit du Travail</option>
                        <option value="Droit Pénal">Droit Pénal</option>
                      </select>
                    ) : (
                      <p className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.specialization}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biographie
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={profile.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="Parlez-nous de vous..."
                    />
                  ) : (
                    <p className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-slideInRight">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Paramètres de Sécurité
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Mot de passe</h4>
                        <p className="text-sm text-gray-600">Dernière modification il y a 30 jours</p>
                      </div>
                      <button className="text-teal-500 hover:text-teal-600 font-medium">
                        Modifier
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Authentification à deux facteurs</h4>
                        <p className="text-sm text-gray-600">Sécurisez votre compte avec 2FA</p>
                      </div>
                      <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300">
                        Activer
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Sessions actives</h4>
                        <p className="text-sm text-gray-600">Gérez vos sessions de connexion</p>
                      </div>
                      <button className="text-teal-500 hover:text-teal-600 font-medium">
                        Voir tout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Préférences
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Notifications Email</h4>
                        <p className="text-sm text-gray-600">Recevez des mises à jour par email</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-teal-600" defaultChecked />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Langue</h4>
                        <p className="text-sm text-gray-600">Choisissez votre langue préférée</p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Français</option>
                        <option>العربية</option>
                        <option>English</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Mode Sombre</h4>
                        <p className="text-sm text-gray-600">Basculer vers le thème sombre</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;