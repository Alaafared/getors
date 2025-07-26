import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, AlertCircle, Target, X, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import BookingForm from './BookingForm';
import { Helmet } from 'react-helmet';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';

const TraineeDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTermSection, setActiveTermSection] = useState(0);

  useEffect(() => {
    if (user) {
      loadMyBookings();
    }
  }, [user]);

  const loadMyBookings = async () => {
    const { data, error } = await supabase.from('bookings').select('*').eq('student_id', user.id);
    if(error) {
        toast({ title: "Error", description: error.message, variant: 'destructive'});
    } else {
        setMyBookings(data);
        calculateProgress(data);
    }
  };

  const calculateProgress = (bookings) => {
    const totalBookings = bookings.length;
    if (totalBookings === 0) {
      setProgress(0);
      return;
    }
    const attendedBookings = bookings.filter(b => b.attendance === 'present').length;
    const progressPercentage = (attendedBookings / totalBookings) * 100;
    setProgress(progressPercentage);
  };

  const handleProceedToBooking = () => {
    if (!acceptedTerms) {
      toast({ title: t('acceptTerms'), variant: 'destructive' });
      return;
    }
    setShowBookingForm(true);
  };

  const getStatusBadge = (status) => {
    const config = {
      confirmed: { color: 'bg-green-500', text: t('confirmed') },
      pending: { color: 'bg-yellow-500', text: t('pending') },
      cancelled: { color: 'bg-red-500', text: t('cancelled') }
    }[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const termSections = [
    {
      title: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions',
      content: language === 'ar' 
        ? 'أوافق على الشروط والأحكام وأعطي الموافقة لجميع الأشخاص المضافين إلى حسابي ليصبحوا أعضاء في أكاديمية السباحة. خلال فترة العضوية، أوافق على مشاركة المسجلين في حسابي في الأنشطة والفعاليات التي تنظمها الأكاديمية.'
        : 'I HEREBY AGREE to the terms and conditions and give consent to all people added to my account in becoming a member of the Swimming Academy. During the membership period, I consent to those registered on my account to participate in activities organized by the Academy.'
    },
    {
      title: language === 'ar' ? 'فترة التشغيل' : 'Term of Operation',
      content: language === 'ar' 
        ? 'الأكاديمية تعمل خلال جميع العطلات الرسمية. سيتم إبلاغ أي استثناءات مقدماً. سياسة الأكاديمية أن دروس التعويض ستقدم فقط عند إلغاء الدروس من قبل الأكاديمية، وليس للعطلات أو الأمراض قصيرة الأجل.'
        : 'The Academy runs through all public holidays. Any exceptions will be communicated in advance. Catch-up lessons are only offered when cancelled by the Academy, not for holidays or short-term sickness.'
    },
    {
      title: language === 'ar' ? 'الأشياء المفقودة' : 'Lost Items',
      content: language === 'ar' 
        ? 'لا تتحمل الأكاديمية أي مسؤولية عن فقدان أو تلف الممتلكات أو الأشياء الثمينة، حتى لو تركت في الخزائن المقدمة.'
        : 'No responsibility is accepted for loss or damage to property or valuables, even if left in provided lockers.'
    },
    {
      title: language === 'ar' ? 'الرسوم والتعويضات' : 'Fees & Credits',
      content: language === 'ar' 
        ? 'يتم تقديم دروس تعويض فقط عند إلغاء الدروس من قبل الأكاديمية. يجب استخدام دروس التعويض خلال الفصل الحالي.'
        : 'Catch-up lessons are only offered when cancelled by the Academy. Must be used within the current term.'
    }
  ];

  const handleNextTerm = () => {
    setActiveTermSection((prev) => (prev + 1) % termSections.length);
  };

  const handlePrevTerm = () => {
    setActiveTermSection((prev) => (prev - 1 + termSections.length) % termSections.length);
  };

  if (showBookingForm) {
    return <BookingForm onBack={() => setShowBookingForm(false)} onBookingComplete={loadMyBookings} />;
  }

  return (
    <>
      <Helmet>
        <title>{language === 'ar' ? 'لوحة تحكم المتدرب -  Gators Swimming Academy' : 'Trainee Dashboard - Swimming Academy'}</title>
        <meta name="description" content={language === 'ar' ? 'لوحة تحكم المتدرب لحجز الجلسات ومتابعة التدريب' : 'Trainee dashboard for booking sessions and tracking training'} />
      </Helmet>

      <AnimatePresence>
        {showTermsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-blue-900 to-blue-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </h2>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-blue-800/30 p-4 border-r border-white/20">
                  <nav className="space-y-1">
                    {termSections.map((section, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTermSection(index)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTermSection === index ? 'bg-blue-600 text-white' : 'text-white/80 hover:bg-white/10'}`}
                      >
                        {section.title}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <motion.div
                    key={activeTermSection}
                    initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="prose prose-invert max-w-none"
                  >
                    <h3 className="text-xl font-semibold text-white mb-4">
                      {termSections[activeTermSection].title}
                    </h3>
                    <p className="text-white/90 whitespace-pre-line">
                      {termSections[activeTermSection].content}
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="p-6 border-t border-white/20 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={handlePrevTerm}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  {language === 'ar' ? (
                    <>
                      <ChevronRight className="h-4 w-4 ml-2" />
                      السابق
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </>
                  )}
                </Button>

                <div className="flex items-center space-x-2">
                  {termSections.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTermSection(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${activeTermSection === index ? 'bg-white' : 'bg-white/30'}`}
                    />
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleNextTerm}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  {language === 'ar' ? (
                    <>
                      التالي
                      <ChevronLeft className="h-4 w-4 mr-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <div className="p-6 border-t border-white/20">
                <Button 
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {language === 'ar' ? 'أوافق على الشروط' : 'I Accept the Terms'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-2">{t('traineeDashboard')}</h1>
          <p className="text-white/70">{t('welcome')}, {user?.user_metadata?.full_name}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-effect border-white/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><AlertCircle className="h-5 w-5" />{t('bookingTerms')}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <img alt="Swimming pool safety rules" className="w-full h-48 object-cover rounded-lg" src="1.jpg" />
                  {/* <p className="text-sm text-white/60 text-center">{t('poolSafety')}</p> */}
                </div>
                <div className="space-y-2">
                  <video 
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                    muted
                    autoPlay
                    loop
                  >
                    <source src="/1.mp4" type="video/mp4" />
                    {t('videoNotSupported')}
                  </video>
                  {/* <p className="text-sm text-white/60 text-center">{t('tra')}</p> */}
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTermsModal(true)}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'عرض الشروط والأحكام' : 'View Terms & Conditions'}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms} 
                  onCheckedChange={(checked) => setAcceptedTerms(checked)}
                  className="border-white/30"
                />
                <Label htmlFor="terms" className="text-white/90 cursor-pointer">
                  {language === 'ar' ? 'أوافق على الشروط والأحكام' : 'I agree to the Terms & Conditions'}
                </Label>
              </div>
              
              <Button 
                onClick={handleProceedToBooking} 
                disabled={!acceptedTerms} 
                className="w-full swimming-wave hover:scale-105 transition-transform pulse-glow"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('proceedToBooking')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-effect border-white/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Clock className="h-5 w-5" />{t('myBookings')}</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-white/90">{t('trainer')}</TableHead>
                      <TableHead className="text-white/90">{t('date')}</TableHead>
                      <TableHead className="text-white/90">{t('time')}</TableHead>
                      <TableHead className="text-white/90">{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-white/70 py-8">
                          {t('noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      myBookings.map((booking) => (
                        <TableRow key={booking.id} className="border-white/20 hover:bg-white/5">
                          <TableCell className="text-white/90">{booking.trainer_name}</TableCell>
                          <TableCell className="text-white/90">{booking.day}</TableCell>
                          <TableCell className="text-white/90">{booking.time}</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default TraineeDashboard;