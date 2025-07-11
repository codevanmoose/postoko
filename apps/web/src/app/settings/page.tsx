'use client';

import { useRequireAuth } from '@postoko/auth';
import { Container } from '@/components/ui/container';
import Link from 'next/link';

export default function SettingsPage() {
  useRequireAuth();

  const settingsSections = [
    {
      title: 'Billing',
      description: 'Manage subscription and payments',
      href: '/settings/billing',
      icon: '💳',
    },
    {
      title: 'Google Drive',
      description: 'Connect and manage photo sources',
      href: '/settings/drive',
      icon: '📁',
    },
    {
      title: 'Social Media',
      description: 'Connect social accounts for posting',
      href: '/settings/social',
      icon: '🌐',
    },
    {
      title: 'Preferences',
      description: 'Customize your experience',
      href: '/settings/preferences',
      icon: '⚙️',
    },
    {
      title: 'Notifications',
      description: 'Manage email and push notifications',
      href: '/settings/notifications',
      icon: '🔔',
    },
    {
      title: 'Privacy',
      description: 'Control your data and privacy',
      href: '/settings/privacy',
      icon: '🔒',
    },
    {
      title: 'API Keys',
      description: 'Manage API access',
      href: '/settings/api-keys',
      icon: '🔑',
    },
  ];

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <span className="text-3xl">{section.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold mb-1">{section.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}