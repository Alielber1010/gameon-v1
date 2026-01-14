// lib/db/models/PrivacyPolicy.ts
import mongoose, { Schema } from 'mongoose';

export interface IPrivacyPolicySection {
  id: string;
  title: string;
  icon: string; // Icon name (e.g., 'FileText', 'MapPin', 'Lock')
  content: string; // HTML or markdown content
  order: number; // Display order
}

const PrivacyPolicySectionSchema = new Schema({
  title: { type: String, required: true },
  icon: { type: String, required: true, default: 'FileText' },
  content: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
}, { _id: true });

const PrivacyPolicySchema = new Schema({
  sections: [PrivacyPolicySectionSchema],
  lastUpdated: { type: Date, default: Date.now },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { 
  timestamps: true,
});

const PrivacyPolicy = mongoose.models.PrivacyPolicy || mongoose.model('PrivacyPolicy', PrivacyPolicySchema);

// Helper function to get or create privacy policy
export async function getPrivacyPolicy() {
  let policy = await PrivacyPolicy.findOne();
  if (!policy) {
    // Create default policy if none exists
    policy = await PrivacyPolicy.create({
      sections: [
        {
          title: 'Introduction',
          icon: 'FileText',
          content: 'Welcome to GameOn. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform.',
          order: 1,
        },
        {
          title: 'Location Data',
          icon: 'MapPin',
          content: '**Collection:** GameOn may collect location data to help you find and create sports games near you. We collect location information when you:\n\n- Use the "Get Current Location" feature to find games nearby\n- Create a game and provide a location (via Google Maps links or coordinates)\n- Search for games by city or location\n\n**How We Use Location Data:** Location data is used solely to:\n\n- Display games near your location\n- Filter games by city or area\n- Help you create games at specific locations\n- Improve our location-based search functionality\n\n**Important:** We do **NOT** share your location data with any third parties, advertisers, or external services. Your location information is stored securely and used only within the GameOn platform to provide you with location-based features.',
          order: 2,
        },
        {
          title: 'Information We Collect',
          icon: 'Eye',
          content: 'We collect the following types of information:\n\n- **Account Information:** Name, email address, profile picture (if provided)\n- **Game Information:** Games you create, join, or participate in\n- **Location Data:** As described in the Location Data section above\n- **Usage Data:** How you interact with our platform (pages visited, features used)\n- **Device Information:** Browser type, device type, IP address (for security purposes)',
          order: 3,
        },
        {
          title: 'Data Security & Protection',
          icon: 'Lock',
          content: 'We implement industry-standard security measures to protect your data:\n\n- Encrypted data transmission (HTTPS)\n- Secure password storage using hashing algorithms\n- Regular security audits and updates\n- Access controls to limit who can view your data\n\nHowever, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.',
          order: 4,
        },
        {
          title: 'Third-Party Sharing',
          icon: 'Shield',
          content: '**We do NOT sell, rent, or share your personal information or location data with third parties.**\n\nWe may use trusted third-party services for:\n\n- **Authentication:** Google OAuth for sign-in (only with your permission)\n- **Hosting:** Vercel for application hosting\n- **Database:** MongoDB for secure data storage\n- **Image Storage:** Vercel Blob Storage for profile and game images\n\nThese services are bound by their own privacy policies and security standards. We only share the minimum information necessary for these services to function.',
          order: 5,
        },
        {
          title: 'Your Rights',
          icon: 'Shield',
          content: 'You have the right to:\n\n- **Access:** Request a copy of your personal data\n- **Correction:** Update or correct your personal information\n- **Deletion:** Request deletion of your account and associated data\n- **Opt-out:** Disable location services in your device settings\n- **Data Portability:** Request your data in a portable format\n\nTo exercise these rights, please contact us through your account settings or by emailing our support team.',
          order: 6,
        },
        {
          title: 'Cookies & Tracking',
          icon: 'FileText',
          content: 'We use cookies and similar technologies to:\n\n- Maintain your login session\n- Remember your preferences\n- Improve platform functionality\n\nWe do not use cookies for advertising or tracking purposes. You can disable cookies in your browser settings, though this may affect some platform features.',
          order: 7,
        },
        {
          title: 'Children\'s Privacy',
          icon: 'Shield',
          content: 'GameOn is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately so we can delete the information.',
          order: 8,
        },
        {
          title: 'Changes to This Policy',
          icon: 'FileText',
          content: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.',
          order: 9,
        },
        {
          title: 'Contact Us',
          icon: 'FileText',
          content: 'If you have any questions about this Privacy Policy or our data practices, please contact us through:\n\n- Your account settings page\n- Our support team via the platform',
          order: 10,
        },
      ],
    });
  }
  return policy;
}

export default PrivacyPolicy;
