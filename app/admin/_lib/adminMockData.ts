import type { PalierId, SectionId } from "../../lib/mockData";

export type DemandeInscription = {
  id: string;
  parentPrenom: string;
  parentNom: string;
  email: string;
  telephone: string;
  date: string;
  enfants: {
    prenom: string;
    nom: string;
    palierId: PalierId;
    niveauId: string;
    section: SectionId;
  }[];
};

export const demandesInitiales: DemandeInscription[] = [
  {
    id: "d1",
    parentPrenom: "Karim",
    parentNom: "Brahimi",
    email: "k.brahimi@email.dz",
    telephone: "+213 5 55 12 34 56",
    date: "2026-05-21",
    enfants: [
      { prenom: "Yasmine", nom: "Brahimi", palierId: "primaire", niveauId: "cp", section: "A" },
    ],
  },
  {
    id: "d2",
    parentPrenom: "Amira",
    parentNom: "Saidi",
    email: "amira.s@email.dz",
    telephone: "+213 6 77 88 99 00",
    date: "2026-05-20",
    enfants: [
      { prenom: "Imad", nom: "Saidi", palierId: "college", niveauId: "6e", section: "B" },
      { prenom: "Sarah", nom: "Saidi", palierId: "primaire", niveauId: "cm1", section: "A" },
    ],
  },
  {
    id: "d3",
    parentPrenom: "Riad",
    parentNom: "Belkacem",
    email: "r.belkacem@email.dz",
    telephone: "+213 7 12 34 56 78",
    date: "2026-05-19",
    enfants: [
      { prenom: "Adam", nom: "Belkacem", palierId: "maternelle", niveauId: "ms", section: "A" },
    ],
  },
];

export type CompteParent = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  inscritDepuis: string;
  statut: "actif" | "suspendu";
  nbEnfants: number;
  derniereConnexion: string;
  codeAcces: string;
};

export const comptesParentsInitiaux: CompteParent[] = [
  {
    id: "p1",
    prenom: "Amina",
    nom: "Benali",
    email: "demo@parent.fr",
    telephone: "+213 6 12 34 56 78",
    inscritDepuis: "2025-09-15",
    statut: "actif",
    nbEnfants: 3,
    derniereConnexion: "2026-05-22",
    codeAcces: "847219",
  },
  {
    id: "p2",
    prenom: "Hocine",
    nom: "Bouzid",
    email: "h.bouzid@email.dz",
    telephone: "+213 5 11 22 33 44",
    inscritDepuis: "2025-09-20",
    statut: "actif",
    nbEnfants: 2,
    derniereConnexion: "2026-05-21",
    codeAcces: "192834",
  },
  {
    id: "p3",
    prenom: "Nadia",
    nom: "Hamidi",
    email: "n.hamidi@email.dz",
    telephone: "+213 7 99 88 77 66",
    inscritDepuis: "2025-10-02",
    statut: "actif",
    nbEnfants: 1,
    derniereConnexion: "2026-05-22",
    codeAcces: "563801",
  },
  {
    id: "p4",
    prenom: "Samir",
    nom: "Khedim",
    email: "s.khedim@email.dz",
    telephone: "+213 6 44 55 66 77",
    inscritDepuis: "2026-02-10",
    statut: "suspendu",
    nbEnfants: 1,
    derniereConnexion: "2026-04-15",
    codeAcces: "905237",
  },
];

export type MessageRecu = {
  id: string;
  parentPrenom: string;
  parentNom: string;
  email: string;
  sujet: string;
  message: string;
  date: string;
  traite: boolean;
};

export const messagesInitiaux: MessageRecu[] = [
  {
    id: "m1",
    parentPrenom: "Karim",
    parentNom: "Brahimi",
    email: "k.brahimi@email.dz",
    sujet: "Absence de demain",
    message:
      "Bonjour, ma fille Yasmine sera absente demain pour un rendez-vous médical. Merci de bien vouloir prendre note.",
    date: "2026-05-22",
    traite: false,
  },
  {
    id: "m2",
    parentPrenom: "Amira",
    parentNom: "Saidi",
    email: "amira.s@email.dz",
    sujet: "Demande de rendez-vous",
    message:
      "Bonjour, je souhaiterais un rendez-vous avec la directrice concernant les évaluations de mon fils Imad. Quelles disponibilités cette semaine ?",
    date: "2026-05-21",
    traite: false,
  },
  {
    id: "m3",
    parentPrenom: "Nadia",
    parentNom: "Hamidi",
    email: "n.hamidi@email.dz",
    sujet: "Question sur la cantine",
    message:
      "Mon enfant a une allergie aux fruits à coque. Pouvez-vous confirmer que cela est bien pris en compte ?",
    date: "2026-05-20",
    traite: true,
  },
  {
    id: "m4",
    parentPrenom: "Hocine",
    parentNom: "Bouzid",
    email: "h.bouzid@email.dz",
    sujet: "Sortie pédagogique",
    message: "Le formulaire d'autorisation est-il disponible en ligne ?",
    date: "2026-05-19",
    traite: false,
  },
];

export const statsUtilisation = {
  connexionsAujourdHui: 47,
  connexions7jours: 312,
  moduleLePlusVisite: "Tableau d'affichage",
  pourcentageActifs: 78,
};

export function genererCodeAcces(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
