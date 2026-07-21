import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Fuel, 
  Users, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Mic,
  Wifi,
  ChevronRight,
  ChevronDown,
  Camera,
  UserPlus,
  StickyNote,
  CloudOff,
  RefreshCcw,
  User,
  Brain,
  Send,
  X,
  Plus,
  LogIn,
  LogOut,
  Settings,
  Upload,
  Calendar,
  Clock,
  FileText,
  FileDown,
  GanttChart,
  Trash2,
  Edit3,
  Lock,
  Phone,
  LayoutDashboard,
  DollarSign,
  Briefcase,
  BookOpen,
  Target,
  Wallet,
  History,
  TrendingUp,
  Printer,
  Zap,
  MessageSquare,
  Search,
  Package,
  Handshake,
  Activity,
  Sun,
  Moon,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processarCaos, gerarBriefingCandidato, processarNotaAudio } from '../services/geminiService';
import { useAuth } from '../lib/FirebaseProvider';
import { firestoreService } from '../lib/firestoreService';
import NoteCard from './NoteCard';
import RoraimaMapComponent from './RoraimaMapComponent';
import EleitoralDashboard from './EleitoralDashboard';
import { onSnapshot, doc, collection, query, orderBy, limit, getDocs, where, getDoc, addDoc, serverTimestamp, updateDoc, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { validarSugestaoAgenda, AgendaItem } from '../lib/agendaLogic';
import * as XLSX from 'xlsx';
import { maskCurrency, parseCurrencyToNumber } from '../utils/currency';
import { safeLocalStorage } from '../utils/safeStorage';

interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface OfflineQueueItem {
  id: string;
  type: 'ponto' | 'eleitor' | 'combustivel' | 'demanda';
  data: any;
  location: GeoLocation;
  timestamp: number;
  fraudFlag?: boolean;
  fraudReason?: string;
}

export default function CaboDashboard({ theme, setTheme }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }) {
  const { user, logout, isAdmin, coordinatorId } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipe' | 'logistica' | 'ouvidoria' | 'financeiro' | 'notas' | 'materiais' | 'feed'>('logistica');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dailyOrder, setDailyOrder] = useState<any>(null);
  const [resolvedCoordinatorId, setResolvedCoordinatorId] = useState<string | null>(null);
  
  // Notas State
  const [notes, setNotes] = useState<any[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingNote, setIsProcessingNote] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  // Finance State for Leader
  const [teamTransactions, setTeamTransactions] = useState<any[]>([]);
  const [isSignReceiptModalOpen, setIsSignReceiptModalOpen] = useState(false);
  const [selectedTxToSign, setSelectedTxToSign] = useState<any>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isExpenseVoucherModalOpen, setIsExpenseVoucherModalOpen] = useState(false);
  const [selectedExpenseForVoucher, setSelectedExpenseForVoucher] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', purpose: '' });
  
  const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<'individual' | 'lote' | 'link'>('individual');
  const [bulkFileError, setBulkFileError] = useState<string | null>(null);
  const [bulkFileSuccess, setBulkFileSuccess] = useState<string | null>(null);
  const [parsedVoters, setParsedVoters] = useState<any[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [voterForm, setVoterForm] = useState<{
    name: string;
    phone: string;
    address: string;
    observations: string;
    referredBy: string;
    tags: string[];
    articulatorId?: string;
    cpf: string;
    rg: string;
    titulo: string;
    zona: string;
    secao: string;
    localVotacao: string;
  }>({ name: '', phone: '', address: '', observations: '', referredBy: '', tags: [], articulatorId: '', cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: '' });
  const [currentTag, setCurrentTag] = useState('');

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ amount: '', reason: '' });

  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [demandForm, setDemandForm] = useState({ title: '', description: '' });

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [agendaForm, setAgendaForm] = useState({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });

  const [myRequests, setMyRequests] = useState<any[]>([]);

  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    phone: '',
    photoUrl: user?.photoURL || '',
    zone: ''
  });

  const [teamData, setTeamData] = useState<any>(null);
  const [voters, setVoters] = useState<any[]>([]);
  const [voterPage, setVoterPage] = useState(1);
  const [voterPageSize, setVoterPageSize] = useState(15);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterFilterTags, setVoterFilterTags] = useState<string[]>([]);
  const [voterViewState, setVoterViewState] = useState<'list' | 'network'>('list');

  const [paginatedVotersList, setPaginatedVotersList] = useState<any[]>([]);
  const [loadingPaginatedVoters, setLoadingPaginatedVoters] = useState(false);
  const [totalVotersCount, setTotalVotersCount] = useState(0);
  const [votedVotersCount, setVotedVotersCount] = useState(0);
  const [hasMoreVoters, setHasMoreVoters] = useState(false);

  // Carregar cache local de eleitores para carregamento imediato
  useEffect(() => {
    if (user?.uid) {
      const cached = safeLocalStorage.getItem(`aguia_voters_cache_${user.uid}`);
      if (cached) {
        try {
          setVoters(JSON.parse(cached));
        } catch (e) {
          console.warn("Erro ao carregar cache de eleitores:", e);
        }
      }
    }
  }, [user]);

  // Resetar página ao mudar filtros de busca/tag
  useEffect(() => {
    setVoterPage(1);
  }, [voterSearch, voterFilterTags]);
  const [myAgendas, setMyAgendas] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isVoterDetailOpen, setIsVoterDetailOpen] = useState(false);
  const [isEditingVoter, setIsEditingVoter] = useState(false);
  const [editingVoterId, setEditingVoterId] = useState<string | null>(null);
  const [campaignVoters, setCampaignVoters] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      let unsubTx: (() => void) | null = null;
      let unsubNotes: (() => void) | null = null;
      let unsubDailyOrder: (() => void) | null = null;
      let unsubMaterials: (() => void) | null = null;
      let unsubPartners: (() => void) | null = null;
      let unsubMaterialRequests: (() => void) | null = null;
      let unsubCampaignVoters: (() => void) | null = null;
      let unsubUrgencies: (() => void) | null = null;
      
      let currentSubscribedCoordId: string | null = null;
      let subscribedMaterials = false;
      
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const teamName = data.teamName || data.zone || data.team || '';
          setProfileData({
            name: data.name || user.displayName || '',
            phone: data.phone || '',
            photoUrl: data.photoUrl || user.photoURL || '',
            zone: teamName
          });
          
          if (!subscribedMaterials) {
            subscribedMaterials = true;
            if (unsubMaterials) unsubMaterials();
            unsubMaterials = onSnapshot(
              collection(db, 'materials'),
              (snap) => {
                const mats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log(`🧠 [Materials Leader Sync] Loaded ${mats.length} total materials from Firestore`);
                setMaterials(mats);
              },
              (err) => {
                console.warn("Materials Cabo sync error:", err.message);
              }
            );
          }
          
          // Synchronous fast-track resolution of coordinatorId
          let resolvedCoordId = data.coordinatorId || coordinatorId || '';

          // If we have a teamId, fetch team details in the background
          if (data.teamId && (!teamData || teamData.id !== data.teamId)) {
            getDoc(doc(db, 'teams', data.teamId)).then((teamSnap) => {
              if (teamSnap.exists()) {
                const teamDataRaw = teamSnap.data();
                setTeamData({ ...teamDataRaw, id: teamSnap.id });
                if (!resolvedCoordId && teamDataRaw.coordinatorId) {
                  updateDoc(doc(db, 'users', user.uid), {
                    coordinatorId: teamDataRaw.coordinatorId
                  }).catch(err => console.error("Error healing coordinatorId from team:", err));
                }
              }
            }).catch(err => console.warn("Erro ao buscar equipe por teamId:", err));
          }

          // If still no coordinatorId and we have user email, heal in the background
          if (!resolvedCoordId && user.email) {
            const emailVariants = Array.from(new Set([
              user.email.toLowerCase(),
              user.email
            ])).filter(Boolean);
            const qTeams = query(collection(db, 'teams'), where('leaderEmail', 'in', emailVariants));
            getDocs(qTeams).then((snapTeams) => {
              if (!snapTeams.empty) {
                const teamId = snapTeams.docs[0].id;
                const teamDataRaw = snapTeams.docs[0].data();
                setTeamData({ ...teamDataRaw, id: teamId });
                const foundCoordId = teamDataRaw.coordinatorId || '';
                if (foundCoordId) {
                  updateDoc(doc(db, 'users', user.uid), {
                    teamId: teamId,
                    teamName: teamDataRaw.name || '',
                    coordinatorId: foundCoordId
                  }).catch(err => console.error("Error healing profile with matching team:", err));
                }
              } else {
                // Fallback: Query first coordinator by role
                const qCoords = query(collection(db, 'users'), where('role', '==', 'coordenador'), limit(1));
                getDocs(qCoords).then((snapCoords) => {
                  if (!snapCoords.empty) {
                    const fallbackCoordId = snapCoords.docs[0].id;
                    updateDoc(doc(db, 'users', user.uid), {
                      coordinatorId: fallbackCoordId
                    }).catch(err => console.error("Error healing fallback coordinatorId:", err));
                  }
                }).catch(err => console.error("Error querying fallback coordinator:", err));
              }
            }).catch(err => console.warn("Erro ao buscar equipe por leaderEmail:", err));
          }

          if (resolvedCoordId) {
            setResolvedCoordinatorId(resolvedCoordId);
            
            // Auto-heal: propagate resolved coordinatorId back to user document so security rules can approve reads
            if (data.coordinatorId !== resolvedCoordId) {
              updateDoc(doc(db, 'users', user.uid), {
                coordinatorId: resolvedCoordId
              }).catch(err => console.error("Error writing coordinatorId to user profile:", err));
            }
            
            // Auto-heal existing voters and material requests with empty/missing coordinatorId
            const healVotersAndRequests = async (rCoordId: string) => {
              try {
                // 1. Heal Voters
                const qVoters = query(collection(db, 'voters'), where('leaderId', '==', user.uid));
                const snapVoters = await getDocs(qVoters);
                const voterPromises = snapVoters.docs
                  .filter(doc => {
                    const d = doc.data();
                    return !d.coordinatorId || d.coordinatorId === '';
                  })
                  .map(vDoc => 
                    updateDoc(doc(db, 'voters', vDoc.id), {
                      coordinatorId: rCoordId
                    })
                  );
                
                // 2. Heal Material Requests
                const qRequests = query(collection(db, 'material_requests'), where('leaderId', '==', user.uid));
                const snapRequests = await getDocs(qRequests);
                const requestPromises = snapRequests.docs
                  .filter(doc => {
                    const d = doc.data();
                    return !d.coordinatorId || d.coordinatorId === '';
                  })
                  .map(rDoc => 
                    updateDoc(doc(db, 'material_requests', rDoc.id), {
                      coordinatorId: rCoordId
                    })
                  );

                const totalPromises = [...voterPromises, ...requestPromises];
                if (totalPromises.length > 0) {
                  await Promise.all(totalPromises);
                  console.log(`🧠 [Healer] Successfully healed ${totalPromises.length} records for leader ${user.uid} with coordinatorId: ${rCoordId}`);
                }
              } catch (err) {
                console.error("Error healing records:", err);
              }
            };
            healVotersAndRequests(resolvedCoordId);
          }

          // Subscribe to transactions whenever team info is available
          if (teamName) {
            if (unsubTx) unsubTx();
            const txQuery = query(
              collection(db, 'transactions'), 
              where('team', '==', teamName),
              where('coordinatorId', '==', resolvedCoordId || coordinatorId)
            );
            unsubTx = onSnapshot(txQuery, (snapshot) => {
              const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
              setTeamTransactions(txs.sort((a, b) => (b.date || 0) - (a.date || 0)));
            }, (err) => {
              console.error("Erro ao escutar transações da equipe:", err);
            });
          }

          if (resolvedCoordId && resolvedCoordId !== currentSubscribedCoordId) {
            currentSubscribedCoordId = resolvedCoordId;

            if (unsubNotes) unsubNotes();
            const notesQuery = query(
              collection(db, 'notes'), 
              where('type', '==', 'tactical'), 
              where('coordinatorId', '==', resolvedCoordId),
              orderBy('createdAt', 'desc')
            );
            unsubNotes = onSnapshot(notesQuery, (snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setNotes(data);
            }, (err) => {
              console.error("Erro ao escutar notas:", err);
            });

            if (unsubDailyOrder) unsubDailyOrder();
            unsubDailyOrder = onSnapshot(doc(db, 'config', `dailyOrder_${resolvedCoordId}`), (snap) => {
              if (snap.exists()) setDailyOrder(snap.data());
            }, (err) => {
              console.warn("DailyOrder Cabo sync error:", err.message);
            });

            if (unsubPartners) unsubPartners();
            unsubPartners = onSnapshot(
              query(collection(db, 'partners'), where('coordinatorId', '==', resolvedCoordId)), 
              (snap) => {
                setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
              }, 
              (err) => {
                console.warn("Partners Cabo sync error:", err.message);
              }
            );

            if (unsubMaterialRequests) unsubMaterialRequests();
            unsubMaterialRequests = firestoreService.subscribeToCollectionFiltered('material_requests', resolvedCoordId, (data) => {
              setMaterialRequests(data);
            });

            if (unsubCampaignVoters) unsubCampaignVoters();
            // campaignVoters is now lazy-loaded on demand only when the voter modal is open to save document reads.

            if (unsubUrgencies) unsubUrgencies();
            unsubUrgencies = firestoreService.subscribeToCollectionFiltered('urgencies', resolvedCoordId, (data) => {
              setMyRequests(data.filter((r: any) => r.leaderId === user.uid));
            });
          }
        }
      }, (error) => {
        console.error("Erro ao escutar perfil:", error);
      });

       // We remove the full unsubVoters from here because it's replaced by the new paginated effect hook below

       const agendasQuery = query(collection(db, 'agenda'), where('sugeridoPorId', '==', user.uid));
       const unsubAgendas = onSnapshot(agendasQuery, (snapshot) => {
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setMyAgendas(data);
       }, (err) => {
         console.error("Erro ao escutar agendas do líder:", err);
       });

       return () => {
         unsubProfile();
         unsubAgendas();
         if (unsubNotes) unsubNotes();
         if (unsubTx) unsubTx();
         if (unsubDailyOrder) unsubDailyOrder();
         if (unsubMaterials) unsubMaterials();
         if (unsubPartners) unsubPartners();
         if (unsubMaterialRequests) unsubMaterialRequests();
         if (unsubUrgencies) unsubUrgencies();
       };
     }
   }, [user, coordinatorId]);

  // 1. Recarrega as estatísticas de contagem do líder diretamente do servidor sem puxar todos os documentos
  const fetchServerCounts = async () => {
    if (!user?.uid) return;
    try {
      const qTotal = query(collection(db, 'voters'), where('leaderId', '==', user.uid));
      const snapTotal = await getCountFromServer(qTotal);
      setTotalVotersCount(snapTotal.data().count);

      const qVoted = query(collection(db, 'voters'), where('leaderId', '==', user.uid), where('voted', '==', true));
      const snapVoted = await getCountFromServer(qVoted);
      setVotedVotersCount(snapVoted.data().count);
    } catch (err) {
      console.warn("Erro ao buscar contagens agregadas do líder:", err);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchServerCounts();
    }
  }, [user?.uid, activeTab]);

  // 2. Sincronização reativa paginada para a listagem principal de eleitores do Líder (carregando de 50 em 50)
  useEffect(() => {
    if (!user?.uid) return;

    // Apenas escutamos se o tab for equipe ou analise_eleitoral
    if (activeTab !== 'equipe' && activeTab !== 'analise_eleitoral') return;

    setLoadingPaginatedVoters(true);
    const isFullLoadTab = activeTab === 'analise_eleitoral';

    let q = query(
      collection(db, 'voters'),
      where('leaderId', '==', user.uid)
    );

    if (!isFullLoadTab) {
      // Usamos um limite dinâmico de 50 * voterPage para permitir rolagem e paginação reativa segura
      const limitSize = 50 * voterPage;
      q = query(q, limit(limitSize));
    }

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = docs.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      
      // Manter retrocompatibilidade com o estado 'voters'
      setVoters(sorted);
      setPaginatedVotersList(sorted);
      
      if (!isFullLoadTab) {
        const limitSize = 50 * voterPage;
        setHasMoreVoters(snap.docs.length === limitSize);
      } else {
        setHasMoreVoters(false);
      }
      setLoadingPaginatedVoters(false);
      
      safeLocalStorage.setItem(`aguia_voters_cache_${user.uid}`, JSON.stringify(sorted));
    }, (err) => {
      console.warn("Error listening to paginated leader voters:", err.message);
      setLoadingPaginatedVoters(false);
    });

    return () => unsub();
  }, [user?.uid, activeTab, voterPage]);

  // 3. Sincroniza campanha para autocomplete de forma sob demanda (apenas quando o modal de edição/criação de eleitor estiver aberto)
  useEffect(() => {
    if (!resolvedCoordinatorId || !isVoterModalOpen) {
      return;
    }

    console.log("🧠 [Optimization] Lazy loading campaign voters for dropdown options since modal is open");
    const unsub = onSnapshot(
      query(collection(db, 'voters'), where('coordinatorId', '==', resolvedCoordinatorId)),
      (snap) => {
        const rawData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        const uniqueMap = new Map();
        rawData.forEach((v: any) => {
          const key = (v.phone && v.phone.length > 5) ? v.phone : v.name;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, v);
          }
        });
        setCampaignVoters(Array.from(uniqueMap.values()));
      },
      (err) => {
        console.warn("Error syncing campaign voters for dropdown:", err.message);
      }
    );

    return () => unsub();
  }, [resolvedCoordinatorId, isVoterModalOpen]);

  // Monitor de Conectividade
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    const queue = JSON.parse(safeLocalStorage.getItem('aguia_offline_queue') || '[]');
    setQueueCount(queue.length);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(safeLocalStorage.getItem('aguia_offline_queue') || '[]');
    if (queue.length === 0) return;
    
    setTimeout(() => {
      safeLocalStorage.setItem('aguia_offline_queue', '[]');
      setQueueCount(0);
      alert('✅ Sincronização Concluída!');
    }, 1500);
  };

  const processAction = async (type: string) => {
    switch(type) {
      case 'eleitor': setIsVoterModalOpen(true); break;
      case 'combustivel': setIsFuelModalOpen(true); break;
      case 'demanda': setIsDemandModalOpen(true); break;
      case 'agenda': setIsAgendaModalOpen(true); break;
      default:
        setIsLocating(true);
        // Capturar Localização para Ponto
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          const checkinData = {
            leaderId: user?.uid,
            leaderName: profileData.name || user?.displayName,
            leaderPhoto: profileData.photoUrl || user?.photoURL || '',
            teamId: teamData?.id || '',
            teamName: teamData?.name || profileData.zone || 'Liderança',
            timestamp: Date.now(),
            location: { lat: latitude, lng: longitude },
            type: 'selfie',
            status: 'validado',
            coordinatorId: resolvedCoordinatorId || coordinatorId || ''
          };
          
          const queue = JSON.parse(safeLocalStorage.getItem('aguia_offline_queue') || '[]');
          const newQueue = [...queue, { ...checkinData, id: Date.now() }];
          safeLocalStorage.setItem('aguia_offline_queue', JSON.stringify(newQueue));
          setQueueCount(newQueue.length);
          
          // Se online, já tenta salvar
          if (navigator.onLine) {
            await firestoreService.setDocument('attendance', `checkin_${Date.now()}`, checkinData);
          }
          
          setIsLocating(false);
          alert('✅ Ponto registrado com sucesso!');
        }, (err) => {
          setIsLocating(false);
          alert("Erro ao capturar GPS. Verifique as permissões.");
        });
    }
  };

  const handleDeleteVoter = async (voterId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este eleitor? Esta ação é irreversível.")) {
      try {
        await firestoreService.deleteDocument('voters', voterId);
        await fetchServerCounts();
        setIsVoterDetailOpen(false);
        setSelectedVoter(null);
        alert("Eleitor excluído com sucesso.");
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const filteredVoters = voters.filter(voter => {
    const matchesSearch = !voterSearch || 
      voter.name?.toLowerCase().includes(voterSearch.toLowerCase()) || 
      voter.phone?.includes(voterSearch);
    
    const matchesTags = voterFilterTags.length === 0 || 
      voterFilterTags.every((tag: string) => 
        voter.tags?.some((vTag: string) => vTag.trim().toUpperCase() === tag)
      );

    return matchesSearch && matchesTags;
  });

  const availableTags = Array.from(new Set(
    voters.flatMap(v => (v.tags || []) as string[])
      .map(t => t.trim().toUpperCase())
      .filter(t => t !== "")
  )) as string[];

  const totalPages = Math.ceil(filteredVoters.length / voterPageSize) || 1;
  const paginatedVoters = [...filteredVoters]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice((voterPage - 1) * voterPageSize, voterPage * voterPageSize);

  // --- COMPONENTE INTERNO: MAPA DE INDICAÇÕES (LISTA) ---
  const ReferralNetwork = ({ voters }: { voters: any[] }) => {
    const [expandedReferrers, setExpandedReferrers] = useState<string[]>([]);

    const toggleReferrer = (referrer: string) => {
      setExpandedReferrers(prev => 
        prev.includes(referrer) 
          ? prev.filter(r => r !== referrer) 
          : [...prev, referrer]
      );
    };

    // 1. Agrupar eleitores por quem os indicou
    const groupedByReferrer = voters.reduce((acc: any, voter) => {
      const referrer = voter.referredBy?.trim() || "Sem Indicação Direta";
      if (!acc[referrer]) acc[referrer] = [];
      acc[referrer].push(voter);
      return acc;
    }, {});

    const referrers = Object.keys(groupedByReferrer).sort();

    return (
      <div className="bg-[var(--bg-secondary)] rounded-sm border border-[var(--border-color)] overflow-hidden w-full min-h-[500px] p-8 shadow-[var(--shadow-sm)]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-8">
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Fluxo de Indicações</h3>
              <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Mapeamento hierárquico de influência regional</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 rounded-sm shadow-sm">
              <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest">{voters.length} Eleitores Mapeados</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {referrers.map((referrer) => (
              <div key={referrer} className="space-y-5">
                <button 
                  onClick={() => toggleReferrer(referrer)}
                  className="w-full flex items-center justify-between text-left group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-sm border transition-all ${expandedReferrers.includes(referrer) ? 'bg-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/20' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] group-hover:border-yellow-500/30'}`}>
                      <Handshake className={`w-4 h-4 transition-colors ${expandedReferrers.includes(referrer) ? 'text-zinc-950' : 'text-[var(--text-secondary)]'}`} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] block opacity-60">Pilar de Referência</span>
                      <h4 className={`text-sm font-black uppercase tracking-tight transition-colors ${expandedReferrers.includes(referrer) ? 'text-yellow-600 dark:text-yellow-500' : 'text-[var(--text-primary)] group-hover:text-yellow-600'}`}>{referrer}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">{groupedByReferrer[referrer].length} {groupedByReferrer[referrer].length === 1 ? 'eleitor' : 'eleitores'}</span>
                    <motion.div
                      animate={{ rotate: expandedReferrers.includes(referrer) ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className={`w-4 h-4 transition-colors ${expandedReferrers.includes(referrer) ? 'text-yellow-500' : 'text-[var(--text-secondary)] group-hover:text-yellow-500'}`} />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedReferrers.includes(referrer) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 pl-6 border-l-2 border-[var(--border-color)] space-y-3 pb-2 pt-2">
                        {groupedByReferrer[referrer].map((voter: any) => (
                          <motion.div 
                            key={voter.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => { setSelectedVoter(voter); setIsVoterDetailOpen(true); }}
                            className="group flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 rounded-sm border border-[var(--border-color)] hover:border-yellow-500/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-[var(--bg-secondary)] font-black text-xs text-yellow-500 flex items-center justify-center rounded-sm border border-[var(--border-color)] group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors shadow-inner">
                                {voter.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">{voter.name}</p>
                                <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1 opacity-60">{voter.phone}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {voter.tags?.slice(0, 2).map((tag: string) => (
                                <span key={tag} className="text-[7px] bg-[var(--bg-primary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-[var(--border-color)]">
                                  {tag}
                                </span>
                              ))}
                              <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] opacity-30 group-hover:text-yellow-500 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {voters.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-[var(--border-color)] rounded-sm grayscale opacity-30">
              <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px]">Silêncio Radar: Nenhuma rede capturada.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleAddMaterialRequest = async (e: any) => {
    e.preventDefault();
    const materialId = e.target.materialId.value;
    const qty = parseInt(e.target.qty.value);
    const reason = e.target.reason.value;
    const returnDate = e.target.returnDate?.value || null;
    
    if (!materialId || isNaN(qty)) return;

    const mat = materials.find((m: any) => m.id === materialId);
    
    await firestoreService.addDocument('material_requests', {
      leaderId: user.uid,
      leaderName: profileData.name || user?.displayName || 'Líder',
      teamId: teamData?.id || '',
      team: profileData.zone || teamData?.name || 'Base',
      materialId,
      materialName: mat?.name || 'Material Desconhecido',
      qty,
      reason,
      returnDate,
      status: 'pendente',
      coordinatorId: resolvedCoordinatorId || coordinatorId || teamData?.coordinatorId || '',
      createdAt: Date.now()
    });
    e.target.reset();
    alert("Solicitação de material enviada com sucesso!");
  };

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    try {
      const activeCoordId = resolvedCoordinatorId || coordinatorId || teamData?.coordinatorId || '';
      // Verificar se já existe um eleitor com este telefone antes de criar um novo dentro da mesma campanha
      if (!isEditingVoter && voterForm.phone && voterForm.phone.length > 5) {
        const q = query(
          collection(db, 'voters'), 
          where('phone', '==', voterForm.phone),
          where('coordinatorId', '==', activeCoordId)
        );
        const checkSnap = await getDocs(q);
        if (!checkSnap.empty) {
          alert("🚨 ATENÇÃO: Este telefone já está cadastrado na base geral da campanha! Não é permitido duplicar eleitores.");
          return;
        }
      }

      if (isEditingVoter && editingVoterId) {
        await firestoreService.setDocument('voters', editingVoterId, {
          ...voterForm,
          coordinatorId: activeCoordId,
          updatedAt: Date.now()
        }, true);
        await fetchServerCounts();
        alert("✅ CADASTRO ATUALIZADO COM SUCESSO!");
      } else {
        const payload = {
          ...voterForm,
          leaderId: user.uid,
          leaderName: profileData.name || user.displayName || "Líder",
          team: profileData.zone || "Base",
          createdAt: Date.now(),
          registeredBy: user.email || user.uid,
          createdBy: user.uid,
          coordinatorId: activeCoordId,
          location: null
        };
        await firestoreService.setDocument('voters', `voter_${Date.now()}`, payload);
        await fetchServerCounts();
        alert("✅ CADASTRO REALIZADO COM SUCESSO!");
      }
      
      setIsVoterModalOpen(false);
      setIsEditingVoter(false);
      setEditingVoterId(null);
      setVoterForm({ name: '', phone: '', address: '', observations: '', referredBy: '', tags: [], articulatorId: '', cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: '' });
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const downloadVoterTemplate = () => {
    const headers = [
      "Nome", 
      "WhatsApp", 
      "CPF", 
      "RG", 
      "Titulo", 
      "Zona", 
      "Secao", 
      "LocalVotacao", 
      "Endereco", 
      "Tags", 
      "IndicadoPor", 
      "Observacoes"
    ];
    const sampleRows = [
      [
        "José da Silva", 
        "(95) 99123-4567", 
        "123.456.789-00", 
        "1234567-SSP", 
        "123456789012", 
        "001", 
        "0150", 
        "Escola Estadual Getúlio Vargas", 
        "Av. Ville Roy, 1234 - Centro, Boa Vista - RR", 
        "Apoiador, Influenciador, Familia", 
        "Maria de Souza", 
        "Eleitor muito influente no bairro, solicitou visitas."
      ],
      [
        "Ana Paula Oliveira", 
        "(95) 98401-2233", 
        "987.654.321-11", 
        "7654321-SSP", 
        "987654321012", 
        "005", 
        "0042", 
        "Colégio Militarizado Elza Lacerda", 
        "Rua das Flores, 456 - Asa Branca, Boa Vista - RR", 
        "Lideranca, Setor Sul", 
        "Articulador João", 
        "Necessita de material para panfletagem no comércio."
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Eleitores");
    XLSX.writeFile(wb, "modelo_cadastro_eleitores.xlsx");
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkFileError(null);
    setBulkFileSuccess(null);
    setParsedVoters([]);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'doc' || fileExtension === 'docx' || fileExtension === 'pdf') {
      setBulkFileError(
        "⚠️ Arquivos de texto (.doc, .docx) ou documentos formatados (.pdf) não possuem estrutura tabular garantida. " +
        "Para garantir que nomes, CPFs, contatos e locais de votação sejam preenchidos individualmente nos campos corretos e sem erros, " +
        "o cadastro em lote exige a estrutura padronizada da Planilha Excel do Modelo. " +
        "Por favor, use a opção de baixar o modelo abaixo e preencha os dados em formato de tabela Excel para importar com 100% de segurança!"
      );
      e.target.value = '';
      return;
    }

    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      setBulkFileError("Por favor, selecione um arquivo de planilha válido (.xlsx, .xls ou .csv).");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
        
        if (data.length <= 1) {
          setBulkFileError("A planilha selecionada parece estar vazia ou conter apenas o cabeçalho.");
          return;
        }

        const headers = data[0].map((h: any) => String(h || '').trim().toLowerCase().replace(/\s+/g, ''));
        
        const nameIdx = headers.findIndex((h: string) => h.includes('nome'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('whatsapp') || h.includes('telefone') || h.includes('celular'));
        const cpfIdx = headers.findIndex((h: string) => h.includes('cpf'));
        const rgIdx = headers.findIndex((h: string) => h.includes('rg'));
        const tituloIdx = headers.findIndex((h: string) => h.includes('titulo') || h.includes('título'));
        const zonaIdx = headers.findIndex((h: string) => h.includes('zona'));
        const secaoIdx = headers.findIndex((h: string) => h.includes('secao') || h.includes('seção'));
        const localIdx = headers.findIndex((h: string) => h.includes('local') || h.includes('escola') || h.includes('votacao') || h.includes('votação'));
        const addrIdx = headers.findIndex((h: string) => h.includes('endereco') || h.includes('endereço') || h.includes('localizacao') || h.includes('localização'));
        const tagsIdx = headers.findIndex((h: string) => h.includes('tags') || h.includes('categoria') || h.includes('segmento'));
        const refIdx = headers.findIndex((h: string) => h.includes('indicado') || h.includes('referencia') || h.includes('referência'));
        const obsIdx = headers.findIndex((h: string) => h.includes('observacao') || h.includes('observação') || h.includes('observacoes') || h.includes('observações'));

        if (nameIdx === -1) {
          setBulkFileError("Coluna 'Nome' não encontrada na planilha. Certifique-se de usar o modelo padrão de Excel.");
          return;
        }

        const list: any[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          const name = String(row[nameIdx] || '').trim();
          if (!name) continue;

          const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';
          const cpf = cpfIdx !== -1 ? String(row[cpfIdx] || '').trim() : '';
          const rg = rgIdx !== -1 ? String(row[rgIdx] || '').trim() : '';
          const titulo = tituloIdx !== -1 ? String(row[tituloIdx] || '').trim() : '';
          const zona = zonaIdx !== -1 ? String(row[zonaIdx] || '').trim() : '';
          const secao = secaoIdx !== -1 ? String(row[secaoIdx] || '').trim() : '';
          const localVotacao = localIdx !== -1 ? String(row[localIdx] || '').trim() : '';
          const address = addrIdx !== -1 ? String(row[addrIdx] || '').trim() : '';
          const tagsStr = tagsIdx !== -1 ? String(row[tagsIdx] || '').trim() : '';
          const referredBy = refIdx !== -1 ? String(row[refIdx] || '').trim() : '';
          const observations = obsIdx !== -1 ? String(row[obsIdx] || '').trim() : '';

          const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

          list.push({
            name,
            phone,
            cpf,
            rg,
            titulo,
            zona,
            secao,
            localVotacao,
            address,
            tags,
            referredBy,
            observations
          });
        }

        if (list.length === 0) {
          setBulkFileError("Nenhum eleitor válido pôde ser importado da planilha. Verifique se a coluna 'Nome' está preenchida.");
          return;
        }

        setParsedVoters(list);
        setBulkFileSuccess(`✓ Planilha lida com sucesso! Encontrados ${list.length} eleitores prontos para cadastro.`);
      } catch (err: any) {
        setBulkFileError("Erro ao processar arquivo: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }
    if (parsedVoters.length === 0) {
      alert("Nenhum dado de eleitor carregado para salvar.");
      return;
    }

    setIsProcessingBulk(true);
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    try {
      for (const voter of parsedVoters) {
        try {
          const activeCoordId = resolvedCoordinatorId || coordinatorId || teamData?.coordinatorId || '';
          if (voter.phone && voter.phone.length > 5) {
            const q = query(
              collection(db, 'voters'), 
              where('phone', '==', voter.phone),
              where('coordinatorId', '==', activeCoordId)
            );
            const checkSnap = await getDocs(q);
            if (!checkSnap.empty) {
              duplicateCount++;
              continue;
            }
          }

          const payload = {
            ...voter,
            leaderId: user.uid,
            leaderName: profileData.name || user.displayName || "Líder",
            team: profileData.zone || "Base",
            createdAt: Date.now(),
            registeredBy: user.email || user.uid,
            createdBy: user.uid,
            coordinatorId: activeCoordId,
            location: null
          };

          await firestoreService.setDocument('voters', `voter_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, payload);
          successCount++;
        } catch (err) {
          console.error("Erro ao cadastrar eleitor em lote:", err);
          errorCount++;
        }
      }

      await fetchServerCounts();

      alert(
        `🎉 PROCESSO CONCLUÍDO!\n\n` +
        `• Sucesso: ${successCount} novos eleitores cadastrados\n` +
        `• Duplicados ignorados: ${duplicateCount}\n` +
        `• Erros: ${errorCount}`
      );

      setIsVoterModalOpen(false);
      setParsedVoters([]);
      setBulkFileSuccess(null);
      setBulkFileError(null);
      setRegisterMode('individual');
    } catch (err: any) {
      alert("Erro durante o processo de lote: " + err.message);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await firestoreService.setDocument('urgencies', `fuel_${Date.now()}`, {
        type: 'combustivel',
        title: `Solicitação de Combustível: ${fuelForm.amount}L`,
        description: fuelForm.reason,
        amount: fuelForm.amount,
        status: 'pendente',
        leaderId: user.uid,
        leaderName: profileData.name || user.displayName || 'Líder',
        team: profileData.zone || 'Pacaraima',
        coordinatorId: resolvedCoordinatorId || coordinatorId || '',
        createdAt: Date.now()
      });
      setIsFuelModalOpen(false);
      setFuelForm({ amount: '', reason: '' });
      alert("Solicitação enviada ao coordenador!");
    } catch (err: any) {
      alert("Erro ao solicitar: " + err.message);
    }
  };

  const handleDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await firestoreService.setDocument('urgencies', `demand_${Date.now()}`, {
        type: 'demanda',
        title: demandForm.title,
        description: demandForm.description,
        status: 'pendente',
        leaderId: user.uid,
        leaderName: profileData.name || user.displayName || 'Líder',
        team: profileData.zone || 'Pacaraima',
        coordinatorId: resolvedCoordinatorId || coordinatorId || '',
        createdAt: Date.now()
      });
      setIsDemandModalOpen(false);
      setDemandForm({ title: '', description: '' });
      alert("Demanda registrada e enviada!");
    } catch (err: any) {
      alert("Erro ao registrar: " + err.message);
    }
  };

  const handleAgendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // TAREFA 3: VALIDAR CHOQUE LOGÍSTICO (filtrado por campanha do coordenador)
      const activeCoordId = resolvedCoordinatorId || coordinatorId || '';
      const confirmedAgendas = await firestoreService.getCollectionFiltered<any>('agenda', activeCoordId);
      const validation = validarSugestaoAgenda(
        agendaForm as AgendaItem, 
        confirmedAgendas.filter(a => a.status === 'confirmado')
      );

      if (!validation.aprovada) {
        alert("⚠️ CHOQUE LOGÍSTICO: " + validation.motivo_recusa);
        return;
      }

      await firestoreService.setDocument('agenda', `agenda_${Date.now()}`, {
        ...agendaForm,
        status: 'pendente',
        sugeridoPorId: user.uid,
        sugeridoPor: profileData.name || user.displayName,
        coordinatorId: activeCoordId,
        createdAt: Date.now(),
        team: profileData.zone
      });

      setIsAgendaModalOpen(false);
      setAgendaForm({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });
      alert("Sugestão de agenda enviada para análise!");
    } catch (err: any) {
      alert("Erro ao sugerir agenda: " + err.message);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !teamData) return;
    
    const val = parseCurrencyToNumber(expenseForm.amount);
    if (isNaN(val) || val <= 0) return;

    // Check balance
    const currentBalance = (teamData.allocated || 0) - (teamData.spent || 0);
    if (val > currentBalance) {
      alert(`⚠️ SALDO INSUFICIENTE!\nSeu saldo atual é de R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      return;
    }

    try {
      // 1. Update Team Spent
      await firestoreService.updateDocument('teams', teamData.id, {
        spent: (teamData.spent || 0) + val
      });

      // 2. Create Transaction
      const txId = `tx_spent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument('transactions', txId, {
        id: txId,
        type: 'gasto',
        amount: val,
        team: teamData.name,
        description: expenseForm.description,
        purpose: expenseForm.purpose,
        coordinatorId: resolvedCoordinatorId || coordinatorId || '',
        date: Date.now()
      });

      setIsExpenseModalOpen(false);
      setExpenseForm({ amount: '', description: '', purpose: '' });
      alert("✅ GASTO REGISTRADO COM SUCESSO!");
    } catch (err: any) {
      alert("Erro ao registrar gasto: " + err.message);
    }
  };

  const handleSignReceipt = async (tx: any) => {
    if (!window.confirm("⚠️ CONFIRMAÇÃO DE RECEBIMENTO\nAo assinar, você confirma que recebeu integralmente este recurso e assume a responsabilidade pela prestação de contas.")) {
      return;
    }
    
    try {
      await firestoreService.updateDocument('transactions', tx.id, {
        receiptStatus: 'assinado',
        signedAt: Date.now(),
        signedBy: profileData.name || user?.displayName || user?.email
      });
      setIsSignReceiptModalOpen(false);
      alert("✅ RECIBO ASSINADO DIGITALMENTE!");
    } catch (err: any) {
      alert("Erro ao assinar recibo: " + err.message);
    }
  };

  const startVoiceNote = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz direto. Por favor, digite sua nota.");
      setIsNoteModalOpen(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setIsNoteModalOpen(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setNoteText(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleNoteSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !noteText.trim()) return;

    setIsProcessingNote(true);
    try {
      const processedNote = await processarNotaAudio(noteText);
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument('notes', noteId, {
        id: noteId,
        text: processedNote,
        originalText: noteText,
        leaderId: user.uid,
        authorId: user.uid,
        leaderName: profileData.name,
        authorName: profileData.name,
        team: profileData.zone,
        teamName: profileData.zone,
        type: activeTab === 'feed' ? 'tactical' : 'private',
        coordinatorId: coordinatorId || '',
        createdAt: Date.now()
      });
      setNoteText('');
      setIsNoteModalOpen(false);
      if (activeTab === 'feed') {
        alert("Nota postada no Feed Tático!");
      } else {
        alert("Anotação salva na sua agenda pessoal!");
      }
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      alert("Erro ao salvar nota.");
    } finally {
      setIsProcessingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Deseja excluir esta nota?")) {
      await firestoreService.deleteDocument('notes', id);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-yellow-500 selection:text-zinc-950 flex overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="hidden lg:flex w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex-col flex-shrink-0 relative z-20">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] group/profile relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl -mr-16 -mt-16 group-hover/profile:bg-yellow-500/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-yellow-500 p-2.5 rounded-sm shadow-xl shadow-yellow-500/10 border border-white/20">
              <ShieldCheck className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tighter leading-none uppercase">Rede Águia</h2>
              <p className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-1.5 opacity-80">Líder Regional</p>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-sm p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all">
              <User className="w-16 h-16" />
            </div>
            <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Perfil Ativo</p>
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase truncate">
              {profileData.name || user?.displayName || 'LÍDER'}
            </h3>
            <p className="text-[8px] font-bold text-yellow-600 dark:text-yellow-500 mt-2 uppercase tracking-widest">
              {profileData.zone || 'SETOR NÃO DEFINIDO'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto custom-scrollbar">
          {[
            { id: 'logistica', label: 'Painel Tático', icon: <MapPin className="w-4 h-4" /> },
            { id: 'equipe', label: 'Base de Eleitores', icon: <Users className="w-4 h-4" /> },
            { id: 'materiais', label: 'Gestão Materiais', icon: <Package className="w-4 h-4" /> },
            { id: 'notas', label: 'Notas de Voz', icon: <Mic className="w-4 h-4" /> },
            { id: 'feed', label: 'Feed Tático', icon: <MessageSquare className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all group ${
                activeTab === tab.id 
                ? 'bg-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/20' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={`${activeTab === tab.id ? 'text-zinc-950' : 'text-[var(--text-secondary)] group-hover:text-yellow-600'} transition-colors`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-white/5">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-sm bg-red-500/10 text-red-500 font-black text-[9px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <LogOut className="w-3.5 h-3.5" /> Desligar Terminal
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-6 lg:px-10 flex items-center justify-between flex-shrink-0 relative z-30 transition-colors duration-300">
          <div className="flex items-center gap-3 lg:hidden">
            <ShieldCheck className="w-6 h-6 text-yellow-500" />
            <h1 className="font-black text-base uppercase tracking-tighter text-[var(--text-primary)]">Líder Águia</h1>
          </div>

          <div className="hidden lg:flex items-center gap-3">
             <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-sm border border-yellow-500/20 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                Setor: {profileData.zone || 'Identificando...'}
             </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm text-[var(--text-secondary)] hover:bg-yellow-500 hover:text-zinc-950 active:scale-90 transition-all shadow-xl"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-sm border transition-all ${
                isOnline 
                ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4 animate-pulse" /> : <CloudOff className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                {isOnline ? 'Conexão Segura' : 'Modo Offline Ativo'}
              </span>
            </div>

            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm text-[var(--text-secondary)] hover:bg-yellow-500 hover:text-zinc-950 active:scale-95 transition-all shadow-[var(--shadow-sm)]"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12 custom-scrollbar pb-32 lg:pb-12 bg-[var(--bg-primary)] transition-colors duration-300">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {activeTab === 'logistica' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {isLocating && (
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/20 text-yellow-500 p-6 rounded-sm text-center flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                    <RefreshCcw className="w-6 h-6 animate-spin" /> Verificando Assinatura de GPS e Segurança de Campo...
                  </div>
                )}

                {dailyOrder?.text && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-950 border-2 border-yellow-500/50 rounded-sm p-10 shadow-[var(--shadow-md)] relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                      <ShieldCheck className="w-32 h-32 text-yellow-500 rotate-12" />
                    </div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-yellow-500 p-3 rounded-sm shadow-lg shadow-yellow-500/20"><Zap className="w-6 h-6 text-zinc-950" /></div>
                      <div>
                        <h3 className="text-white font-black text-xl uppercase tracking-tighter">Ordem do Dia</h3>
                        <p className="text-yellow-500 text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Diretriz Crítica de Campo</p>
                      </div>
                    </div>
                    <p className="text-white font-black text-2xl leading-relaxed border-l-4 border-yellow-500 pl-8 max-w-4xl italic">
                      "{dailyOrder.text}"
                    </p>
                    <div className="mt-10 flex items-center gap-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-yellow-500" /> Atualizado às {new Date(dailyOrder.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                )}

                {teamData?.observations && (
                  <section className="bg-white border-2 border-zinc-100 rounded-sm p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                      <StickyNote className="w-32 h-32 text-zinc-900 rotate-12" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-zinc-950 p-3 rounded-sm"><StickyNote className="w-6 h-6 text-yellow-500" /></div>
                      <h3 className="text-zinc-950 font-black text-xl uppercase tracking-tighter">Comunicações da Central</h3>
                    </div>
                    <p className="text-zinc-600 font-bold text-lg leading-relaxed whitespace-pre-wrap pl-2 border-l-4 border-yellow-500">
                      {teamData.observations}
                    </p>
                  </section>
                )}

                <section className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                  {[
                    { id: 'eleitor', label: 'Cadastrar Eleitor', sub: 'EXPANSÃO DE BASE', icon: <UserPlus className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'blue' },
                    { id: 'agenda', label: 'Sugerir Agenda', sub: 'MISSÕES LOCAIS', icon: <Calendar className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'emerald' },
                    { id: 'combustivel', label: 'Suporte / Fuel', sub: 'RECURSOS', icon: <Fuel className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'orange' },
                    { id: 'demanda', label: 'Ouvidoria / Feed', sub: 'PROBLEMAS', icon: <StickyNote className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'purple' }
                  ].map(action => (
                    <motion.button 
                      key={action.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => processAction(action.id as any)}
                      className={`aspect-square bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-sm p-6 lg:p-8 flex flex-col items-center justify-center gap-6 shadow-[var(--shadow-md)] border border-[var(--border-color)] hover:border-yellow-500/30 transition-all group relative overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                        {action.icon}
                      </div>
                      <div className={`p-5 rounded-sm transition-all shadow-inner ${
                        action.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-zinc-950' :
                        action.color === 'blue' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' :
                        action.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' :
                        action.color === 'orange' ? 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white' :
                        'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
                      }`}>
                        {action.icon}
                      </div>
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <span className="font-black text-xs lg:text-sm uppercase tracking-widest leading-none block">
                          {action.label}
                        </span>
                        <span className="text-[8px] font-black text-[var(--text-secondary)] mt-2.5 block tracking-[0.2em] uppercase opacity-60">
                          {action.sub}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
                  {myRequests.length > 0 && (
                    <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-10 shadow-[var(--shadow-sm)] overflow-hidden flex flex-col h-full group">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[var(--text-primary)] font-black text-lg uppercase tracking-tighter flex items-center gap-3">
                          <div className="bg-[var(--bg-tertiary)] p-2.5 rounded-sm group-hover:bg-zinc-950 group-hover:text-white transition-all shadow-inner border border-[var(--border-color)]"><RefreshCcw className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-yellow-500" /></div>
                          Fluxo de Suporte
                        </h3>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Últimas 5</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        {myRequests.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(req => (
                          <motion.div 
                            key={req.id} 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex items-center justify-between gap-6 hover:border-yellow-500/30 transition-all group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-sm shadow-inner ${
                                req.type === 'combustivel' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                                req.type === 'demanda' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                              }`}>
                                {req.type === 'combustivel' ? <Fuel className="w-5 h-5" /> : <StickyNote className="w-5 h-5" />}
                              </div>
                              <div className="text-left">
                                <p className="font-black text-[var(--text-primary)] text-xs uppercase leading-none mb-2 tracking-tight group-hover/item:text-yellow-600 transition-colors uppercase">{req.title}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">{new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-black px-4 py-2 rounded-sm uppercase tracking-widest shadow-sm border ${
                              req.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-500/20' : 
                              req.status === 'negado' ? 'bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                            }`}>
                              {req.status}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {myAgendas.length > 0 && (
                    <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-10 shadow-[var(--shadow-sm)] overflow-hidden flex flex-col h-full group">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[var(--text-primary)] font-black text-lg uppercase tracking-tighter flex items-center gap-3">
                          <div className="bg-[var(--bg-tertiary)] p-2.5 rounded-sm group-hover:bg-zinc-950 group-hover:text-white transition-all shadow-inner border border-[var(--border-color)]"><Calendar className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-emerald-500" /></div>
                          Monitor de Agenda
                        </h3>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Ativas</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        {myAgendas.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(agenda => (
                          <motion.div 
                            key={agenda.id} 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex items-center justify-between gap-6 hover:border-yellow-500/30 transition-all group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-sm shadow-inner ${
                                agenda.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 
                                agenda.status === 'negado' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'
                              }`}>
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="font-black text-[var(--text-primary)] text-xs uppercase leading-none mb-2 tracking-tight uppercase">{agenda.municipio}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">{new Date(agenda.data).toLocaleDateString()} • {agenda.hora_inicio}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-[9px] font-black px-4 py-2 rounded-sm uppercase tracking-widest shadow-sm border ${
                                agenda.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-500/20' : 
                                agenda.status === 'negado' ? 'bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20' : 'bg-[var(--bg-primary)] text-orange-600 border border-orange-500/20'
                              }`}>
                                {agenda.status === 'confirmado' ? 'APROVADA' : agenda.status === 'negado' ? 'NEGADA' : 'PENDENTE'}
                              </span>
                              {agenda.status === 'pendente' && (
                                <button 
                                  onClick={async () => {
                                    if(window.confirm("Abortar sugestão estratégica?")) {
                                      await firestoreService.deleteDocument('agenda', agenda.id);
                                    }
                                  }}
                                  className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest underline transition-colors"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-zinc-950 text-white rounded-sm p-10 shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent"></div>
                    <div className="bg-zinc-900/50 p-4 rounded-sm relative mb-6 w-max mx-auto shadow-inner border border-white/5">
                      <RefreshCcw className={`w-10 h-10 text-yellow-500 ${queueCount > 0 ? 'animate-spin-slow' : ''}`} />
                      {queueCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-zinc-950 text-xs font-black w-8 h-8 flex items-center justify-center rounded-sm border-4 border-zinc-950 shadow-2xl">
                          {queueCount}
                        </span>
                      )}
                    </div>
                    <div className="text-center relative z-10">
                      <h3 className="text-white font-black text-2xl tracking-tighter uppercase">{queueCount} Pacotes Offline</h3>
                      <p className="text-zinc-500 text-[10px] font-black mt-3 uppercase tracking-[0.3em]">
                        {isOnline ? 'Conexão estável com o terminal central' : 'Armazenamento local criptografado (sem rede)'}
                      </p>
                      {isOnline && queueCount > 0 && (
                        <button 
                          onClick={syncOfflineQueue}
                          className="mt-10 w-full bg-yellow-500 text-zinc-950 py-5 rounded-sm font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all active:scale-95"
                        >
                          Sincronizar Terminal
                        </button>
                      )}
                    </div>
                  </section>

                  <div className="bg-blue-600 p-10 rounded-sm flex flex-col justify-center relative overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-transparent opacity-20"></div>
                    <ShieldCheck className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12 group-hover:rotate-6 transition-all duration-500" />
                    <p className="text-white font-black text-2xl lg:text-3xl uppercase leading-tight text-left relative z-10 tracking-tighter">
                      "A vitória é o resultado do trabalho silencioso em cada bairro."
                    </p>
                    <div className="mt-8 flex items-center gap-4 relative z-10">
                       <div className="w-16 h-1 bg-white/30 rounded-sm overflow-hidden">
                          <motion.div initial={{ x: -100 }} animate={{ x: 0 }} transition={{ duration: 2, repeat: Infinity }} className="w-full h-full bg-white"></motion.div>
                       </div>
                       <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Comando Estratégico Águia</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'equipe' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-[var(--bg-secondary)] p-8 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-md)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-zinc-950 p-4 rounded-sm shadow-xl border border-white/5">
                    <Users className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none font-sans">Minha Equipe Regional</h2>
                    <p className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-[0.2em] mt-3 opacity-70">Base estratégica de eleitores fidelizados em campo</p>
                  </div>
                </div>
                
                <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-sm border border-[var(--border-color)] shadow-inner">
                  <button 
                    onClick={() => setVoterViewState('list')}
                    className={`px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      voterViewState === 'list' ? 'bg-yellow-500 text-zinc-950 shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Lista
                  </button>
                  <button 
                    onClick={() => setVoterViewState('network')}
                    className={`px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      voterViewState === 'network' ? 'bg-yellow-500 text-zinc-950 shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Rede
                  </button>
                </div>
              </div>

              {/* Advanced Search & Filtering */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    value={voterSearch}
                    onChange={e => setVoterSearch(e.target.value)}
                    placeholder="Pesquisar por nome ou telefone..."
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-sm py-4 pl-12 pr-4 text-xs font-bold text-zinc-900 outline-none focus:border-yellow-500 transition-all shadow-inner"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mr-2">Tags:</span>
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (voterFilterTags.includes(tag)) {
                          setVoterFilterTags(voterFilterTags.filter(t => t !== tag));
                        } else {
                          setVoterFilterTags([...voterFilterTags, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all ${
                        voterFilterTags.includes(tag)
                        ? 'bg-yellow-500 text-zinc-950 shadow-md'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {voterFilterTags.length > 0 && (
                    <button 
                      onClick={() => setVoterFilterTags([])}
                      className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-sm transition-colors text-[9px] font-black uppercase"
                    >
                      <X className="w-3 h-3 inline mr-1" /> Limpar
                    </button>
                  )}
                </div>
              </div>

              {voterViewState === 'list' ? (
                <div>
                  <div className="grid grid-cols-1 gap-4">
                    {paginatedVoters.length > 0 ? paginatedVoters.map((voter) => (
                      <motion.div 
                        key={voter.id} 
                        layout
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedVoter(voter);
                          setIsVoterDetailOpen(true);
                        }}
                        className="flex justify-between items-center p-5 bg-[var(--bg-secondary)] rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:border-yellow-500 hover:shadow-[var(--shadow-md)] transition-all cursor-pointer text-left group overflow-hidden relative"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-yellow-500/10 transition-colors pointer-events-none opacity-0 dark:opacity-100" />
                        
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] w-14 h-14 rounded-sm flex items-center justify-center font-black text-xl group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors shadow-inner border border-[var(--border-color)]">
                            {voter.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-[var(--text-primary)] text-base uppercase tracking-tighter leading-none mb-2">{voter.name}</p>
                            <div className="flex items-center gap-3">
                              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">{voter.phone || 'Sem Telefone'}</p>
                              {voter.tags && voter.tags.length > 0 && (
                                <div className="flex gap-1.5">
                                  {voter.tags.slice(0, 2).map((tag: string) => (
                                    <span key={tag} className="text-[7.5px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-yellow-500/20">{tag}</span>
                                  ))}
                                  {voter.tags.length > 2 && <span className="text-[8px] text-[var(--text-secondary)] font-black opacity-50">+{voter.tags.length - 2}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="text-[var(--text-secondary)] opacity-30 group-hover:text-yellow-500 group-hover:translate-x-1 group-hover:opacity-100 transition-all relative z-10" />
                      </motion.div>
                    )) : (
                      <div className="p-20 border-2 border-dashed border-zinc-200 rounded-sm text-center">
                        <Search className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                        <p className="font-black text-zinc-300 uppercase tracking-widest text-sm">Nenhum eleitor encontrado.</p>
                        {(voterSearch || voterFilterTags.length > 0) && (
                          <button 
                            onClick={() => { setVoterSearch(''); setVoterFilterTags([]); }}
                            className="mt-4 text-[10px] font-black text-yellow-600 underline uppercase tracking-widest"
                          >
                            Limpar todos os filtros
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {loadingPaginatedVoters && (
                    <div className="flex justify-center items-center gap-2 text-yellow-500 font-black text-[10px] uppercase tracking-widest mt-6">
                      <span className="animate-spin text-sm">🔄</span> Sincronizando dados com o servidor...
                    </div>
                  )}

                  {hasMoreVoters && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setVoterPage(prev => prev + 1)}
                        className="bg-yellow-500 text-zinc-950 hover:bg-yellow-400 font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
                      >
                        Carregar mais 50 eleitores
                      </button>
                    </div>
                  )}

                  {/* PAGINAÇÃO CABO */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm text-xs font-bold text-[var(--text-secondary)]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] uppercase font-black text-zinc-400">Itens por página:</span>
                      <select
                        value={voterPageSize}
                        onChange={(e) => {
                          setVoterPageSize(Number(e.target.value));
                          setVoterPage(1);
                        }}
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-sm p-1.5 px-3 font-black uppercase outline-none focus:border-yellow-500 transition-colors cursor-pointer text-[10px]"
                      >
                        {[5, 10, 15, 30, 50].map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400">
                        Exibindo {filteredVoters.length === 0 ? 0 : (voterPage - 1) * voterPageSize + 1} - {Math.min(voterPage * voterPageSize, filteredVoters.length)} de {filteredVoters.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={voterPage === 1}
                        onClick={() => setVoterPage(prev => Math.max(prev - 1, 1))}
                        className="p-2 px-3 border border-[var(--border-color)] rounded-sm bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-primary)] transition-all font-black text-[10px] uppercase tracking-wider"
                      >
                        Anterior
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (voterPage > 3 && totalPages > 5) {
                          if (voterPage + 2 <= totalPages) {
                            pageNum = voterPage - 3 + i + 1;
                          } else {
                            pageNum = totalPages - 5 + i + 1;
                          }
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setVoterPage(pageNum)}
                            className={`w-8 h-8 rounded-sm font-black border transition-all text-[10px] ${
                              voterPage === pageNum
                                ? 'bg-yellow-500 border-yellow-600 text-zinc-950 shadow-md'
                                : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        disabled={voterPage === totalPages}
                        onClick={() => setVoterPage(prev => Math.min(prev + 1, totalPages))}
                        className="p-2 px-3 border border-[var(--border-color)] rounded-sm bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-primary)] transition-all font-black text-[10px] uppercase tracking-wider"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <ReferralNetwork voters={filteredVoters} />
              )}
            </div>
          </motion.div>
        ) : activeTab === 'financeiro' ? (

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-zinc-950 p-10 rounded-sm border-b-[12px] border-emerald-500 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Wallet className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-3">Saldo Operacional Disponível</p>
                <h2 className="text-6xl font-black tracking-tighter leading-none mb-10">
                  R$ {((teamData?.allocated || 0) - (teamData?.spent || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <div className="flex gap-12 pt-8 border-t border-white/10">
                   <div>
                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Recursos Alocados</p>
                      <p className="text-xl font-black">{ (teamData?.allocated || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Despesas Processadas</p>
                      <p className="text-xl font-black text-red-500">{ (teamData?.spent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-[var(--bg-secondary)] p-8 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-[0.2em] flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Alocações do Comando
                  </h3>
                </div>
                <div className="space-y-4">
                  {teamTransactions.filter(t => t.type === 'alocacao').length > 0 ? teamTransactions.filter(t => t.type === 'alocacao').map(tx => (
                    <div key={tx.id} className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex justify-between items-center group/tx hover:border-emerald-500/30 transition-all shadow-inner">
                      <div className="text-left">
                        <p className="font-black text-xs uppercase text-[var(--text-primary)] mb-1 group-hover/tx:text-emerald-500 transition-colors">Recurso de Campo</p>
                        <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-tight opacity-70">"{tx.purpose || 'Logística tática'}"</p>
                      </div>
                      <div className="text-right flex items-center gap-5">
                        <div className="text-right">
                          <p className="font-black text-emerald-600 dark:text-emerald-500 text-sm">+ R$ {tx.amount.toLocaleString()}</p>
                          <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase opacity-50">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                        {tx.receiptStatus !== 'assinado' ? (
                          <button 
                            onClick={() => {
                              setSelectedTxToSign(tx);
                              setIsSignReceiptModalOpen(true);
                            }}
                            className="bg-yellow-500 text-zinc-950 px-4 py-2.5 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 active:scale-95 transition-all"
                          >
                            Assinar
                          </button>
                        ) : (
                          <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-sm border border-emerald-500/20 shadow-inner" title="Validado">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-12 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest opacity-40">Aguardando provisões...</p>
                  )}
                </div>
              </section>

              <section className="bg-[var(--bg-secondary)] p-8 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-[0.2em] flex items-center gap-3">
                    <History className="w-4 h-4 text-red-500" /> Histórico de Saídas
                  </h3>
                  <button 
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="bg-zinc-950 text-white px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-800 border border-white/5"
                  >
                    Novo Gasto
                  </button>
                </div>
                <div className="space-y-4">
                  {teamTransactions.filter(t => t.type === 'gasto').length > 0 ? teamTransactions.filter(t => t.type === 'gasto').map(tx => (
                    <div 
                      key={tx.id} 
                      onClick={() => {
                        setSelectedExpenseForVoucher(tx);
                        setIsExpenseVoucherModalOpen(true);
                      }}
                      className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex justify-between items-center cursor-pointer hover:border-red-500/30 transition-all border-l-4 border-l-red-500 group/tx shadow-inner"
                    >
                      <div className="text-left">
                        <p className="font-black text-xs uppercase text-[var(--text-primary)] mb-1 group-hover/tx:text-red-500 transition-colors uppercase">{tx.description}</p>
                        <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase mt-1 opacity-50">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="font-black text-red-600 text-base">- R$ {tx.amount.toLocaleString()}</p>
                        <FileText className="w-4 h-4 text-[var(--text-secondary)] opacity-30 group-hover/tx:text-red-500 group-hover/tx:opacity-100 transition-all" />
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-12 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest opacity-40">Sem registros de saída.</p>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        ) : activeTab === 'materiais' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6 transition-colors">
              <div>
                <h2 className="text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Gestão de Materiais</h2>
                <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Solicitação de suprimentos e materiais de campanha</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* REQUEST FORM */}
              <div className="lg:col-span-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-8 shadow-[var(--shadow-sm)] h-fit relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Package className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-black uppercase text-[var(--text-primary)] mb-8 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-yellow-500 rounded-sm shadow-lg shadow-yellow-500/20"><Plus className="w-4 h-4 text-zinc-950" /></div> Solicitar Material
                </h3>
                <form onSubmit={handleAddMaterialRequest} className="space-y-6 relative z-10">
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Tipo de Material</label>
                    <select name="materialId" required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors cursor-pointer">
                      <option value="">Selecione o Material</option>
                      {(() => {
                        const filtered = materials.filter(m => !resolvedCoordinatorId || m.coordinatorId === resolvedCoordinatorId);
                        const listToRender = filtered.length > 0 ? filtered : materials;
                        return listToRender.map(m => (
                          <option key={m.id} value={m.id} disabled={m.current <= 0}>
                            {m.name} ({m.current} disponíveis)
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Quantidade Desejada</label>
                    <input name="qty" type="number" required placeholder="Ex: 500" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors" />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Previsão de Devolução (Se aplicável)</label>
                    <input name="returnDate" type="date" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors cursor-pointer" />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Finalidade / Observação</label>
                    <textarea name="reason" placeholder="Para distribuição no bairro..." className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors min-h-[100px]" />
                  </div>
                  <button className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-4.5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-yellow-400">
                    Enviar Solicitação
                  </button>
                </form>
              </div>

              {/* REQUEST LIST */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">Minhas Solicitações</h3>
                {materialRequests.filter(r => r.leaderId === user.uid).length > 0 ? (
                  materialRequests.filter(r => r.leaderId === user.uid).sort((a, b) => b.createdAt - a.createdAt).map(req => (
                    <div key={req.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-yellow-500/30 transition-all shadow-[var(--shadow-sm)]">
                      <div className="flex items-start gap-5">
                        <div className={`w-14 h-14 bg-[var(--bg-tertiary)] rounded-sm flex items-center justify-center border border-[var(--border-color)] shadow-inner flex-shrink-0 ${
                          req.status === 'aprovado' ? 'text-emerald-500' : 
                          req.status === 'devolucao_pendente' ? 'text-blue-500 animate-pulse' :
                          req.status === 'devolvido' ? 'text-zinc-500' :
                          req.status === 'negado' ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight font-sans">{req.materialName} ({req.qty} un)</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</span>
                            <div className="w-1 h-1 bg-zinc-300 rounded-full"></div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              req.status === 'aprovado' ? 'text-emerald-600' : 
                              req.status === 'devolucao_pendente' ? 'text-blue-600' :
                              req.status === 'devolvido' ? 'text-zinc-500' :
                              req.status === 'negado' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {req.status === 'devolucao_pendente' ? 'Devolução Pendente' : req.status}
                            </span>
                            {req.receivedByLeader && (
                              <>
                                <div className="w-1 h-1 bg-zinc-300 rounded-full"></div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                                  ✓ RECEBIDO
                                </span>
                              </>
                            )}
                          </div>
                          {req.returnDate && (
                            <p className="mt-1.5 text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">
                              Previsão de Devolução: {new Date(req.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {req.returnedAt && (
                            <p className="mt-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              Enviado para Devolução em: {new Date(req.returnedAt).toLocaleString('pt-BR')}
                            </p>
                          )}
                          {req.returnApprovedAt && (
                            <p className="mt-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Devolução Confirmada em: {new Date(req.returnApprovedAt).toLocaleString('pt-BR')}
                            </p>
                          )}
                          {req.reason && <p className="mt-2 text-[10px] font-bold text-zinc-500 italic opacity-70">"{req.reason}"</p>}
                          
                          {req.signedBy && (
                            <div className="mt-3 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-sm flex items-center gap-2.5 w-fit">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <div className="leading-none text-left">
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">ASSINADO DIGITALMENTE POR: {req.signedBy}</span>
                                <p className="text-[7px] font-mono text-zinc-500 mt-1">AUTORIZAÇÃO: {req.signatureHash}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {req.status === 'aprovado' && !req.receivedByLeader && (
                        <button
                          onClick={async () => {
                            if (confirm("Confirmar recebimento deste lote de material?")) {
                              try {
                                await firestoreService.updateDocument('material_requests', req.id, {
                                  receivedByLeader: true,
                                  receivedAt: Date.now()
                                });
                                alert("Recebimento confirmado com sucesso!");
                              } catch (err: any) {
                                alert("Erro ao marcar como recebido: " + err.message);
                              }
                            }
                          }}
                          className="bg-emerald-500 text-zinc-950 px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 active:scale-95 transition-all self-end sm:self-center"
                        >
                          Marcar como Recebido
                        </button>
                      )}

                      {req.status === 'aprovado' && req.receivedByLeader && !req.returnedByLeader && (
                        <button
                          onClick={async () => {
                            if (confirm(`Confirmar devolução do material: ${req.materialName}?`)) {
                              try {
                                await firestoreService.updateDocument('material_requests', req.id, {
                                  status: 'devolucao_pendente',
                                  returnedByLeader: true,
                                  returnedAt: Date.now()
                                });
                                alert("Devolução registrada! O coordenador confirmará o recebimento de volta ao estoque.");
                              } catch (err: any) {
                                alert("Erro ao registrar devolução: " + err.message);
                              }
                            }
                          }}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-500 active:scale-95 transition-all self-end sm:self-center"
                        >
                          Devolver Material
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-sm grayscale opacity-30">
                    <Package className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px]">Nenhuma solicitação enviada.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'feed' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6 transition-colors">
              <div>
                <h2 className="text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Feed Tático</h2>
                <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Comunicação estratégica e fórum de campo • Tempo Real</p>
              </div>
              <button 
                onClick={() => setIsNoteModalOpen(true)}
                className="bg-yellow-500 text-zinc-950 px-6 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 active:scale-95 flex items-center gap-3"
              >
                <Plus className="w-4 h-4" /> Registrar Nota
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notes.filter(n => n.type === 'tactical').length > 0 ? (
                notes.filter(n => n.type === 'tactical').map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    user={user} 
                    isAdmin={isAdmin} 
                    currentUserName={profileData?.name} 
                    onDelete={() => firestoreService.deleteDocument('notes', note.id)} 
                  />
                ))
              ) : (
                <div className="col-span-full py-24 bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-sm text-center grayscale opacity-40">
                  <MessageSquare className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                  <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] text-[10px]">Aguardando diretivas táticas...</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'analise_eleitoral' ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <EleitoralDashboard isCoordinator={false} campaignVoters={voters} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-[var(--bg-secondary)] p-10 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10 border-b border-[var(--border-color)] pb-8">
                <div className="text-left">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)] leading-none">Notas Estratégicas</h2>
                  <p className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest mt-3 opacity-60">Diário Tático: Registre impressões regionais em áudio.</p>
                </div>
                <button 
                  onClick={startVoiceNote}
                  className="flex items-center gap-4 bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 px-8 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-yellow-400 transition-all shadow-2xl active:scale-95 group"
                >
                  <Mic className="w-5 h-5 text-yellow-500 dark:text-zinc-950 animate-pulse" />
                  Ativar Gravador Tático
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.filter(n => n.type === 'private' && n.authorId === user?.uid).length > 0 ? notes.filter(n => n.type === 'private' && n.authorId === user?.uid).map((note) => (
                  <NoteCard key={note.id} note={note} user={user} isAdmin={false} currentUserName={profileData?.name} onDelete={() => handleDeleteNote(note.id)} />
                )) : (
                  <div className="col-span-full py-24 border-2 border-dashed border-[var(--border-color)] rounded-sm text-center grayscale opacity-40">
                    <Mic className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                    <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] text-[10px]">Aguardando registro de informações regionais.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto transition-all"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-[var(--border-color)]"
            >
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-6 right-6 bg-[var(--bg-tertiary)] p-2.5 rounded-sm text-[var(--text-secondary)] hover:text-red-500 transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-zinc-950 p-8 border-b-4 border-yellow-500 text-left dark:bg-zinc-900 transition-colors">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Minhas Credenciais</h2>
                <p className="text-yellow-500/70 text-[10px] font-black mt-3 uppercase tracking-[0.2em] leading-none">Ajuste de Identidade Operacional</p>
              </div>

              <div className="p-10 space-y-8 text-left">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-60">Identificação Nominal</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm p-4.5 font-bold text-sm text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-all"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-60">Zona Operacional • Base</label>
                  <input 
                    type="text" 
                    value={profileData.address || ''}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm p-4.5 font-bold text-sm text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-all"
                    placeholder="Região de Atuação"
                  />
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={async () => {
                      try {
                        await firestoreService.updateDocument('users', user.uid, profileData);
                        setIsProfileModalOpen(false);
                      } catch (err: any) {
                        alert("Erro ao atualizar credenciais: " + err.message);
                      }
                    }}
                    className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-yellow-400"
                  >
                    ATUALIZAR IDENTIDADE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVoterDetailOpen && selectedVoter && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setIsVoterDetailOpen(false);
                  setSelectedVoter(null);
                }} 
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-8 border-b-4 border-yellow-500 text-left">
                <div className="flex items-center gap-4 mb-2">
                   <div className="bg-yellow-500 text-zinc-950 w-12 h-12 rounded-sm flex items-center justify-center font-black text-xl">
                      {selectedVoter.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{selectedVoter.name}</h2>
                      <p className="text-zinc-400 text-[10px] font-black mt-1 uppercase tracking-widest leading-none">Perfil do Eleitor Fidelizado</p>
                    </div>
                </div>
              </div>

              <div className="p-8 space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-black text-green-600 uppercase">Fidelizado</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cadastro em</p>
                    <p className="text-sm font-black text-zinc-800 uppercase">{new Date(selectedVoter.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-50 p-3 rounded-sm text-blue-600"><Phone className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Contato</p>
                      <button 
                        onClick={() => {
                          const cleanPhone = selectedVoter.phone.replace(/\D/g, '');
                          window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                        }}
                        className="text-lg font-black text-zinc-900 border-b-2 border-blue-500 flex items-center gap-2"
                      >
                        {selectedVoter.phone || 'Sem Telefone'}
                        <div className="bg-green-500 w-2 h-2 rounded-sm animate-pulse"></div>
                      </button>
                    </div>
                  </div>

                  {selectedVoter.referredBy && (
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-50 p-3 rounded-sm text-purple-600"><Handshake className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Indicado por</p>
                        <p className="text-base font-bold text-zinc-800 leading-tight">{selectedVoter.referredBy}</p>
                      </div>
                    </div>
                  )}

                  {selectedVoter.tags && selectedVoter.tags.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="bg-zinc-100 p-3 rounded-sm text-zinc-950"><Target className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Tags de Segmentação</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedVoter.tags.map((tag: string) => (
                            <span key={tag} className="bg-yellow-500/20 text-zinc-950 border border-yellow-500/30 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações Oficiais / Eleitorais */}
                  {(selectedVoter.cpf || selectedVoter.rg || selectedVoter.titulo || selectedVoter.zona || selectedVoter.secao || selectedVoter.localVotacao) && (
                    <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-sm space-y-3">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Dados Documentais e Eleitorais</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {selectedVoter.cpf && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">CPF</span>
                            <span className="font-extrabold text-zinc-900">{selectedVoter.cpf}</span>
                          </div>
                        )}
                        {selectedVoter.rg && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">RG</span>
                            <span className="font-extrabold text-zinc-900">{selectedVoter.rg}</span>
                          </div>
                        )}
                        {selectedVoter.titulo && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">Título de Eleitor</span>
                            <span className="font-extrabold text-zinc-900">{selectedVoter.titulo}</span>
                          </div>
                        )}
                        {(selectedVoter.zona || selectedVoter.secao) && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">Zona / Seção</span>
                            <span className="font-extrabold text-zinc-900">
                              {selectedVoter.zona || '—'} / {selectedVoter.secao || '—'}
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedVoter.localVotacao && (
                        <div className="border-t border-zinc-100 pt-2 mt-2 text-xs">
                          <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">Local de Votação</span>
                          <span className="font-extrabold text-zinc-950 flex items-center gap-1.5 uppercase">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 inline" /> {selectedVoter.localVotacao}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="bg-zinc-100 p-3 rounded-sm text-zinc-950"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Localização / Base</p>
                      <p className="text-base font-bold text-zinc-800 leading-tight">{selectedVoter.address || 'Não informado'}</p>
                    </div>
                  </div>

                  {selectedVoter.observations && (
                    <div className="flex items-start gap-4">
                      <div className="bg-yellow-50 p-3 rounded-sm text-yellow-600"><StickyNote className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Observações de Campo</p>
                        <p className="text-sm font-bold text-zinc-600">"{selectedVoter.observations}"</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t-2 border-zinc-50">
                  <button 
                    onClick={() => {
                      setVoterForm({
                        name: selectedVoter.name,
                        phone: selectedVoter.phone,
                        address: selectedVoter.address,
                        observations: selectedVoter.observations || '',
                        referredBy: selectedVoter.referredBy || '',
                        tags: selectedVoter.tags || [],
                        articulatorId: selectedVoter.articulatorId || '',
                        cpf: selectedVoter.cpf || '',
                        rg: selectedVoter.rg || '',
                        titulo: selectedVoter.titulo || '',
                        zona: selectedVoter.zona || '',
                        secao: selectedVoter.secao || '',
                        localVotacao: selectedVoter.localVotacao || ''
                      });
                      setEditingVoterId(selectedVoter.id);
                      setIsEditingVoter(true);
                      setIsVoterModalOpen(true);
                      setIsVoterDetailOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 py-4 rounded-sm font-black text-xs uppercase tracking-widest shadow-sm active:bg-zinc-200 transition-all"
                  >
                    <Settings className="w-4 h-4" /> Editar Dados
                  </button>
                  <button 
                    onClick={() => handleDeleteVoter(selectedVoter.id)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-sm font-black text-xs uppercase tracking-widest shadow-md hover:bg-red-700 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Registro
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CADASTRAR ELEITOR */}
      <AnimatePresence>
        {isVoterModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200 flex flex-col max-h-[90vh] md:max-h-[85vh]"
            >
              <button 
                onClick={() => {
                   setIsVoterModalOpen(false);
                   setIsEditingVoter(false);
                   setEditingVoterId(null);
                   setVoterForm({ name: '', phone: '', address: '', observations: '', referredBy: '', tags: [], articulatorId: '', cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: '' });
                   setRegisterMode('individual');
                   setBulkFileError(null);
                   setBulkFileSuccess(null);
                   setParsedVoters([]);
                   setIsProcessingBulk(false);
                }} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-zinc-950 p-6 flex-shrink-0">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                  {isEditingVoter ? 'Editar Registro' : 'Novo Alistamento'}
                </h2>
                <p className="text-zinc-400 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Inteligência Territorial e Base de Dados</p>
              </div>

              {!isEditingVoter && (
                <div className="flex border-b border-zinc-200 bg-zinc-50 p-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setRegisterMode('individual')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all rounded-sm ${
                      registerMode === 'individual'
                        ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    ✦ Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterMode('lote')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all rounded-sm ${
                      registerMode === 'lote'
                        ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    🗂️ Lote
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterMode('link')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all rounded-sm ${
                      registerMode === 'link'
                        ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    🔗 Link Externo
                  </button>
                </div>
              )}

              {registerMode === 'individual' || isEditingVoter ? (
                <form onSubmit={handleVoterSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo do Cidadão</label>
                    <input required type="text" value={voterForm.name} onChange={e => setVoterForm({...voterForm, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Digite identificação oficial..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">WhatsApp / Terminal Celular</label>
                    <input type="text" value={voterForm.phone} onChange={e => setVoterForm({...voterForm, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Localização Operacional</label>
                    <input type="text" value={voterForm.address} onChange={e => setVoterForm({...voterForm, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Rua, Bairro ou Referência..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">CPF</label>
                      <input type="text" value={voterForm.cpf || ''} onChange={e => setVoterForm({...voterForm, cpf: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="000.000.000-00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">RG</label>
                      <input type="text" value={voterForm.rg || ''} onChange={e => setVoterForm({...voterForm, rg: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Registro Geral RG..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título</label>
                      <input type="text" value={voterForm.titulo || ''} onChange={e => setVoterForm({...voterForm, titulo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Nº Título..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Zona</label>
                      <input type="text" value={voterForm.zona || ''} onChange={e => setVoterForm({...voterForm, zona: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Zona..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seção</label>
                      <input type="text" value={voterForm.secao || ''} onChange={e => setVoterForm({...voterForm, secao: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Seção..." />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Local de Votação</label>
                    <input type="text" value={voterForm.localVotacao || ''} onChange={e => setVoterForm({...voterForm, localVotacao: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Nome da Escola / Seção..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Articulador / Parceiro Associado</label>
                    <select 
                      value={voterForm.articulatorId} 
                      onChange={e => setVoterForm({...voterForm, articulatorId: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all appearance-none"
                    >
                      <option value="">NENHUM ARTICULADOR SELECIONADO</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Indicado por (Selecione um eleitor cadastrado)</label>
                    <div className="relative">
                      <select 
                        value={voterForm.referredBy} 
                        onChange={e => setVoterForm({...voterForm, referredBy: e.target.value})} 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all appearance-none"
                      >
                        <option value="">NENHUM INDICIADOR SELECIONADO</option>
                        {[...campaignVoters]
                          .filter(v => !isEditingVoter || v.id !== editingVoterId)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(v => (
                            <option key={v.id} value={v.name}>{v.name} {v.phone ? `(${v.phone})` : ''}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Tags de Segmentação</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {voterForm.tags.map(tag => (
                        <span key={tag} className="bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-sm text-[9px] font-black uppercase flex items-center gap-2">
                          {tag}
                          <button type="button" onClick={() => setVoterForm({...voterForm, tags: voterForm.tags.filter(t => t !== tag)})}>
                            <X className="w-2 h-2" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={currentTag} 
                        onChange={e => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (currentTag.trim() && !voterForm.tags.some(t => t.trim().toUpperCase() === currentTag.trim().toUpperCase())) {
                              setVoterForm({...voterForm, tags: [...voterForm.tags, currentTag.trim()]});
                              setCurrentTag('');
                            }
                          }
                        }}
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                        placeholder="Adicionar tag (Enter)..." 
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (currentTag.trim() && !voterForm.tags.some(t => t.trim().toUpperCase() === currentTag.trim().toUpperCase())) {
                            setVoterForm({...voterForm, tags: [...voterForm.tags, currentTag.trim()]});
                            setCurrentTag('');
                          }
                        }}
                        className="bg-zinc-950 text-white px-4 rounded-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {availableTags.length > 0 && (
                      <div className="mt-2.5">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-1">Tags Disponíveis no Sistema (Clique para Adicionar)</label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-50 border border-zinc-200 rounded-sm">
                          {availableTags.map(tag => {
                            const isSelected = voterForm.tags.some(t => t.trim().toUpperCase() === tag.toUpperCase());
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (!isSelected) {
                                    setVoterForm({
                                      ...voterForm,
                                      tags: [...voterForm.tags, tag]
                                    });
                                  } else {
                                    setVoterForm({
                                      ...voterForm,
                                      tags: voterForm.tags.filter(t => t.trim().toUpperCase() !== tag.toUpperCase())
                                    });
                                  }
                                }}
                                className={`px-2 py-1 text-[9px] font-black uppercase rounded-sm border transition-all ${
                                  isSelected
                                    ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/40 hover:bg-yellow-500/10'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-500/50 hover:text-zinc-850'
                                }`}
                              >
                                {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Observações Técnicas de Campo</label>
                    <textarea value={voterForm.observations} onChange={e => setVoterForm({...voterForm, observations: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24 resize-none placeholder:text-zinc-300" placeholder="Histórico de engajamento ou demandas específicas..." />
                  </div>
                  <button type="submit" className="w-full bg-yellow-500 text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/10 hover:bg-yellow-600 transition-all active:scale-[0.98] mt-2">
                    {isEditingVoter ? 'ATUALIZAR REGISTRO' : 'EFETIVAR ALISTAMENTO'}
                  </button>
                </form>
              ) : registerMode === 'lote' ? (
                <form onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      <FileDown className="w-4 h-4 text-yellow-500" />
                      Como funciona o Cadastro em Lote?
                    </h3>
                    <p className="text-[11px] text-zinc-600 leading-relaxed font-bold">
                      Cadastre dezenas de eleitores de uma vez só! Utilize nossa planilha modelo para preencher as colunas padronizadas de dados e suba o arquivo abaixo para importação instantânea.
                    </p>
                    
                    <button
                      type="button"
                      onClick={downloadVoterTemplate}
                      className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-zinc-950 rounded-sm font-black text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95"
                    >
                      <FileDown className="w-4 h-4" />
                      Baixar Modelo de Planilha (.XLSX)
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                      Selecione o arquivo para Cadastro em Lote
                    </label>
                    <div className="border-2 border-dashed border-zinc-300 rounded-sm p-8 text-center hover:border-yellow-500 transition-all bg-zinc-50 relative cursor-pointer group">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.doc,.docx,.pdf"
                        onChange={handleBulkFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-yellow-500 transition-colors" />
                        <span className="text-[11px] font-black uppercase text-zinc-700">
                          Clique ou arraste a planilha aqui
                        </span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">
                          Suporta arquivos de planilha (.xlsx, .xls, .csv)
                        </span>
                      </div>
                    </div>
                  </div>

                  {bulkFileError && (
                    <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-[11px] text-red-600 font-bold leading-relaxed whitespace-pre-wrap shadow-inner">
                      {bulkFileError}
                    </div>
                  )}

                  {bulkFileSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 text-[11px] text-emerald-600 font-bold leading-relaxed shadow-inner">
                      {bulkFileSuccess}
                    </div>
                  )}

                  {parsedVoters.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                        Pré-visualização do Lote (Primeiros 5 registros)
                      </label>
                      <div className="border border-zinc-200 rounded-sm overflow-hidden text-[10px] bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-100 border-b border-zinc-200 text-[8px] font-black uppercase text-zinc-500">
                              <th className="py-2 px-3">Nome</th>
                              <th className="py-2 px-3">WhatsApp</th>
                              <th className="py-2 px-3">Zona/Seção</th>
                              <th className="py-2 px-3">Local de Votação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {parsedVoters.slice(0, 5).map((pv, idx) => (
                              <tr key={idx} className="bg-white text-zinc-700 font-bold">
                                <td className="py-2 px-3 uppercase truncate max-w-[120px]">{pv.name}</td>
                                <td className="py-2 px-3 font-mono">{pv.phone || '---'}</td>
                                <td className="py-2 px-3 font-mono">{pv.zona ? `${pv.zona}/${pv.secao}` : '---'}</td>
                                <td className="py-2 px-3 truncate max-w-[150px] uppercase">{pv.localVotacao || '---'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsedVoters.length > 5 && (
                          <div className="bg-zinc-50 p-2 text-center text-[9px] font-black text-zinc-500 border-t border-zinc-200 uppercase">
                            e mais {parsedVoters.length - 5} eleitores na lista...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={parsedVoters.length === 0 || isProcessingBulk}
                    className={`w-full py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] mt-2 ${
                      parsedVoters.length === 0 || isProcessingBulk
                        ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                        : 'bg-yellow-500 text-zinc-950 shadow-yellow-500/10 hover:bg-yellow-600'
                    }`}
                  >
                    {isProcessingBulk ? 'SALVANDO LOTE NO FIRESTORE...' : `IMPORTAR ${parsedVoters.length} ELEITORES EM LOTE`}
                  </button>
                </form>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      ✦ Link de Autocadastro de Eleitor
                    </h3>
                    <p className="text-[11px] text-zinc-600 leading-relaxed font-bold">
                      Compartilhe este link exclusivo para que os eleitores realizem o próprio cadastro de forma rápida. Todos que se cadastrarem por este link serão automaticamente alocados na sua equipe tática.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seu Link de Cadastro</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        type="text" 
                        value={`${window.location.origin}/?leaderId=${user?.uid}`} 
                        className="flex-1 bg-zinc-100 border border-zinc-200 rounded-sm p-4 font-mono text-[11px] text-zinc-700 outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/?leaderId=${user?.uid}`);
                          alert("✅ Link copiado para a área de transferência!");
                        }}
                        className="px-5 bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-black text-[10px] uppercase tracking-wider rounded-sm active:scale-95 transition-all"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: PEDIR COMBUSTÍVEL */}
      <AnimatePresence>
        {isFuelModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsFuelModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-blue-600 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Logística de Suporte</h2>
                <p className="text-blue-200 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Requisição Oficial de Combustível</p>
              </div>
              <form onSubmit={handleFuelSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Volume Necessário (Operação em Litros)</label>
                  <input required type="number" value={fuelForm.amount} onChange={e => setFuelForm({...fuelForm, amount: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-2xl text-zinc-900 outline-none focus:border-blue-500 transition-all placeholder:text-zinc-300" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Roteiro Planejado e Justificativa</label>
                  <textarea required value={fuelForm.reason} onChange={e => setFuelForm({...fuelForm, reason: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-blue-500 transition-all h-32 resize-none placeholder:text-zinc-300" placeholder="Descreva o trajeto e comunidades atendidas..." />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-[0.98] mt-2">ENVIAR REQUISIÇÃO</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: REGISTRAR DEMANDA */}
      <AnimatePresence>
        {isDemandModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsDemandModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-yellow-500 p-6">
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Demanda Territorial</h2>
                <p className="text-zinc-900 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Monitoramento de Necessidades Sociais</p>
              </div>
              <form onSubmit={handleDemandSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Natureza da Demanda</label>
                  <input required type="text" value={demandForm.title} onChange={e => setDemandForm({...demandForm, title: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-600 transition-all placeholder:text-zinc-300" placeholder="Ex: Saneamento, Saúde, Infraestrutura..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Briefing Detalhado</label>
                  <textarea required value={demandForm.description} onChange={e => setDemandForm({...demandForm, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-600 transition-all h-32 resize-none placeholder:text-zinc-300" placeholder="Descreva a urgência e o impacto na comunidade..." />
                </div>
                <button type="submit" className="w-full bg-yellow-500 text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/10 hover:bg-yellow-600 transition-all active:scale-[0.98] mt-2">ENVIAR PARA COORDENAÇÃO</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: COMPROVANTE DE GASTO (VOUCHER) */}
      <AnimatePresence>
        {isExpenseVoucherModalOpen && selectedExpenseForVoucher && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-xl p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-sm overflow-hidden shadow-2xl relative p-8 md:p-12 text-zinc-950 border border-zinc-200"
            >
              <button 
                onClick={() => setIsExpenseVoucherModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border border-zinc-200 p-6 md:p-8 rounded-sm space-y-6 md:space-y-8 relative">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="bg-red-600 p-2 rounded-sm"><DollarSign className="text-white w-5 h-5 md:w-6 md:h-6" /></div>
                      <div>
                        <h3 className="font-black text-lg md:text-xl leading-none uppercase tracking-tighter">VOUCHER DE GASTO</h3>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Comprovante de Saída Operacional</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">ID Operação</p>
                      <p className="font-mono text-xs font-black uppercase text-zinc-950">{selectedExpenseForVoucher.id.split('_').pop()}</p>
                   </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                   <div className="bg-zinc-50 p-6 rounded-sm border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Discriminação</p>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                         <div>
                            <p className="text-xl font-black text-zinc-950 leading-tight uppercase">{selectedExpenseForVoucher.description}</p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">Finalidade: {selectedExpenseForVoucher.purpose}</p>
                            <p className="text-[8px] font-black text-zinc-400 uppercase mt-4 tracking-widest">Data/Hora: {new Date(selectedExpenseForVoucher.date).toLocaleString('pt-BR')}</p>
                         </div>
                         <div className="text-left md:text-right w-full md:w-auto">
                            <p className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter">R$ {selectedExpenseForVoucher.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-zinc-50 p-6 rounded-sm border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Unidade Responsável</p>
                      <p className="text-base font-black text-zinc-950 uppercase tracking-tight">{selectedExpenseForVoucher.team}</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-0.5">Líder: {profileData.name}</p>
                   </div>

                   <p className="text-[8px] font-black leading-relaxed text-zinc-400 text-center uppercase tracking-[0.2em] pt-4">
                      Protocolo Digital Gerado via Rede Águia
                   </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 print:hidden">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center gap-2 bg-zinc-950 text-white px-6 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-zinc-200"
                 >
                   <Printer className="w-4 h-4" /> Gerar Documento (PDF)
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ASSINAR RECIBO */}
      <AnimatePresence>
        {isSignReceiptModalOpen && selectedTxToSign && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-xl p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-sm overflow-hidden shadow-2xl relative p-8 md:p-12 text-zinc-950 border border-zinc-200"
            >
              <button 
                onClick={() => setIsSignReceiptModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border border-zinc-200 p-6 md:p-8 rounded-sm space-y-6 md:space-y-8 relative">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="bg-zinc-950 p-2 rounded-sm"><ShieldCheck className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" /></div>
                      <div>
                        <h3 className="font-black text-lg md:text-xl leading-none uppercase tracking-tighter">PROTOCOLO ÁGUIA</h3>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Comprovante de Transferência Digital</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Nº Doc</p>
                      <p className="font-mono text-xs font-black text-zinc-950">{selectedTxToSign.id.split('_').pop()?.toUpperCase()}</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-zinc-50 p-6 rounded-sm border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Beneficiário e Valor</p>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                         <div>
                            <p className="text-xl font-black text-zinc-950 leading-tight uppercase">{selectedTxToSign.team}</p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">Finalidade: {selectedTxToSign.purpose || 'Uso Operacional'}</p>
                         </div>
                         <div className="text-left md:text-right w-full md:w-auto">
                            <p className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tighter">R$ {selectedTxToSign.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   </div>

                   <p className="text-[11px] font-medium leading-relaxed text-zinc-600 text-justify bg-zinc-50/50 p-4 rounded-sm border border-zinc-100">
                      Eu, líder da equipe regional <strong className="text-zinc-950 font-black">{selectedTxToSign.team}</strong>, declaro ter recebido em {new Date(selectedTxToSign.date).toLocaleDateString('pt-BR')} a importância acima, comprometendo-me com as diretrizes táticas do sistema.
                   </p>

                   <div className="pt-8 grid grid-cols-2 gap-8">
                      <div className="text-center border-t border-zinc-200 pt-4">
                         <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Origem Operacional</p>
                         <p className="font-black text-[9px] uppercase tracking-tighter text-zinc-950">Validado Eletronicamente</p>
                      </div>
                      <div className="text-center border-t border-zinc-200 pt-4">
                         <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Receptor / Líder</p>
                         <p className="text-zinc-400 font-bold text-[9px] uppercase">Assinatura Pendente</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row justify-end gap-3 print:hidden">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 px-6 py-4 rounded-sm font-black text-[9px] uppercase tracking-widest hover:bg-zinc-200 transition-all font-sans"
                 >
                   <Printer className="w-4 h-4" /> Imprimir Recibo
                 </button>
                 <button 
                   onClick={() => handleSignReceipt(selectedTxToSign)}
                   className="bg-green-600 text-white px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                 >
                   Confirmar e Assinar
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ADICIONAR GASTO */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsExpenseModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-red-600 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Controle de Saídas</h2>
                <p className="text-red-100 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Registro de Despesa da Equipe</p>
              </div>
              <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Descrição do Gasto</label>
                  <input required type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" placeholder="Ex: Alimentação Equipe Campo..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Finalidade / Categoria Operacional</label>
                  <input required type="text" value={expenseForm.purpose} onChange={e => setExpenseForm({...expenseForm, purpose: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" placeholder="Ex: Logística, Emergência, Apoio..." />
                </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Montante (Valores em R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">R$</span>
                      <input 
                        required 
                        type="text" 
                        value={expenseForm.amount} 
                        onChange={e => setExpenseForm({...expenseForm, amount: maskCurrency(e.target.value)})} 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 pl-10 font-black text-2xl text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" 
                        placeholder="0,00" 
                      />
                    </div>
                  </div>
                <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/10 hover:bg-red-700 transition-all active:scale-[0.98] mt-2">EFETIVAR SAÍDA</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: SUGERIR AGENDA */}
      <AnimatePresence>
        {isAgendaModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsAgendaModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-orange-500 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Logística Proativa</h2>
                <p className="text-orange-100 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Proposta de Itinerário Estratégico</p>
              </div>
              <form onSubmit={handleAgendaSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Local Operacional (Município)</label>
                  <select 
                    required 
                    value={agendaForm.municipio} 
                    onChange={e => setAgendaForm({...agendaForm, municipio: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="" className="font-black">Selecione localidade...</option>
                    {["Boa Vista", "Pacaraima", "Rorainópolis", "Uiramutã", "Cantá", "Alto Alegre", "Mucajaí", "Amajari", "Bonfim", "Normandia", "Caracaraí", "Iracema", "Bonfim", "São João da Baliza", "São Luiz", "Caroebe"].map(m => (
                      <option key={m} value={m} className="font-bold">{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Data da Missão Sugerida</label>
                  <input required type="date" value={agendaForm.data} onChange={e => setAgendaForm({...agendaForm, data: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Horário Início</label>
                    <input required type="time" value={agendaForm.hora_inicio} onChange={e => setAgendaForm({...agendaForm, hora_inicio: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Horário Fim</label>
                    <input required type="time" value={agendaForm.hora_fim} onChange={e => setAgendaForm({...agendaForm, hora_fim: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block leading-none">Justificativa e Objetivos Táticos</label>
                  <textarea required value={agendaForm.motivo} onChange={e => setAgendaForm({...agendaForm, motivo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-orange-500 transition-all h-24 resize-none placeholder:text-zinc-300" placeholder="Descreva os objetivos da diligência..." />
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/10 hover:bg-orange-700 transition-all active:scale-[0.98] mt-2">ENVIAR PROPOSTA</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: GRAVAR NOTA */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsNoteModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-zinc-950 p-6 flex items-center gap-4">
                <div className={`p-3 rounded-sm ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}>
                  <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Anotação Tática</h2>
                  <p className="text-zinc-500 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">
                    {isRecording ? 'Escutando relato...' : 'Transcrição ou Digitação'}
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Conteúdo da Nota</label>
                  <textarea 
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-sm p-4 font-bold text-zinc-800 text-sm h-48 outline-none focus:border-yellow-500 transition-all resize-none"
                    placeholder="O que você está pensando? Ou continue gravando..."
                  />
                </div>
                
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button 
                      onClick={startVoiceNote}
                      className="flex-1 bg-zinc-100 text-zinc-900 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Mic className="w-4 h-4" /> REINICIAR VOZ
                    </button>
                  ) : (
                    <div className="flex-1 bg-red-100 text-red-600 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div> ESCUTANDO...
                    </div>
                  )}
                  <button 
                    onClick={() => handleNoteSubmit()}
                    disabled={isProcessingNote || !noteText.trim()}
                    className={`flex-1 ${isProcessingNote ? 'bg-zinc-400' : 'bg-yellow-500'} text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2`}
                  >
                    {isProcessingNote ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isProcessingNote ? 'PROCESSANDO...' : 'SALVAR NOTA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-sm flex items-center justify-around px-4 z-50 shadow-2xl">
        {[
          { id: 'logistica', label: 'Tático', icon: <MapPin className="w-5 h-5" /> },
          { id: 'equipe', label: 'Equipe', icon: <Users className="w-5 h-5" /> },
          { id: 'notas', label: 'Notas', icon: <Mic className="w-5 h-5" /> },
          { id: 'feed', label: 'Feed', icon: <History className="w-5 h-5" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id 
              ? 'text-yellow-500 scale-110' 
              : 'text-zinc-500'
            }`}
          >
            <div className={`p-2 rounded-sm transition-all ${activeTab === tab.id ? 'bg-yellow-500/10' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.1em]">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

