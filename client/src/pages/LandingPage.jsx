import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Globe, Clock, BarChart3, ArrowRight } from 'lucide-react';
import Header from '../components/Header';

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();const features = [
    {
      icon: QrCode,
      title: t('landing.features.qrTracking'),
      description: t('landing.features.qrDescription'),
      color: 'text-blue-600'
    },
    {
      icon: Globe,
      title: t('landing.features.multiLanguage'),
      description: t('landing.features.multiLanguageDescription'),
      color: 'text-green-600'
    },
    {
      icon: Clock,
      title: t('landing.features.realTime'),
      description: t('landing.features.realTimeDescription'),
      color: 'text-purple-600'
    },
    {
      icon: BarChart3,
      title: t('landing.features.reports'),
      description: t('landing.features.reportsDescription'),
      color: 'text-orange-600'
    }
  ];const steps = [
    {
      step: '1',
      title: t('landing.howItWorks.step1'),
      description: t('landing.howItWorks.step1Desc'),
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400'
    },
    {
      step: '2',
      title: t('landing.howItWorks.step2'),
      description: t('landing.howItWorks.step2Desc'),
      color: 'bg-green-100 text-green-600 dark:bg-green-800/50 dark:text-green-400'
    },
    {
      step: '3',
      title: t('landing.howItWorks.step3'),
      description: t('landing.howItWorks.step3Desc'),
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-800/50 dark:text-purple-400'
    }
  ];const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-900">
      <Header showLogin={true} onLoginClick={() => navigate('/login')} />    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-20"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 mt-10"
          >
            {t('landing.hero.title')}
          </motion.h1>        <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            {t('landing.hero.subtitle')}
          </motion.p>        <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={() => navigate('/login')}
              className="px-6 py-3 text-base md:px-8 md:py-4 md:text-lg bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
            >
              {t('landing.hero.cta')}
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </motion.button>
          </motion.div>
        </motion.section>      {/* Features Section */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            {t('landing.features.title')}
          </motion.h2>        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 h-full"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} bg-opacity-10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>      {/* How It Works Section */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            {t('landing.howItWorks.title')}
          </motion.h2>        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex h-full"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-700 dark:to-purple-700 z-0" />
                )}              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-[0_0_15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 w-full h-full relative z-10">
                  <div className={`w-20 h-10 rounded-full ${step.color} flex items-center justify-center mb-4 text-lg font-bold`}>
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>      {/* Trust Indicators */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {t('landing.stats.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                10-100
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {t('landing.stats.activeUsers')}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                99.9%
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {t('landing.stats.workingHours')}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                24/7
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {t('landing.stats.support')}
              </div>
            </div>
          </div>
        </motion.section>      {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 mb-2 text-center"
        >
          <motion.button
            whileHover={{ opacity: 0.9 }}
            whileTap={{ opacity: 0.8 }}
            onClick={() => navigate('/login')}
            className="px-6 py-3 text-base md:px-8 md:py-4 md:text-lg bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
          >
            {t('landing.hero.cta')}
            <ArrowRight className="inline-block ml-2 w-5 h-5" />
          </motion.button>
        </motion.section>
      </main>
    </div>
  );
};

export default LandingPage;
