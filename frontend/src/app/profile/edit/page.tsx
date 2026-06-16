'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { Loader2, Plus, Trash2, Save, ChevronLeft, Camera, Upload, FileText } from 'lucide-react';
import { profileAPI, uploadAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials, getPhotoUrl, resizeImageToDataUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

const SPORTS = [
  'Cricket', 'Football', 'Basketball', 'Kabaddi', 'Athletics', 'Tennis', 'Badminton',
  'Hockey', 'Wrestling', 'Boxing', 'Volleyball', 'Swimming', 'Cycling', 'Archery',
  'Shooting', 'Weightlifting', 'Gymnastics', 'Judo', 'Table Tennis', 'Kho Kho',
  'Carrom', 'Chess', 'Squash', 'Golf', 'Rugby', 'Baseball', 'Softball', 'Handball',
  'Water Polo', 'Diving', 'Rowing', 'Kayaking', 'Canoeing', 'Sailing', 'Surfing',
  'Skiing', 'Snowboarding', 'Ice Hockey', 'Figure Skating', 'Speed Skating',
  'Equestrian', 'Fencing', 'Taekwondo', 'Karate', 'Muay Thai', 'MMA', 'Kickboxing',
  'Futsal', 'Beach Volleyball', 'Beach Football', 'Sepak Takraw', 'Polo',
  'Billiards', 'Snooker', 'Darts', 'Esports', 'Triathlon', 'Pentathlon',
  'Marathon', 'CrossFit', 'Powerlifting', 'Bodybuilding', 'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// Cities by state — used for the City dropdown (no manual typing)
const STATE_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Anantapur', 'Kadapa'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezu', 'Ziro'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Bihar Sharif', 'Arrah'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Raigarh', 'Jagdalpur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Bharuch', 'Mehsana', 'Gandhidham'],
  'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Kullu', 'Bilaspur', 'Hamirpur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kottayam'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Nanded'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar', 'Sri Ganganagar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul', 'Thanjavur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Secunderabad'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Saharanpur', 'Jhansi', 'Mathura'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur', 'Darjeeling'],
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Pitampura', 'Saket', 'Karol Bagh'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'],
};

// City options for a state; keeps an already-set/auto-filled city in the list
const cityOptions = (state: string, current?: string): string[] => {
  const list = STATE_CITIES[state] || [];
  return current && !list.includes(current) ? [current, ...list] : list;
};

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' }, { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' }, { code: '+61', label: '🇦🇺 +61' },
  { code: '+971', label: '🇦🇪 +971' }, { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' }, { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' }, { code: '+81', label: '🇯🇵 +81' },
  { code: '+86', label: '🇨🇳 +86' }, { code: '+92', label: '🇵🇰 +92' },
  { code: '+880', label: '🇧🇩 +880' }, { code: '+94', label: '🇱🇰 +94' },
  { code: '+977', label: '🇳🇵 +977' }, { code: '+27', label: '🇿🇦 +27' },
];

// Year options for dropdowns (current year down to 1950)
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);
// Future-inclusive years (for expected graduation / end year)
const YEARS_WITH_FUTURE = Array.from({ length: CURRENT_YEAR + 6 - 1950 + 1 }, (_, i) => CURRENT_YEAR + 6 - i);

// Major Indian cities — used as a type-or-select datalist so users don't have to type freehand
const MAJOR_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
  'Amritsar', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior',
  'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati',
  'Mysuru', 'Noida', 'Gurugram', 'Dehradun', 'Thiruvananthapuram', 'Kochi',
];

// Positions/roles per sport — used to offer a dropdown in Clubs & Teams (helps filtering).
// Sports not listed here fall back to a free-text input.
const POSITIONS_BY_SPORT: Record<string, string[]> = {
  Cricket: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'Captain'],
  Football: ['Goalkeeper', 'Defender', 'Right Back', 'Left Back', 'Centre Back', 'Midfielder', 'Winger', 'Striker', 'Forward'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Centre'],
  Hockey: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Volleyball: ['Setter', 'Outside Hitter', 'Opposite Hitter', 'Middle Blocker', 'Libero'],
  Kabaddi: ['Raider', 'Defender', 'All-Rounder', 'Corner', 'Cover'],
  Hockey5s: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Handball: ['Goalkeeper', 'Wing', 'Back', 'Pivot', 'Centre'],
  Rugby: ['Prop', 'Hooker', 'Lock', 'Flanker', 'Scrum-Half', 'Fly-Half', 'Centre', 'Wing', 'Full-Back'],
  Baseball: ['Pitcher', 'Catcher', 'Infielder', 'Outfielder'],
  'Water Polo': ['Goalkeeper', 'Driver', 'Centre Forward', 'Centre Back', 'Wing'],
};

export default function ProfileEditPage() {
  const { user, fetchMe } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Athlete fields
  const [athleteForm, setAthleteForm] = useState({
    fullName: '',
    username: '',
    email: '',
    countryCode: '+91',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bio: '', // tagline
    aboutBio: '', // about career story
    primarySport: '',
    secondarySports: [] as string[],
    experienceLevel: '',
    availabilityStatus: 'open_for_trials',
    isParaAthlete: false,
    location: { 
      address: '',
      pincode: '',
      city: '', 
      state: '', 
      country: 'India' 
    },
    height: '',
    heightUnit: 'cm',
    weight: '',
    dominantHand: '',
    yearsOfExperience: '',
    strengths: '',
    photo: '',
    socialLinks: { 
      instagram: '', 
      youtube: '', 
      twitter: '', 
      linkedin: '',
      whatsapp: ''
    },
    careerHighlights: '',
    goalsAspirations: '',
    featuredVideoUrl: '',
    institutionName: '',
    currentEducation: '',
    profileUrl: '',
  });

  const [achievements, setAchievements] = useState<{ title: string; year: string; category: string; description: string; document?: string }[]>([]);
  const [tournaments, setTournaments] = useState<{ name: string; startDate: string; endDate: string; location: string; description: string }[]>([]);
  const [education, setEducation] = useState<{ institution: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string; description: string; isCurrent?: boolean }[]>([]);
  const [playingHistory, setPlayingHistory] = useState<{ organization: string; role: string; startDate: string; endDate: string; isCurrent: boolean; description: string }[]>([]);
  const [highlights, setHighlights] = useState<{ title: string; url: string; platform: string }[]>([]);

  // Coach fields
  const [coachForm, setCoachForm] = useState({
    fullName: '', bio: '', aboutBio: '', coachingPhilosophy: '', photo: '', gender: '', dateOfBirth: '',
    email: '', countryCode: '+91', phone: '',
    experienceYears: 0,
    sportsCoached: [] as string[],
    location: { city: '', state: '', country: 'India' },
    availabilityStatus: 'full_time', hourlyRate: '',
    socialLinks: { instagram: '', youtube: '', twitter: '', linkedin: '' },
    profileUrl: '',
  });
  const [coachQualifications, setCoachQualifications] = useState<{ name: string; issuer: string; year: string; document?: string }[]>([]);
  const [coachExperience, setCoachExperience] = useState<{ organization: string; role: string; startDate: string; endDate: string; current: boolean }[]>([]);
  const [coachEducation, setCoachEducation] = useState<{ institution: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string; description: string; isCurrent?: boolean }[]>([]);
  const [coachPlayersTrained, setCoachPlayersTrained] = useState<{ name: string; result: string; description: string; year: string }[]>([]);
  const [coachAgeGroups, setCoachAgeGroups] = useState<string[]>([]);

  // Organization fields
  const [orgForm, setOrgForm] = useState({
    name: '', description: '', logo: '', website: '', phone: '', email: '',
    alternatePhone: '', showPhone: true, showAddress: false,
    type: '', yearEstablished: '',
    city: '', state: '', pincode: '', address: '',
    sportsOffered: [] as string[],
  });

  useEffect(() => { loadProfile(); }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (user.role === 'athlete') {
        const res = await profileAPI.getMyAthleteProfile();
        const p = res.data.data?.profile || res.data.data || {};
        setAthleteForm({
          fullName: p.fullName || '',
          username: p.username || '',
          email: p.email || user.email || '',
          countryCode: p.countryCode || '+91',
          phone: p.phone || '',
          dateOfBirth: p.dob ? p.dob.split('T')[0] : '',
          gender: p.gender || '',
          bio: p.tagline || '',
          aboutBio: p.aboutBio || '',
          primarySport: p.primarySport || '',
          secondarySports: p.secondarySports || [],
          experienceLevel: p.experienceLevel || '',
          availabilityStatus: p.availabilityStatus || 'open_for_trials',
          isParaAthlete: p.isParaAthlete || false,
          location: p.location || { address: '', pincode: '', city: '', state: '', country: 'India' },
          height: p.height || '',
          heightUnit: p.heightUnit || 'cm',
          weight: p.weight || '',
          dominantHand: p.dominantSide || '',
          yearsOfExperience: p.yearsOfExperience || '',
          strengths: p.strengths || '',
          photo: p.photo || '',
          socialLinks: p.socialLinks || { instagram: '', youtube: '', twitter: '', linkedin: '', whatsapp: '' },
          careerHighlights: p.careerHighlights || '',
          goalsAspirations: p.goalsAspirations || '',
          featuredVideoUrl: p.featuredVideoUrl || '',
          institutionName: p.institutionName || '',
          currentEducation: p.currentEducation || '',
          profileUrl: p.profileUrl || '',
        });
        setAchievements(p.achievements || []);
        setTournaments(
          (p.tournaments || []).map((t: any) => ({
            ...t,
            startDate: t.startDate ? String(t.startDate).split('T')[0] : '',
            endDate: t.endDate ? String(t.endDate).split('T')[0] : '',
          }))
        );
        setEducation(p.education || []);
        setPlayingHistory(
          (p.playingHistory || []).map((h: any) => ({
            ...h,
            isCurrent: h.current,
            startDate: h.startDate ? String(h.startDate).split('T')[0] : '',
            endDate: h.endDate ? String(h.endDate).split('T')[0] : '',
          }))
        );
        setHighlights(p.media?.filter((m: any) => m.type === 'video').map((m: any) => ({ title: m.title, url: m.url, platform: m.platform })) || []);
      } else if (user.role === 'coach') {
        const res = await profileAPI.getMyCoachProfile();
        const p = res.data.data?.profile || res.data.data || {};
        setCoachForm({
          fullName: p.fullName || '', bio: p.bio || '', aboutBio: p.aboutBio || '',
          coachingPhilosophy: p.coachingPhilosophy || '',
          photo: p.photo || '', gender: p.gender || '', dateOfBirth: p.dob ? String(p.dob).split('T')[0] : '',
          email: p.email || user.email || '', countryCode: p.countryCode || '+91', phone: p.phone || '',
          experienceYears: p.experienceYears || 0,
          sportsCoached: p.sportsSpecialization || [],
          location: p.location || { city: '', state: '', country: 'India' },
          availabilityStatus: ['looking', 'open', 'not_looking'].includes(p.availability) ? p.availability : 'open',
          hourlyRate: p.hourlyRate || '',
          socialLinks: p.socialLinks || { instagram: '', youtube: '', twitter: '', linkedin: '' },
          profileUrl: p.profileUrl || '',
        });
        setCoachQualifications((p.qualifications || []).map((q: { name?: string; issuer?: string; year?: number; document?: string }) => ({ name: q.name || '', issuer: q.issuer || '', year: q.year?.toString() || '', document: q.document || '' })));
        setCoachExperience((p.experience || []).map((e: { organization?: string; role?: string; startDate?: string; endDate?: string; current?: boolean }) => ({ organization: e.organization || '', role: e.role || '', startDate: e.startDate ? String(e.startDate).split('T')[0] : '', endDate: e.endDate ? String(e.endDate).split('T')[0] : '', current: e.current || false })));
        setCoachEducation((p.education || []).map((e: { institution?: string; degree?: string; fieldOfStudy?: string; startYear?: number; endYear?: number; description?: string; isCurrent?: boolean }) => ({ institution: e.institution || '', degree: e.degree || '', fieldOfStudy: e.fieldOfStudy || '', startYear: e.startYear?.toString() || '', endYear: e.endYear?.toString() || '', description: e.description || '', isCurrent: e.isCurrent || false })));
        // Migrate legacy tournamentResults into Players/Team Trained if present
        setCoachPlayersTrained([
          ...(p.playersTrained || []).map((t: { name?: string; result?: string; description?: string; year?: number }) => ({ name: t.name || '', result: t.result || '', description: t.description || '', year: t.year?.toString() || '' })),
          ...(p.tournamentResults || []).map((t: { team?: string; tournament?: string; result?: string; year?: number }) => ({ name: t.team || t.tournament || '', result: t.result || '', description: '', year: t.year?.toString() || '' })),
        ]);
        setCoachAgeGroups(p.ageGroupsCoached || []);
      } else if (user.role === 'organization') {
        const res = await profileAPI.getMyOrganizationProfile();
        const p = res.data.data?.profile || res.data.data || {};
        setOrgForm({
          name: p.name || '', description: p.description || '', logo: p.logo || '',
          website: p.website || '', phone: p.contact?.phone || p.phone || '',
          email: p.contact?.email || p.email || user.email || '',
          alternatePhone: p.alternatePhone || '', showPhone: p.showPhone !== false,
          showAddress: p.showAddress === true,
          type: p.type || '', yearEstablished: p.yearEstablished || '',
          city: p.city || '', state: p.state || '', pincode: p.pincode || '',
          address: typeof p.address === 'string' ? p.address : '',
          sportsOffered: p.sportsOffered || [],
        });
      }
    } catch {
      // Profile might not exist yet — still prefill email from the logged-in account
      if (user.email) {
        if (user.role === 'athlete') setAthleteForm(prev => ({ ...prev, email: prev.email || user.email }));
        else if (user.role === 'coach') setCoachForm(prev => ({ ...prev, email: prev.email || user.email }));
        else if (user.role === 'organization') setOrgForm(prev => ({ ...prev, email: prev.email || user.email }));
      }
    }
    setIsLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Processing photo...');
    try {
      // Resize in the browser to a small square and store inline in the DB.
      // This avoids serverless disk storage (which doesn't persist) entirely.
      const url = await resizeImageToDataUrl(file, 400, 0.8);

      if (user?.role === 'athlete') {
        setAthleteForm({ ...athleteForm, photo: url });
      } else if (user?.role === 'coach') {
        setCoachForm({ ...coachForm, photo: url });
      } else if (user?.role === 'organization') {
        setOrgForm({ ...orgForm, logo: url });
      }

      toast.success('Photo ready — remember to Save', { id: toastId });
    } catch {
      toast.error('Failed to process photo', { id: toastId });
    }
  };

  // Upload a certificate/proof document (image or PDF) and return its URL via callback
  const handleCertificateUpload = async (file: File | undefined, onDone: (url: string) => void) => {
    if (!file) return;
    const toastId = toast.loading('Uploading certificate...');
    try {
      const res = await uploadAPI.uploadDocument(file);
      onDone(res.data.data.url);
      toast.success('Certificate uploaded!', { id: toastId });
    } catch {
      toast.error('Upload failed — use JPG, PNG, or PDF (max 5MB)', { id: toastId });
    }
  };

  // advance=true → after saving, move to the next tab (stay on the editor).
  // advance=false → after saving, go to the profile view page.
  const handleSave = async (advance = false) => {
    setIsSaving(true);
    try {
      if (user?.role === 'athlete') {
        const media = highlights.map(h => ({ type: 'video', url: h.url, title: h.title, platform: h.platform }));
        await profileAPI.updateAthleteProfile({
          ...athleteForm,
          dob: athleteForm.dateOfBirth || undefined,
          tagline: athleteForm.bio,
          dominantSide: athleteForm.dominantHand,
          achievements,
          tournaments,
          education,
          playingHistory: playingHistory.map(h => ({ ...h, current: h.isCurrent })),
          media
        });
      } else if (user?.role === 'coach') {
        await profileAPI.updateCoachProfile({
          ...coachForm,
          dob: coachForm.dateOfBirth || undefined,
          sportsSpecialization: coachForm.sportsCoached,
          availability: coachForm.availabilityStatus,
          qualifications: coachQualifications.map((q) => ({ ...q, year: q.year ? parseInt(q.year) : undefined })),
          experience: coachExperience,
          education: coachEducation.map((e) => ({ ...e, startYear: e.startYear ? parseInt(e.startYear) : undefined, endYear: e.endYear ? parseInt(e.endYear) : undefined })),
          playersTrained: coachPlayersTrained.map((t) => ({ ...t, year: t.year ? parseInt(t.year) : undefined })),
          tournamentResults: [],
          ageGroupsCoached: coachAgeGroups,
        });
      } else if (user?.role === 'organization') {
        await profileAPI.updateOrganizationProfile({
          ...orgForm,
          contact: { phone: orgForm.phone, email: orgForm.email, website: orgForm.website },
        });
      }
      await fetchMe();

      const tabIds = tabs.map((t) => t.id);
      const idx = tabIds.indexOf(activeTab);
      if (advance && idx < tabIds.length - 1) {
        setActiveTab(tabIds[idx + 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success('Saved! Next section →');
      } else {
        toast.success('Profile saved!');
        router.push('/profile');
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to save';
      toast.error(msg);
    }
    setIsSaving(false);
  };

  const toggleSport = (s: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(s) ? list.filter((x) => x !== s) : [...list, s]);
  };

  const fetchAddressFromPincode = async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].Status === 'Success') {
        const { District, State } = data[0].PostOffice[0];
        setAthleteForm(prev => ({
          ...prev,
          location: { ...prev.location, city: District, state: State }
        }));
      }
    } catch (error) {
      console.error('Pincode fetch error:', error);
    }
  };

  if (isLoading) return (
    <AuthGuard><div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand" /></div></AuthGuard>
  );

  const tabs = user?.role === 'athlete'
    ? [
        { id: 'basic', label: 'Basic Info' },
        { id: 'physical', label: 'Physical Stats' },
        { id: 'education', label: 'Education' },
        { id: 'clubs', label: 'Clubs & Teams' },
        { id: 'achievements', label: 'Awards' },
        { id: 'tournaments', label: 'Tournaments' },
        { id: 'highlights', label: 'Videos' },
        { id: 'contact', label: 'Contact' }
      ]
    : user?.role === 'coach'
    ? [
        { id: 'basic', label: 'Basic Info' },
        { id: 'education', label: 'Education' },
        { id: 'certifications', label: 'Certifications' },
        { id: 'experience', label: 'Experience' },
        { id: 'sports', label: 'Sports & Skills' },
        { id: 'tournaments', label: 'Players/Team Trained' },
        { id: 'social', label: 'Social' },
      ]
    : [{ id: 'basic', label: 'Organization Info' }, { id: 'sports', label: 'Sports Offered' }];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <Navbar />
        {/* Shared city suggestions — type or pick */}
        <datalist id="cities-list">
          {MAJOR_CITIES.map((c) => <option key={c} value={c} />)}
        </datalist>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-sm text-gray-500">Only <span className="font-medium text-gray-700">Basic Info</span> is required — everything else is optional but helps you get discovered.</p>
              </div>
            </div>
            <button onClick={() => handleSave(false)} disabled={isSaving} className="btn-primary flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          {/* Step progress */}
          {(() => {
            const stepIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));
            const stepNum = stepIndex + 1;
            const isRequired = tabs[stepIndex]?.id === 'basic';
            return (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-600">
                    Step {stepNum} of {tabs.length}: <span className="text-gray-900">{tabs[stepIndex]?.label}</span>
                    {isRequired
                      ? <span className="ml-2 text-[10px] font-bold text-brand uppercase">Required</span>
                      : <span className="ml-2 text-[10px] font-medium text-gray-400 uppercase">Optional</span>}
                  </p>
                  <span className="text-xs text-gray-400">{Math.round((stepNum / tabs.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${(stepNum / tabs.length) * 100}%` }} />
                </div>
              </div>
            );
          })()}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {/* ── PHOTO UPLOAD (Common) ── */}
            {activeTab === 'basic' && (
              <div className="card p-6 flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-brand text-white flex items-center justify-center text-4xl font-bold overflow-hidden border-4 border-white shadow-md">
                    {user?.role === 'organization' ? (
                      getPhotoUrl(orgForm.logo) ? <img src={getPhotoUrl(orgForm.logo)!} className="w-full h-full object-cover" alt="" /> : getInitials(orgForm.name || 'O')
                    ) : (
                      getPhotoUrl(user?.role === 'athlete' ? athleteForm.photo : coachForm.photo) ? 
                        <img src={getPhotoUrl(user?.role === 'athlete' ? athleteForm.photo : coachForm.photo)!} className="w-full h-full object-cover" alt="" /> : 
                        getInitials((user?.role === 'athlete' ? athleteForm.fullName : coachForm.fullName) || user?.email?.split('@')[0] || 'U')
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-8 h-8" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">Profile Picture</h3>
                  <p className="text-xs text-gray-500 mb-3">JPG, PNG or GIF. Max 5MB</p>
                  <label className="btn-secondary px-4 py-1.5 text-xs flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3 h-3" /> Change Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
            )}

            {/* ── ATHLETE TABS ── */}
            {user?.role === 'athlete' && activeTab === 'basic' && (
              <div className="card p-6 space-y-6">
                <h2 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input className="input-field" value={athleteForm.fullName} onChange={(e) => setAthleteForm({ ...athleteForm, fullName: e.target.value })} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input className="input-field" value={athleteForm.username} onChange={(e) => setAthleteForm({ ...athleteForm, username: e.target.value })} placeholder="username" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                      <input type="email" className="input-field" value={athleteForm.email} onChange={(e) => setAthleteForm({ ...athleteForm, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                      <div className="flex gap-2">
                        <select className="input-field w-32" value={athleteForm.countryCode} onChange={(e) => setAthleteForm({ ...athleteForm, countryCode: e.target.value })}>
                          {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                        <input type="tel" className="input-field flex-1" value={athleteForm.phone} onChange={(e) => setAthleteForm({ ...athleteForm, phone: e.target.value })} placeholder="98765 43210" />
                      </div>
                    </div>
                  </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input className="input-field" value={athleteForm.location.address} onChange={(e) => setAthleteForm({ ...athleteForm, location: { ...athleteForm.location, address: e.target.value } })} placeholder="Flat No, Building, Street" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input className="input-field" maxLength={6} value={athleteForm.location.pincode} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setAthleteForm({ ...athleteForm, location: { ...athleteForm.location, pincode: val } });
                          if (val.length === 6) fetchAddressFromPincode(val);
                        }} placeholder="110001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select className="input-field" value={athleteForm.location.state} onChange={(e) => setAthleteForm({ ...athleteForm, location: { ...athleteForm.location, state: e.target.value, city: '' } })}>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <select className="input-field" value={athleteForm.location.city} disabled={!athleteForm.location.state} onChange={(e) => setAthleteForm({ ...athleteForm, location: { ...athleteForm.location, city: e.target.value } })}>
                        <option value="">{athleteForm.location.state ? 'Select City' : 'Select state first'}</option>
                        {cityOptions(athleteForm.location.state, athleteForm.location.city).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input type="date" className="input-field" value={athleteForm.dateOfBirth} onChange={(e) => setAthleteForm({ ...athleteForm, dateOfBirth: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select className="input-field" value={athleteForm.gender} onChange={(e) => setAthleteForm({ ...athleteForm, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Tagline</label>
                  <input className="input-field" value={athleteForm.bio} onChange={(e) => setAthleteForm({ ...athleteForm, bio: e.target.value })} placeholder="e.g. Professional Footballer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About / Career Story</label>
                  <textarea rows={4} className="input-field" value={athleteForm.aboutBio} onChange={(e) => setAthleteForm({ ...athleteForm, aboutBio: e.target.value })} placeholder="Tell scouts about your journey..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Career Highlights</label>
                  <textarea rows={2} className="input-field" value={athleteForm.careerHighlights} onChange={(e) => setAthleteForm({ ...athleteForm, careerHighlights: e.target.value })} placeholder="Major awards, medals..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goals & Aspirations</label>
                  <textarea rows={2} className="input-field" value={athleteForm.goalsAspirations} onChange={(e) => setAthleteForm({ ...athleteForm, goalsAspirations: e.target.value })} placeholder="Your future goals..." />
                </div>
              </div>
            )}

            {user?.role === 'athlete' && activeTab === 'physical' && (
              <div className="card p-6 space-y-6">
                <h2 className="font-semibold text-gray-900 border-b pb-2">Physical Stats & Sport</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Sport *</label>
                    <select className="input-field" value={athleteForm.primarySport} onChange={(e) => setAthleteForm({ ...athleteForm, primarySport: e.target.value })}>
                      <option value="">Select</option>
                      {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                    <select className="input-field" value={athleteForm.experienceLevel} onChange={(e) => setAthleteForm({ ...athleteForm, experienceLevel: e.target.value })}>
                      <option value="">Select</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Position / Role</label>
                    <input className="input-field" value={athleteForm.strengths} onChange={(e) => setAthleteForm({ ...athleteForm, strengths: e.target.value })} placeholder="e.g. Striker, Bowler" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input type="number" className="input-field" value={athleteForm.yearsOfExperience} onChange={(e) => setAthleteForm({ ...athleteForm, yearsOfExperience: e.target.value })} placeholder="5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dominant Hand / Side</label>
                    <select className="input-field" value={athleteForm.dominantHand} onChange={(e) => setAthleteForm({ ...athleteForm, dominantHand: e.target.value })}>
                      <option value="">Select</option>
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                      <option value="ambidextrous">Ambidextrous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability Status</label>
                    <select className="input-field" value={athleteForm.availabilityStatus} onChange={(e) => setAthleteForm({ ...athleteForm, availabilityStatus: e.target.value })}>
                      <option value="open_for_trials">Open for Trials</option>
                      <option value="not_available">Not Available</option>
                      <option value="signed">Signed / Committed</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <div className="flex gap-2">
                      <input type="number" step="0.01" className="input-field flex-1" value={athleteForm.height} onChange={(e) => setAthleteForm({ ...athleteForm, height: e.target.value })} placeholder="175" />
                      <select className="input-field w-24" value={athleteForm.heightUnit} onChange={(e) => setAthleteForm({ ...athleteForm, heightUnit: e.target.value as any })}>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                        <option value="ft">ft</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input type="number" className="input-field" value={athleteForm.weight} onChange={(e) => setAthleteForm({ ...athleteForm, weight: e.target.value })} placeholder="70" />
                  </div>
                  <div className="sm:col-span-2 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={athleteForm.isParaAthlete} onChange={(e) => setAthleteForm({ ...athleteForm, isParaAthlete: e.target.checked })} className="rounded text-brand" />
                      I am a Para-Athlete
                    </label>
                    {athleteForm.isParaAthlete && (
                      <input className="input-field" value={athleteForm.experienceLevel} onChange={(e) => setAthleteForm({ ...athleteForm, experienceLevel: e.target.value })} placeholder="Para Classification (e.g. T44, F56)" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Sports Played</label>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSport(s, athleteForm.secondarySports, (v) => setAthleteForm({ ...athleteForm, secondarySports: v }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${athleteForm.secondarySports.includes(s) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-300 hover:border-brand'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {user?.role === 'athlete' && activeTab === 'education' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Education Background</h2>
                  <button onClick={() => setEducation([...education, { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', description: '' }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {education.map((e, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setEducation(education.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="input-field" placeholder="School / University" value={e.institution} onChange={(ev) => { const c = [...education]; c[i].institution = ev.target.value; setEducation(c); }} />
                      <input className="input-field" placeholder="Degree" value={e.degree} onChange={(ev) => { const c = [...education]; c[i].degree = ev.target.value; setEducation(c); }} />
                      <input className="input-field" placeholder="Field of Study" value={e.fieldOfStudy} onChange={(ev) => { const c = [...education]; c[i].fieldOfStudy = ev.target.value; setEducation(c); }} />
                      <div className="flex gap-2 items-center">
                        <select className="input-field" value={e.startYear} onChange={(ev) => { const c = [...education]; c[i].startYear = ev.target.value; setEducation(c); }}>
                          <option value="">Start Year</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {!e.isCurrent && (
                          <select className="input-field" value={e.endYear} onChange={(ev) => { const c = [...education]; c[i].endYear = ev.target.value; setEducation(c); }}>
                            <option value="">End Year</option>
                            {YEARS_WITH_FUTURE.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={!!e.isCurrent} onChange={(ev) => { const c = [...education]; c[i].isCurrent = ev.target.checked; if (ev.target.checked) c[i].endYear = ''; setEducation(c); }} className="rounded text-brand" />
                      Currently Studying
                    </label>
                    <textarea rows={2} className="input-field" placeholder="Description / Academic achievements" value={e.description} onChange={(ev) => { const c = [...education]; c[i].description = ev.target.value; setEducation(c); }} />
                  </div>
                ))}
                {education.length === 0 && <p className="text-center text-gray-500 py-4">No education details added.</p>}
              </div>
            )}

            {user?.role === 'athlete' && activeTab === 'clubs' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Clubs & Teams History</h2>
                  <button onClick={() => setPlayingHistory([...playingHistory, { organization: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '' }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {playingHistory.map((h, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setPlayingHistory(playingHistory.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input className="input-field sm:col-span-1" placeholder="Club / Team Name" value={h.organization} onChange={(e) => { const c = [...playingHistory]; c[i].organization = e.target.value; setPlayingHistory(c); }} />
                      {POSITIONS_BY_SPORT[athleteForm.primarySport] ? (
                        <select className="input-field" value={h.role} onChange={(e) => { const c = [...playingHistory]; c[i].role = e.target.value; setPlayingHistory(c); }}>
                          <option value="">Select Position</option>
                          {POSITIONS_BY_SPORT[athleteForm.primarySport].map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input className="input-field" placeholder="Role / Position" value={h.role} onChange={(e) => { const c = [...playingHistory]; c[i].role = e.target.value; setPlayingHistory(c); }} />
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={h.isCurrent} onChange={(e) => { const c = [...playingHistory]; c[i].isCurrent = e.target.checked; setPlayingHistory(c); }} />
                        <span className="text-xs text-gray-600">Currently playing</span>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><label className="text-[10px] text-gray-400">Start Date</label><input type="date" className="input-field" value={h.startDate} onChange={(e) => { const c = [...playingHistory]; c[i].startDate = e.target.value; setPlayingHistory(c); }} /></div>
                      {!h.isCurrent && <div><label className="text-[10px] text-gray-400">End Date</label><input type="date" className="input-field" value={h.endDate} onChange={(e) => { const c = [...playingHistory]; c[i].endDate = e.target.value; setPlayingHistory(c); }} /></div>}
                    </div>
                    <textarea rows={2} className="input-field" placeholder="Description of your experience..." value={h.description} onChange={(e) => { const c = [...playingHistory]; c[i].description = e.target.value; setPlayingHistory(c); }} />
                  </div>
                ))}
                {playingHistory.length === 0 && <p className="text-center text-gray-500 py-4">No club history added.</p>}
              </div>
            )}

            {user?.role === 'athlete' && activeTab === 'achievements' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Awards & Achievements</h2>
                  <button onClick={() => setAchievements([...achievements, { title: '', year: '', category: '', description: '' }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {achievements.map((a, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setAchievements(achievements.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input className="input-field sm:col-span-2" placeholder="Award Title" value={a.title} onChange={(e) => { const c = [...achievements]; c[i].title = e.target.value; setAchievements(c); }} />
                      <select className="input-field" value={a.year} onChange={(e) => { const c = [...achievements]; c[i].year = e.target.value; setAchievements(c); }}>
                        <option value="">Year</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <input className="input-field" placeholder="Category (e.g. State Level)" value={a.category} onChange={(e) => { const c = [...achievements]; c[i].category = e.target.value; setAchievements(c); }} />
                    <textarea rows={2} className="input-field" placeholder="Brief description..." value={a.description} onChange={(e) => { const c = [...achievements]; c[i].description = e.target.value; setAchievements(c); }} />
                  </div>
                ))}
              </div>
            )}

            {user?.role === 'athlete' && activeTab === 'tournaments' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Tournaments & Events Participated</h2>
                  <button onClick={() => setTournaments([...tournaments, { name: '', startDate: '', endDate: '', location: '', description: '' }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {tournaments.map((t, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setTournaments(tournaments.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <input className="input-field" placeholder="Tournament Name" value={t.name} onChange={(e) => { const c = [...tournaments]; c[i].name = e.target.value; setTournaments(c); }} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><label className="text-[10px] text-gray-400">Start Date</label><input type="date" className="input-field" value={t.startDate} onChange={(e) => { const c = [...tournaments]; c[i].startDate = e.target.value; setTournaments(c); }} /></div>
                      <div><label className="text-[10px] text-gray-400">End Date</label><input type="date" className="input-field" value={t.endDate} onChange={(e) => { const c = [...tournaments]; c[i].endDate = e.target.value; setTournaments(c); }} /></div>
                    </div>
                    <input list="cities-list" className="input-field" placeholder="Location (type or select city)" value={t.location} onChange={(e) => { const c = [...tournaments]; c[i].location = e.target.value; setTournaments(c); }} />
                    <textarea rows={2} className="input-field" placeholder="Your performance details..." value={t.description} onChange={(e) => { const c = [...tournaments]; c[i].description = e.target.value; setTournaments(c); }} />
                  </div>
                ))}
              </div>
            )}

            {user?.role === 'athlete' && activeTab === 'highlights' && (
              <div className="card p-6 space-y-6">
                <h2 className="font-semibold text-gray-900 border-b pb-2">Video Highlights</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Profile Video (YouTube/Vimeo URL)</label>
                  <input className="input-field" value={athleteForm.featuredVideoUrl} onChange={(e) => setAthleteForm({ ...athleteForm, featuredVideoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Other Highlight Clips</h3>
                    <button onClick={() => setHighlights([...highlights, { title: '', url: '', platform: 'YouTube' }])} className="text-xs text-brand hover:underline">Add More</button>
                  </div>
                  {highlights.map((h, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-gray-50 relative space-y-2">
                      <button onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="absolute top-1 right-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      <input className="input-field text-sm p-2" placeholder="Video Title" value={h.title} onChange={(e) => { const c = [...highlights]; c[i].title = e.target.value; setHighlights(c); }} />
                      <div className="flex gap-2">
                        <input className="input-field text-sm p-2" placeholder="URL" value={h.url} onChange={(e) => { const c = [...highlights]; c[i].url = e.target.value; setHighlights(c); }} />
                        <select className="input-field text-sm p-2 w-32" value={h.platform} onChange={(e) => { const c = [...highlights]; c[i].platform = e.target.value; setHighlights(c); }}>
                          <option value="YouTube">YouTube</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Vimeo">Vimeo</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user?.role === 'athlete' && activeTab === 'contact' && (
              <div className="card p-6 space-y-6">
                <h2 className="font-semibold text-gray-900 border-b pb-2">Contact & Professional</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                    <input className="input-field" value={athleteForm.socialLinks.whatsapp} onChange={(e) => setAthleteForm({ ...athleteForm, socialLinks: { ...athleteForm.socialLinks, whatsapp: e.target.value } })} placeholder="+91..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                    <input className="input-field" value={athleteForm.socialLinks.instagram} onChange={(e) => setAthleteForm({ ...athleteForm, socialLinks: { ...athleteForm.socialLinks, instagram: e.target.value } })} placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input className="input-field" value={athleteForm.socialLinks.linkedin} onChange={(e) => setAthleteForm({ ...athleteForm, socialLinks: { ...athleteForm.socialLinks, linkedin: e.target.value } })} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter / X URL</label>
                    <input className="input-field" value={athleteForm.socialLinks.twitter} onChange={(e) => setAthleteForm({ ...athleteForm, socialLinks: { ...athleteForm.socialLinks, twitter: e.target.value } })} placeholder="https://x.com/..." />
                  </div>
                </div>

              </div>
            )}

            {/* ── COACH TABS ── */}
            {user?.role === 'coach' && activeTab === 'basic' && (
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Coach Profile</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input className="input-field" value={coachForm.fullName} onChange={(e) => setCoachForm({ ...coachForm, fullName: e.target.value })} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                    <input type="email" className="input-field" value={coachForm.email} onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                    <div className="flex gap-2">
                      <select className="input-field w-32" value={coachForm.countryCode} onChange={(e) => setCoachForm({ ...coachForm, countryCode: e.target.value })}>
                        {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                      <input type="tel" className="input-field flex-1" value={coachForm.phone} onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })} placeholder="98765 43210" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select className="input-field" value={coachForm.gender} onChange={(e) => setCoachForm({ ...coachForm, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" className="input-field" value={coachForm.dateOfBirth} onChange={(e) => setCoachForm({ ...coachForm, dateOfBirth: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input type="number" className="input-field" value={coachForm.experienceYears} onChange={(e) => setCoachForm({ ...coachForm, experienceYears: parseInt(e.target.value) || 0 })} placeholder="5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select className="input-field" value={coachForm.location.state} onChange={(e) => setCoachForm({ ...coachForm, location: { ...coachForm.location, state: e.target.value, city: '' } })}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <select className="input-field" value={coachForm.location.city} disabled={!coachForm.location.state} onChange={(e) => setCoachForm({ ...coachForm, location: { ...coachForm.location, city: e.target.value } })}>
                      <option value="">{coachForm.location.state ? 'Select City' : 'Select state first'}</option>
                      {cityOptions(coachForm.location.state, coachForm.location.city).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Looking for Job</label>
                    <select className="input-field" value={coachForm.availabilityStatus} onChange={(e) => setCoachForm({ ...coachForm, availabilityStatus: e.target.value })}>
                      <option value="looking">Actively looking for a job</option>
                      <option value="open">Open to opportunities</option>
                      <option value="not_looking">Not looking right now</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile URL</label>
                    <input className="input-field" value={coachForm.profileUrl} onChange={(e) => setCoachForm({ ...coachForm, profileUrl: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="coach-yourname" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea rows={4} className="input-field" value={coachForm.bio} onChange={(e) => setCoachForm({ ...coachForm, bio: e.target.value })} placeholder="Your coaching philosophy and experience..." />
                </div>
              </div>
            )}

            {user?.role === 'coach' && activeTab === 'sports' && (
              <div className="card p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Sports & Skills</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sports You Coach</label>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSport(s, coachForm.sportsCoached, (v) => setCoachForm({ ...coachForm, sportsCoached: v }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${coachForm.sportsCoached.includes(s) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-300 hover:border-brand'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age Groups Coached</label>
                  <div className="flex flex-wrap gap-2">
                    {['Under 10', 'Under 14', 'Under 16', 'Under 19', 'Seniors', 'Professionals'].map((ag) => (
                      <button key={ag} type="button" onClick={() => toggleSport(ag, coachAgeGroups, setCoachAgeGroups)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${coachAgeGroups.includes(ag) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-300 hover:border-brand'}`}>
                        {ag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {user?.role === 'coach' && activeTab === 'education' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Education Background</h2>
                  <button onClick={() => setCoachEducation([...coachEducation, { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', description: '' }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {coachEducation.map((e, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setCoachEducation(coachEducation.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="input-field" placeholder="School / University" value={e.institution} onChange={(ev) => { const c = [...coachEducation]; c[i].institution = ev.target.value; setCoachEducation(c); }} />
                      <input className="input-field" placeholder="Degree" value={e.degree} onChange={(ev) => { const c = [...coachEducation]; c[i].degree = ev.target.value; setCoachEducation(c); }} />
                      <input className="input-field" placeholder="Field of Study" value={e.fieldOfStudy} onChange={(ev) => { const c = [...coachEducation]; c[i].fieldOfStudy = ev.target.value; setCoachEducation(c); }} />
                      <div className="flex gap-2 items-center">
                        <select className="input-field" value={e.startYear} onChange={(ev) => { const c = [...coachEducation]; c[i].startYear = ev.target.value; setCoachEducation(c); }}>
                          <option value="">Start Year</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {!e.isCurrent && (
                          <select className="input-field" value={e.endYear} onChange={(ev) => { const c = [...coachEducation]; c[i].endYear = ev.target.value; setCoachEducation(c); }}>
                            <option value="">End Year</option>
                            {YEARS_WITH_FUTURE.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={!!e.isCurrent} onChange={(ev) => { const c = [...coachEducation]; c[i].isCurrent = ev.target.checked; if (ev.target.checked) c[i].endYear = ''; setCoachEducation(c); }} className="rounded text-brand" />
                      Currently Studying
                    </label>
                    <textarea rows={2} className="input-field" placeholder="Description / Academic achievements" value={e.description} onChange={(ev) => { const c = [...coachEducation]; c[i].description = ev.target.value; setCoachEducation(c); }} />
                  </div>
                ))}
                {coachEducation.length === 0 && <p className="text-center text-gray-500 py-4">No education details added.</p>}
              </div>
            )}

            {user?.role === 'coach' && activeTab === 'certifications' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Coaching Certifications</h2>
                  <button onClick={() => setCoachQualifications([...coachQualifications, { name: '', issuer: '', year: '' }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {coachQualifications.map((q, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setCoachQualifications(coachQualifications.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="input-field" placeholder="Certification Name (e.g. AFC B License)" value={q.name} onChange={(e) => { const c = [...coachQualifications]; c[i].name = e.target.value; setCoachQualifications(c); }} />
                      <input className="input-field" placeholder="Issuing Organization" value={q.issuer} onChange={(e) => { const c = [...coachQualifications]; c[i].issuer = e.target.value; setCoachQualifications(c); }} />
                      <select className="input-field sm:col-span-2" value={q.year} onChange={(e) => { const c = [...coachQualifications]; c[i].year = e.target.value; setCoachQualifications(c); }}>
                        <option value="">Year</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    {/* Certificate / proof upload */}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer w-fit">
                        <Upload className="w-3 h-3" /> {q.document ? 'Replace Certificate' : 'Upload Certificate'}
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(ev) => handleCertificateUpload(ev.target.files?.[0], (url) => { const c = [...coachQualifications]; c[i].document = url; setCoachQualifications(c); })} />
                      </label>
                      {q.document && (
                        <>
                          <a href={q.document} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> View Certificate</a>
                          <button onClick={() => { const c = [...coachQualifications]; c[i].document = ''; setCoachQualifications(c); }} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                        </>
                      )}
                      <span className="text-[11px] text-gray-400">JPG, PNG or PDF · proof of certification</span>
                    </div>
                  </div>
                ))}
                {coachQualifications.length === 0 && <p className="text-center text-gray-500 py-4">No certifications added.</p>}
              </div>
            )}

            {user?.role === 'coach' && activeTab === 'experience' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Coaching Experience</h2>
                  <button onClick={() => setCoachExperience([...coachExperience, { organization: '', role: '', startDate: '', endDate: '', current: false }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {coachExperience.map((e, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setCoachExperience(coachExperience.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="input-field" placeholder="Academy / Club Name" value={e.organization} onChange={(ev) => { const c = [...coachExperience]; c[i].organization = ev.target.value; setCoachExperience(c); }} />
                      <input className="input-field" placeholder="Role (e.g. Head Coach)" value={e.role} onChange={(ev) => { const c = [...coachExperience]; c[i].role = ev.target.value; setCoachExperience(c); }} />
                      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                        <div><label className="text-[10px] text-gray-400">Start Date</label><input type="date" className="input-field" value={e.startDate} onChange={(ev) => { const c = [...coachExperience]; c[i].startDate = ev.target.value; setCoachExperience(c); }} /></div>
                        {!e.current && <div><label className="text-[10px] text-gray-400">End Date</label><input type="date" className="input-field" value={e.endDate} onChange={(ev) => { const c = [...coachExperience]; c[i].endDate = ev.target.value; setCoachExperience(c); }} /></div>}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mt-2">
                      <input type="checkbox" checked={e.current} onChange={(ev) => { const c = [...coachExperience]; c[i].current = ev.target.checked; if (ev.target.checked) c[i].endDate = ''; setCoachExperience(c); }} className="rounded text-brand" />
                      Currently working here
                    </label>
                  </div>
                ))}
                {coachExperience.length === 0 && <p className="text-center text-gray-500 py-4">No experience added.</p>}
              </div>
            )}

            {user?.role === 'coach' && activeTab === 'tournaments' && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Players / Team Trained</h2>
                  <button onClick={() => setCoachPlayersTrained([...coachPlayersTrained, { name: '', result: '', description: '', year: '' }])} className="flex items-center gap-1 text-sm text-brand hover:underline">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {coachPlayersTrained.map((t, i) => (
                  <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg relative space-y-3">
                    <button onClick={() => setCoachPlayersTrained(coachPlayersTrained.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="input-field" placeholder="Player / Team Trained" value={t.name} onChange={(e) => { const c = [...coachPlayersTrained]; c[i].name = e.target.value; setCoachPlayersTrained(c); }} />
                      <input className="input-field" placeholder="Result (e.g. National Champion)" value={t.result} onChange={(e) => { const c = [...coachPlayersTrained]; c[i].result = e.target.value; setCoachPlayersTrained(c); }} />
                      <select className="input-field" value={t.year} onChange={(e) => { const c = [...coachPlayersTrained]; c[i].year = e.target.value; setCoachPlayersTrained(c); }}>
                        <option value="">Year</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <textarea rows={2} className="input-field" placeholder="Description (how you trained them, achievements...)" value={t.description} onChange={(e) => { const c = [...coachPlayersTrained]; c[i].description = e.target.value; setCoachPlayersTrained(c); }} />
                  </div>
                ))}
                {coachPlayersTrained.length === 0 && <p className="text-center text-gray-500 py-4">No players/teams added yet.</p>}
              </div>
            )}

            {user?.role === 'coach' && activeTab === 'social' && (
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Social Links</h2>
                {(['instagram', 'youtube', 'twitter', 'linkedin'] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{k}</label>
                    <input className="input-field" value={coachForm.socialLinks[k]} onChange={(e) => setCoachForm({ ...coachForm, socialLinks: { ...coachForm.socialLinks, [k]: e.target.value } })} placeholder={`https://${k}.com/yourprofile`} />
                  </div>
                ))}
              </div>
            )}

            {/* ── ORGANIZATION TABS ── */}
            {user?.role === 'organization' && activeTab === 'basic' && (
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Organization Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                    <input className="input-field" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="Sports Academy Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type / Category</label>
                    <select className="input-field" value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}>
                      <option value="">Select type</option>
                      <option value="academy">Sports Academy</option>
                      <option value="school">School</option>
                      <option value="university">University/College</option>
                      <option value="club">Sports Club</option>
                      <option value="federation">Federation / Association</option>
                      <option value="organizer">Event Organizer</option>
                      <option value="corporate">Corporate</option>
                      <option value="agency">Sports Agency</option>
                      <option value="brand">Brand / Sponsor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Established</label>
                    <input type="number" className="input-field" value={orgForm.yearEstablished} onChange={(e) => setOrgForm({ ...orgForm, yearEstablished: e.target.value })} placeholder="2010" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="input-field" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} placeholder="contact@academy.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                    <input type="tel" className="input-field" value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate / Display Number</label>
                    <input type="tel" className="input-field" value={orgForm.alternatePhone} onChange={(e) => setOrgForm({ ...orgForm, alternatePhone: e.target.value })} placeholder="Different number for public display" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input className="input-field" value={orgForm.website} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} placeholder="https://youracademy.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input className="input-field" maxLength={6} value={orgForm.pincode} onChange={(e) => {
                      const val = e.target.value;
                      setOrgForm({ ...orgForm, pincode: val });
                      if (val.length === 6) {
                        fetch(`https://api.postalpincode.in/pincode/${val}`)
                          .then((r) => r.json())
                          .then((data) => {
                            if (data[0].Status === 'Success') {
                              const { District, State } = data[0].PostOffice[0];
                              setOrgForm((prev) => ({ ...prev, city: District, state: State }));
                            }
                          }).catch(() => {});
                      }
                    }} placeholder="400001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select className="input-field" value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value, city: '' })}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <select className="input-field" value={orgForm.city} disabled={!orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}>
                      <option value="">{orgForm.state ? 'Select City' : 'Select state first'}</option>
                      {cityOptions(orgForm.state, orgForm.city).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                  <textarea rows={2} className="input-field" value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} placeholder="Building, Street, Area..." />
                </div>
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium text-gray-700">Privacy Settings</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={orgForm.showPhone} onChange={(e) => setOrgForm({ ...orgForm, showPhone: e.target.checked })} className="rounded text-brand w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Show contact number on public profile</p>
                      <p className="text-xs text-gray-500">Athletes and coaches will see your phone/alternate number</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={orgForm.showAddress} onChange={(e) => setOrgForm({ ...orgForm, showAddress: e.target.checked })} className="rounded text-brand w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Show address on public profile</p>
                      <p className="text-xs text-gray-500">Full address will be visible to visitors on your page</p>
                    </div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={4} className="input-field" value={orgForm.description} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} placeholder="About your organization..." />
                </div>
              </div>
            )}

            {user?.role === 'organization' && activeTab === 'sports' && (
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Sports Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSport(s, orgForm.sportsOffered, (v) => setOrgForm({ ...orgForm, sportsOffered: v }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${orgForm.sportsOffered.includes(s) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-300 hover:border-brand'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save — "Save & Continue" advances to the next section; "Save & Finish" goes to your profile */}
          <div className="mt-8 flex justify-between items-center gap-3">
            <button onClick={() => handleSave(false)} disabled={isSaving} className="btn-secondary flex items-center gap-2 px-6 py-3">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save &amp; Finish
            </button>
            {tabs[tabs.length - 1].id !== activeTab && (
              <button onClick={() => handleSave(true)} disabled={isSaving} className="btn-primary flex items-center gap-2 px-8 py-3">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save &amp; Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
