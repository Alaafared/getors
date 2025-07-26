import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const TraineesTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [trainees, setTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    level: 'Level1',
    password: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainees();
  }, []);

  const fetchTrainees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'trainee');
    if (error) {
      toast({ title: t('fetchError'), description: error.message, variant: 'destructive' });
    } else {
      setTrainees(data);
    }
    setLoading(false);
  };

  const filteredTrainees = trainees.filter(trainee =>
    trainee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelBadge = (level) => {
    const levelConfig = {
      Level1: { color: 'bg-green-500', text: t('Level1') },
      Level2: { color: 'bg-yellow-500', text: t('Level2') },
      Level3: { color: 'bg-red-500', text: t('Level3') },
      Level4: { color: 'bg-blue-500', text: t('Level4') },
      Adult: { color: 'bg-purple-500', text: t('Adult') },
      DreamTeam: { color: 'bg-orange-500', text: t('Dream Team') }
    };
    const config = levelConfig[level] || { color: 'bg-gray-500', text: level };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrainee) {
        const { error } = await supabase.from('profiles').update({
          full_name: formData.full_name,
          phone: formData.phone,
          level: formData.level
        }).eq('id', editingTrainee.id);
        
        if(error) {
          toast({ title: t('updateError'), description: error.message, variant: 'destructive' });
        } else {
          toast({ title: t('updateSuccess') });
          fetchTrainees();
          resetForm();
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              phone: formData.phone,
              level: formData.level,
              role: 'student'
            }
          }
        });
        
        if (authError) {
          toast({ title: t('createError'), description: authError.message, variant: 'destructive' });
        } else {
          toast({ title: t('saveSuccess') });
          fetchTrainees();
          resetForm();
        }
      }
    } catch (err) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', phone: '', level: 'Level1', password: '' });
    setEditingTrainee(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (trainee) => {
    setFormData({
      full_name: trainee.full_name || '',
      email: trainee.email || '',
      phone: trainee.phone || '',
      level: trainee.level || 'Level1',
      password: ''
    });
    setEditingTrainee(trainee);
    setIsDialogOpen(true);
  };

  const handleDelete = async (traineeId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        // حذف من جدول profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', traineeId);
        
        if (profileError) throw profileError;

        // حذف حساب المصادقة (يتطلب صلاحيات مشرف)
        const { error: authError } = await supabase.auth.admin.deleteUser(traineeId);
        
        if (authError) throw authError;

        toast({ title: t('deleteSuccess') });
        fetchTrainees();
      } catch (error) {
        toast({ 
          title: t('deleteError'), 
          description: error.message, 
          variant: 'destructive' 
        });
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />{t('trainees')}
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button className="swimming-wave hover:scale-105 transition-transform">
                  <Plus className="h-4 w-4 mr-2" />{t('addTrainee')}
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingTrainee ? t('edit') : t('addTrainee')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/90">{t('traineeName')}</Label>
                    <Input 
                      id="name" 
                      value={formData.full_name} 
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                      className="bg-white/10 border-white/20 text-white" 
                      required 
                    />
                  </div>
                  {!editingTrainee && (
                    <>
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
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/90">{t('password')}</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          value={formData.password} 
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                          className="bg-white/10 border-white/20 text-white" 
                          required 
                        />
                      </div>
                    </>
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
                    <Select 
                      value={formData.level} 
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20">
                        <SelectItem value="Level1" className="text-white">{t('Level1')}</SelectItem>
                        <SelectItem value="Level2" className="text-white">{t('Level2')}</SelectItem>
                        <SelectItem value="Level3" className="text-white">{t('Level3')}</SelectItem>
                        <SelectItem value="Level4" className="text-white">{t('Level4')}</SelectItem>
                        <SelectItem value="Adult" className="text-white">{t('Adult')}</SelectItem>
                        <SelectItem value="DreamTeam" className="text-white">{t('Dream Team')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="swimming-wave flex-1">{t('save')}</Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={resetForm} 
                      className="text-white hover:bg-white/10"
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
                  <TableHead className="text-white/90">{t('traineeName')}</TableHead>
                  <TableHead className="text-white/90">{t('phone')}</TableHead>
                  <TableHead className="text-white/90">{t('level')}</TableHead>
                  <TableHead className="text-white/90">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/70 py-8">
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredTrainees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/70 py-8">
                      {t('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainees.map((trainee) => (
                    <TableRow key={trainee.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="text-white/90 font-medium">{trainee.full_name}</TableCell>
                      <TableCell className="text-white/90">{trainee.phone}</TableCell>
                      <TableCell>{getLevelBadge(trainee.level)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(trainee)} 
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(trainee.id)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
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

export default TraineesTab;