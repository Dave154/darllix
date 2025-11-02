import { useState, useEffect } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import DashboardLayout from '@/components/dashboardComponents/dashboardLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '../../../hooks/useUser';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import Loader from '../../../components/dashboardComponents/loader';
import { useRouter } from 'next/router';

export default function ProfilePage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [creating,setCreating]= useState(false)

  // banks state
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);

// initialization flag
const [initialized, setInitialized] = useState(false);

useEffect(() => {
  console.log(user)
  if (!user?.profile) {
    setCreating(true)
    setEditing(true)
    setProfile({})
    
  }else{
    setEditing(false)
    setCreating(false)
  }


  if (initialized) return;
  if (editing) return;

  setProfile(user.profile);
  setForm(user.profile || {});
  console.log(user.profile)
  if(user.profile) setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.profile]);

  // fetch banks from server route
  useEffect(() => {
    const fetchBanks = async () => {
      setBanksLoading(true);
      try {
        const res = await fetch('/api/banks');
        if (!res.ok) throw new Error('Failed to fetch banks');
        const data = await res.json();
        
        setBanks(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error('Error fetching banks', err);
        toast.error('Could not load banks');
      } finally {
        setBanksLoading(false);
      }
    };

    fetchBanks();
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (
      (parts[0][0] || '').toUpperCase() + (parts[parts.length - 1][0] || '').toUpperCase()
    );
  };

const handleChange = (e) => {
  const { name, value } = e.target;
  if(name === "account_number" && value.trim().length === 10){
    fetchAccName(value)
  }
  setForm((prev) => ({ ...prev, [name]: value }));
};

  const handleBankSelect = (e) => {
    const selectedIndex = e.target.selectedIndex;
    const option = e.target.options[selectedIndex];
    const code = option?.getAttribute('data-code') || '';
    setForm({ ...form, bank_name: e.target.value, bank_code: code });
  };

  const router = useRouter()
  const onSubmit = async () => {
    
      if (!user.user || !user.user.id) {
        console.error("User or user ID not available. Cannot submit profile.");
        return; 
      }
      if(!form.full_name){
        toast.error("Enter Full name")
        return;
      }
       if(form.account_number.length !==10 && !form.account_name ){
        toast.error("Enter a valid account number")
        return;
      }
        if(!form.bank_name){
        toast.error("Choose a bank")
        return;
      }
      try {
          setLoading(true);
         
          
            const payload ={
          id: user.user.id,
          email: user.user.user_metadata.email,
          full_name: form.full_name,
          account_name: form.account_name,
          bank_name: form.bank_name,
          account_number: form.account_number || 0,
          phone: form.phone ,
          bank_code:form.bank_code
       
            }



          const { error } = await supabase.from("profiles").insert([
            payload
          ]);
          
          if (error) throw error;
          setCreating(false)
          toast.success("Profile Created Successfully")

          router.push("/dashboard");

        } catch (err) {
          console.error(err);
          toast.error("Failed to create profile")
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {

    if (creating){
      onSubmit()
      return;
    }
    if (!user.user || !user.user.id) {
      console.error('User or user ID not available. Cannot update profile.');
      return;
    }

    try {
      setLoading(true);
        if(!form.full_name){
          toast.error('Enter Full name')
          return;
        }
      
       if(form.account_number.length !==10 && !form.account_name ){
        toast.error("Enter a valid account number")
        return;
      }
        if(!form.bank_name){
        toast.error("Choose a bank")
        return;
      }
      const updatePayload = { ...form };
      console.log(form)
      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Error updating profile.');
    } finally {
      setLoading(false);
    }
  };
  
  const [fetchingAccount, setFetchingAccount] = useState(false)
  async function fetchAccName (number){
    try{

      if(!number && !bank_code) return;
      setFetchingAccount(true)
        const res = await fetch(`/api/banks/resolve?account_number=${number}&bank_code=${form.bank_code}`);
        const data = await res.json();
        if(data.error){
             toast.error(data.details.message)
              setForm({ ...form, account_name:''});   
             return;

        }
        setForm({ ...form, account_name:data.data.account_name, account_number:data.data.account_number});    
    }
    catch(error){
      toast.error(error)
    }finally{
      setFetchingAccount(false)
    }
  }

  if (!profile  && !creating) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      {loading && <Loader />}

      <DashboardLayout>
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black">My Profile</h1>
            {!editing ? (
              <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setForm(profile);
                    setEditing(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <Avatar className="w-24 h-24 text-2xl font-bold bg-black text-white shadow-md">
              <AvatarFallback className="bg-black">{getInitials(profile?.full_name)}</AvatarFallback>
            </Avatar>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-black">
            <div>
              <label className="text-sm font-medium text-black">Full Name</label>
              <Input name="full_name" placeholder="Enter your Full Name" value={form.full_name || ''} onChange={handleChange} disabled={!editing} className="h-14 text-base bg-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-black">Email</label>
              <Input name="email"  value={form.email || ''} onChange={handleChange} disabled className="h-14 text-base bg-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-black">Phone</label>
              <Input name="phone" placeholder="Enter your phone number" value={form.phone || ''} onChange={handleChange} disabled={!editing} className="h-14 text-base bg-white" />
            </div>

            <div>
              <label className="text-sm font-medium text-black ">Bank Name</label>

              {banksLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <select
                  name="bank_name"
                  value={form.bank_name || ''}
                  onChange={handleBankSelect}
                  disabled={!editing}
                  className="h-14 w-full rounded border px-3 text-base"
                >
                  <option value="">Select Bank</option>
                  {banks.map((b,i) => (
                    <option key={b.code + i} value={b.name} data-code={b.code}>
                      {b.name} 
                    </option>
                  ))}
                </select>
              )}
            </div>
              {
                form.bank_name &&
                <>
            <div>
              <label className="text-sm font-medium text-black">Account Number</label>
              <Input name="account_number"  pattern="[0-9]*"
                maxLength={10} placeholder="Enter your account number" value={form.account_number || ''} onChange={handleChange} disabled={!editing} className="h-14 bg-white text-base" />
              <p className="text-color2 ml-2 text-semibold text-sm">{fetchingAccount ? "Checking" :form.account_name}</p>
            </div>
                </>
            
              }

            <div>
              <label className="text-sm font-medium text-black">Address</label>
              <Input name="address" placeholder="Enter your residential address" value={form.address || ''} onChange={handleChange} disabled={!editing} className="h-14 text-base bg-white" />
            </div>

          </div>
        </div>
      </DashboardLayout>
    </>
  );
}



