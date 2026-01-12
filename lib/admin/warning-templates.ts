/**
 * Warning notification templates for different report types
 * These templates are used when sending warnings to users based on report violations
 */

export type ReportType = 'spam' | 'harassment' | 'inappropriate' | 'fake_scam' | 'violence' | 'other'

export interface WarningTemplate {
  type: ReportType
  label: string
  title: string
  message: string
}

export const WARNING_TEMPLATES: Record<ReportType, WarningTemplate> = {
  spam: {
    type: 'spam',
    label: 'Spam',
    title: 'Warning: Spam Activity Detected',
    message: `We have received reports regarding spam activity associated with your account. Posting promotional content, unsolicited messages, or repetitive content that disrupts the community is strictly prohibited.

This is a formal warning. Continued spam activity may result in:
- Temporary suspension of your account
- Permanent ban from the platform
- Loss of access to all games and features

Please review our community guidelines and ensure your future activity complies with our terms of service. If you have any questions or concerns, please contact our support team at gamon9966@gmail.com.`,
  },
  harassment: {
    type: 'harassment',
    label: 'Harassment or Bullying',
    title: 'Warning: Harassment or Bullying Violation',
    message: `We have received reports of harassment or bullying behavior associated with your account. Our platform is committed to providing a safe and respectful environment for all users.

Harassment, bullying, or any form of abusive behavior towards other users is strictly prohibited and will not be tolerated.

This is a formal warning. Further violations may result in:
- Immediate temporary suspension
- Permanent ban from the platform
- Potential legal action if behavior continues

We take these reports seriously. Please review our community guidelines and ensure your interactions with others are respectful and appropriate. If you have concerns or questions, please contact our support team at gamon9966@gmail.com.`,
  },
  inappropriate: {
    type: 'inappropriate',
    label: 'Inappropriate Content',
    title: 'Warning: Inappropriate Content Violation',
    message: `We have received reports regarding inappropriate content posted by your account. Our platform maintains strict standards for content to ensure a safe and welcoming environment for all users.

Posting sexually explicit, offensive, or otherwise inappropriate content is strictly prohibited.

This is a formal warning. Continued violations may result in:
- Content removal and account restrictions
- Temporary suspension of your account
- Permanent ban from the platform

Please review our community guidelines regarding acceptable content. We expect all users to maintain appropriate standards in their posts and interactions. If you have questions or concerns, please contact our support team at gamon9966@gmail.com.`,
  },
  fake_scam: {
    type: 'fake_scam',
    label: 'Fake or Scam Activity',
    title: 'Warning: Fake or Scam Activity Detected',
    message: `We have received reports of potentially fraudulent or scam activity associated with your account. Creating fake games, misleading other users, or engaging in any form of deceptive practices is strictly prohibited.

Our platform is built on trust and transparency. Any activity that undermines this trust will be met with strict consequences.

This is a formal warning. Further violations may result in:
- Immediate account suspension
- Permanent ban from the platform
- Reporting to relevant authorities if fraudulent activity is confirmed

Please ensure all your activities on the platform are genuine and transparent. If you believe this warning was issued in error, please contact our support team immediately at gamon9966@gmail.com.`,
  },
  violence: {
    type: 'violence',
    label: 'Violence or Threats',
    title: 'Warning: Violence or Threats Violation',
    message: `We have received reports of violent language, threats, or behavior associated with your account. Our platform has zero tolerance for any form of violence, threats, or intimidation.

Threatening, violent, or intimidating behavior towards other users is strictly prohibited and may have serious legal consequences.

This is a formal warning. Further violations will result in:
- Immediate and permanent ban from the platform
- Reporting to law enforcement authorities
- Potential legal action

We take threats and violence extremely seriously. Please review our community guidelines immediately. If you have concerns or questions, please contact our support team at gamon9966@gmail.com.`,
  },
  other: {
    type: 'other',
    label: 'Other Violation',
    title: 'Warning: Community Guidelines Violation',
    message: `We have received reports of behavior that violates our community guidelines. Our platform is committed to maintaining a safe, respectful, and enjoyable environment for all users.

All users are expected to follow our terms of service and community guidelines at all times.

This is a formal warning. Continued violations may result in:
- Account restrictions or limitations
- Temporary suspension
- Permanent ban from the platform

Please review our community guidelines and ensure your future activity complies with our terms of service. If you have any questions or concerns, please contact our support team at gamon9966@gmail.com.`,
  },
}

/**
 * Get a warning template by report type
 */
export function getWarningTemplate(type: ReportType): WarningTemplate {
  return WARNING_TEMPLATES[type] || WARNING_TEMPLATES.other
}

/**
 * Get all available warning templates
 */
export function getAllWarningTemplates(): WarningTemplate[] {
  return Object.values(WARNING_TEMPLATES)
}
