import React from 'react';
import './LegalPages.css';

const Privacy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to NaujanGO. We are committed to protecting your privacy and ensuring the security of your 
            personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you use our tourism platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>When you register or use our Service, we may collect:</p>
          <ul>
            <li><strong>Account Information:</strong> Username, email address, password, full name</li>
            <li><strong>Profile Information:</strong> Phone number, date of birth, gender, user type (foreigner/resident/local)</li>
            <li><strong>Booking Information:</strong> Check-in/check-out dates, guest details, special requests</li>
            <li><strong>Payment Information:</strong> Processed securely through PayMongo (we do not store full card details)</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Location Data:</strong> GPS coordinates (with your permission) for map-based features</li>
            <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics information</li>
          </ul>

          <h3>2.3 User-Generated Content</h3>
          <ul>
            <li>Reviews and ratings</li>
            <li>Comments and feedback</li>
            <li>Photos and media uploads</li>
            <li>Itinerary planning data</li>
            <li>Chat history with AI chatbot</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use collected information for the following purposes:</p>
          <ul>
            <li><strong>Service Delivery:</strong> Process bookings, manage reservations, provide customer support</li>
            <li><strong>Personalization:</strong> Customize recommendations, save preferences, improve user experience</li>
            <li><strong>Communication:</strong> Send booking confirmations, updates, newsletters, and promotional materials</li>
            <li><strong>Analytics:</strong> Analyze usage patterns, improve platform performance, develop new features</li>
            <li><strong>Security:</strong> Detect fraud, prevent abuse, protect user accounts</li>
            <li><strong>Legal Compliance:</strong> Comply with laws, regulations, and legal processes</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing and Disclosure</h2>
          
          <h3>4.1 With Accommodation Providers</h3>
          <p>
            When you make a booking, we share necessary information (name, contact details, booking details) 
            with the accommodation provider to fulfill your reservation.
          </p>

          <h3>4.2 With Service Providers</h3>
          <p>We may share information with trusted third-party service providers who assist us with:</p>
          <ul>
            <li>Payment processing (PayMongo)</li>
            <li>Email services and notifications</li>
            <li>Analytics and data analysis</li>
            <li>Cloud hosting and storage</li>
            <li>Customer support tools</li>
          </ul>

          <h3>4.3 With Your Consent</h3>
          <p>
            We may share your information with other parties when you provide explicit consent for specific purposes.
          </p>

          <h3>4.4 Legal Requirements</h3>
          <p>We may disclose information when required by law or to:</p>
          <ul>
            <li>Comply with legal obligations or court orders</li>
            <li>Protect our rights, property, or safety</li>
            <li>Prevent fraud or security issues</li>
            <li>Respond to government requests</li>
          </ul>

          <h3>4.5 Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, or sale of assets, your information may be transferred 
            to the acquiring entity.
          </p>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information:
          </p>
          <ul>
            <li>SSL/TLS encryption for data transmission</li>
            <li>Secure password hashing (bcrypt)</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
            <li>Secure cloud infrastructure</li>
          </ul>
          <p>
            However, no method of transmission over the Internet is 100% secure. While we strive to protect 
            your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>6. Your Rights and Choices</h2>
          
          <h3>6.1 Access and Update</h3>
          <p>
            You can access and update your account information at any time through your profile settings.
          </p>

          <h3>6.2 Data Deletion</h3>
          <p>
            You may request deletion of your account and personal data by contacting us. Some information 
            may be retained for legal or operational purposes.
          </p>

          <h3>6.3 Marketing Communications</h3>
          <p>
            You can opt out of promotional emails by using the unsubscribe link in any marketing email or 
            updating your communication preferences in your account settings.
          </p>

          <h3>6.4 Cookies</h3>
          <p>
            You can control cookie preferences through your browser settings. Note that disabling cookies 
            may affect functionality of the Service.
          </p>

          <h3>6.5 Location Data</h3>
          <p>
            You can enable or disable location services through your device settings at any time.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide the Service and fulfill the 
            purposes outlined in this Privacy Policy. Specific retention periods include:
          </p>
          <ul>
            <li><strong>Account Data:</strong> Until account deletion is requested</li>
            <li><strong>Booking Records:</strong> 7 years for legal and tax compliance</li>
            <li><strong>Reviews and Content:</strong> Indefinitely or until removal is requested</li>
            <li><strong>Analytics Data:</strong> Aggregated and anonymized after 2 years</li>
          </ul>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            Our Service is not intended for users under 18 years of age. We do not knowingly collect 
            personal information from children. If you believe we have collected information from a child, 
            please contact us immediately.
          </p>
        </section>

        <section>
          <h2>9. Third-Party Links</h2>
          <p>
            Our Service may contain links to third-party websites, services, or social media platforms. 
            We are not responsible for the privacy practices of these third parties. Please review their 
            privacy policies before providing any information.
          </p>
        </section>

        <section>
          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be stored and processed in servers located in different countries. 
            By using our Service, you consent to the transfer of your information to countries that 
            may have different data protection laws.
          </p>
        </section>

        <section>
          <h2>11. Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes 
            by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage 
            you to review this Privacy Policy periodically.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal 
            information, please contact us at:
          </p>
          <ul>
            <li><strong>Email:</strong> privacy@naujango.com</li>
            <li><strong>Support Email:</strong> support@naujango.com</li>
            <li><strong>Address:</strong> Naujan, Oriental Mindoro, Philippines</li>
          </ul>
        </section>

        <section>
          <h2>13. Philippine Data Privacy Act Compliance</h2>
          <p>
            NaujanGO complies with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines. 
            You have the right to:
          </p>
          <ul>
            <li>Be informed about the collection and processing of your personal data</li>
            <li>Access your personal data held by NaujanGO</li>
            <li>Dispute inaccurate or incomplete data</li>
            <li>Request blocking, removal, or destruction of your data</li>
            <li>Lodge a complaint with the National Privacy Commission</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
