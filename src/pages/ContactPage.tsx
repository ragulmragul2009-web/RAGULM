import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toastError('Please fill in your name, email, and message');
      return;
    }

    setSubmitting(true);
    try {
      await api.contact.submit({ name, email, phone, message });
      setSubmitted(true);
      success('Thank you! Your message has been received by our kitchen team.');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      toastError(err.message || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
          Get in Touch
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display mt-1">
          We’d Love to Hear From You
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
          Have questions about bulk office orders, event catering, subscriptions, or dietary allergens? Reach out anytime!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-stone-900/85 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl">
          <h2 className="text-base font-bold text-white font-display mb-4">
            Send Us an Inquiry
          </h2>

          {submitted ? (
            <div className="p-8 text-center bg-emerald-950/80 rounded-2xl border border-emerald-800 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Inquiry Received!</h3>
              <p className="text-xs text-stone-300 max-w-sm mx-auto">
                Thank you for contacting FreshSip. Our customer concierge will respond within 2-4 business hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bold text-amber-400 underline"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Priya Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Your Message or Special Request *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us what you'd like to ask or inquire about (bulk catering, corporate subscriptions, nutritional specs)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Store Information
            </h3>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Flagship Juice Bar & Kitchen</strong>
                  <span>Plot 42, Linking Road, Khar West, Mumbai, MH 400052</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Customer Care & Orders</strong>
                  <span>+91 98765 43210 / 022 2640 1234</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Email Inquiries</strong>
                  <span>hello@freshsip.com / catering@freshsip.com</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Delivery Hours</strong>
                  <span>Every day: 7:00 AM – 11:00 PM IST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ Card */}
          <div className="bg-stone-900/80 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Frequent Questions
            </h3>
            <div className="text-xs text-stone-300 space-y-2">
              <p>
                <strong className="text-white">How long do fresh cold-pressed bottles last?</strong>
                <br />
                Since we never use heat pasteurization or synthetic preservatives, keep bottles refrigerated at 4°C and consume within 48-72 hours.
              </p>
              <p>
                <strong className="text-white">Do you cater for office wellness events?</strong>
                <br />
                Yes! We deliver custom chilled coolers with assorted juices, detox cleanses, and protein smoothies for team breakfast meets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
