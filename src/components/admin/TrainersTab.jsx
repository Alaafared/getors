import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Edit, Trash2, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const TrainersTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    level: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const { data: trainersData, error: trainersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trainer');
      
      if (trainersError) throw trainersError;
  
      const trainersWithBookings = await Promise.all(
        trainersData.map(async (trainer) => {
          const { count: totalBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact' })
            .eq('trainer_id', trainer.id);
  
          const today = new Date().toISOString().split('T')[0];
          const { count: todayBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact' })
            .eq('trainer_id', trainer.id)
            .eq('day', today);
  
          return {
            ...trainer,
            total_bookings: totalBookings || 0,
            today_bookings: todayBookings || 0
          };
        })
      );
  
      setTrainers(trainersWithBookings);
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  const filteredTrainers = trainers.filter(trainer =>
    trainer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      if (editingTrainer) {
        // First update the profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            level: formData.level
          })
          .eq('id', editingTrainer.id);
        
        if (profileError) throw profileError;
        
        // If email was changed, update auth users table
        if (formData.email !== editingTrainer.email) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            editingTrainer.id,
            { email: formData.email }
          );
          
          if (authError) throw authError;
        }
        
        toast({ 
          title: t('success'), 
          description: t('updateSuccess') 
        });
      } else {
        // Create new trainer
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              phone: formData.phone,
              level: formData.level,
              role: 'trainer'
            }
          }
        });
        
        if (authError) throw authError;
        
        toast({ 
          title: t('success'), 
          description: t('saveSuccess') 
        });
      }
      
      fetchTrainers();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      level: '',
      password: ''
    });
    setEditingTrainer(null);
  };

  const handleEdit = (trainer) => {
    setFormData({
      full_name: trainer.full_name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      level: trainer.level || '',
      password: ''
    });
    setEditingTrainer(trainer);
    setIsDialogOpen(true);
  };

  const handleDelete = async (trainerId) => {
    try {
      setProcessing(true);
      
      // Confirm deletion
      const confirmDelete = window.confirm(t('confirmDeleteTrainer'));
      if (!confirmDelete) return;
      
      // First delete from auth.users (requires admin privileges)
      const { error: authError } = await supabase.auth.admin.deleteUser(trainerId);
      if (authError) throw authError;
      
      // Then delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', trainerId);
      
      if (profileError) throw profileError;
      
      toast({
        title: t('success'),
        description: t('deleteSuccess')
      });
      
      fetchTrainers();
    } catch (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <UserCheck className="h-5 w-5" />
              {t('trainers')}
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open && !formData.full_name) {
                resetForm();
              }
              setIsDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button className="swimming-wave hover:scale-105 transition-transform">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addTrainer')}
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingTrainer ? t('edit') : t('addTrainer')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/90">{t('trainerName')}</Label>
                    <Input 
                      id="name" 
                      value={formData.full_name} 
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                      className="bg-white/10 border-white/20 text-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90">{t('email')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      className="bg-white/10 border-white/20 text-white" 
                      required 
                    />
                  </div>
                  {!editingTrainer && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/90">{t('password')}</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={formData.password} 
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        className="bg-white/10 border-white/20 text-white" 
                        required 
                        minLength="6"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/90">{t('phone')}</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      className="bg-white/10 border-white/20 text-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level" className="text-white/90">{t('level')}</Label>
                    <Input 
                      id="level" 
                      value={formData.level} 
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })} 
                      className="bg-white/10 border-white/20 text-white" 
                      required 
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={processing}>
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t('save')
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(false);
                      }} 
                      className="text-white hover:bg-white/10"
                      disabled={processing}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
          <div className="rounded-lg border border-white/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 hover:bg-white/5">
                  <TableHead className="text-white/90">{t('trainerName')}</TableHead>
                  <TableHead className="text-white/90">{t('phone')}</TableHead>
                  <TableHead className="text-white/90">{t('level')}</TableHead>
                  <TableHead className="text-white/90">{t('totalBookings')}</TableHead>
                  <TableHead className="text-white/90">{t('todayBookings')}</TableHead>
                  <TableHead className="text-white/90">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-white/70 py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('loading')}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTrainers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-white/70 py-8">
                      {t('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainers.map((trainer) => (
                    <TableRow key={trainer.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="text-white/90 font-medium">{trainer.full_name}</TableCell>
                      <TableCell className="text-white/90">{trainer.phone}</TableCell>
                      <TableCell className="text-white/90">{trainer.level}</TableCell>
                      <TableCell className="text-white/90">{trainer.total_bookings}</TableCell>
                      <TableCell className="text-white/90">{trainer.today_bookings}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(trainer)} 
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                            disabled={processing}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(trainer.id)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            disabled={processing}
                          >
                            {processing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrainersTab;