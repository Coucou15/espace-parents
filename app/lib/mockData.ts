export type PalierId = "maternelle" | "primaire" | "college" | "lycee";

export type Niveau = {
  id: string;
  nomFr: string;
  nomDz?: string;
};

export type Palier = {
  id: PalierId;
  nom: string;
  niveaux: Niveau[];
};

export const SECTIONS = ["A", "B", "C", "D"] as const;
export type SectionId = (typeof SECTIONS)[number];

export const paliers: Palier[] = [
  {
    id: "maternelle",
    nom: "Maternelle",
    niveaux: [
      { id: "ps", nomFr: "Petite section" },
      { id: "ms", nomFr: "Moyenne section" },
      { id: "gs", nomFr: "Grande section" },
    ],
  },
  {
    id: "primaire",
    nom: "Primaire",
    niveaux: [
      { id: "cp", nomFr: "CP", nomDz: "1AP" },
      { id: "ce1", nomFr: "CE1", nomDz: "2AP" },
      { id: "ce2", nomFr: "CE2", nomDz: "3AP" },
      { id: "cm1", nomFr: "CM1", nomDz: "4AP" },
      { id: "cm2", nomFr: "CM2", nomDz: "5AP" },
    ],
  },
  {
    id: "college",
    nom: "Collège",
    niveaux: [
      { id: "6e", nomFr: "6ème", nomDz: "1AM" },
      { id: "5e", nomFr: "5ème", nomDz: "2AM" },
      { id: "4e", nomFr: "4ème", nomDz: "3AM" },
      { id: "3e", nomFr: "3ème", nomDz: "4AM" },
    ],
  },
  {
    id: "lycee",
    nom: "Lycée",
    niveaux: [
      { id: "2nde", nomFr: "Seconde", nomDz: "1AS" },
      { id: "1ere", nomFr: "Première", nomDz: "2AS" },
      { id: "term", nomFr: "Terminale", nomDz: "3AS" },
    ],
  },
];

export function getPalier(id: PalierId): Palier | undefined {
  return paliers.find((p) => p.id === id);
}

export function getNiveau(palierId: PalierId, niveauId: string): Niveau | undefined {
  return getPalier(palierId)?.niveaux.find((n) => n.id === niveauId);
}

export function formatNiveau(niveau: Niveau): string {
  return niveau.nomDz ? `${niveau.nomDz} (${niveau.nomFr})` : niveau.nomFr;
}

export function formatClasse(palierId: PalierId, niveauId: string, section?: SectionId): string {
  const niv = getNiveau(palierId, niveauId);
  if (!niv) return "";
  const nom = formatNiveau(niv);
  return section ? `${nom} · Section ${section}` : nom;
}

export type Annonce = {
  id: string;
  titre: string;
  texte: string;
  date: string;
  categorie: "urgent" | "evenement" | "administratif" | "pedagogique";
  lu: boolean;
};

export type RepasJour = {
  jour: string;
  date: string;
  entree: string;
  plat: string;
  accompagnement: string;
  dessert: string;
  allergenes?: string[];
};

export const annonces: Annonce[] = [
  {
    id: "a1",
    titre: "Réunion parents-professeurs",
    texte:
      "Une réunion est organisée le vendredi 5 juin à 17h dans le préau. Présence vivement souhaitée pour faire le bilan du trimestre.",
    date: "2026-05-20",
    categorie: "evenement",
    lu: false,
  },
  {
    id: "a2",
    titre: "Fermeture exceptionnelle jeudi",
    texte:
      "L'école sera fermée le jeudi 28 mai pour formation pédagogique. Aucun service de cantine ce jour-là.",
    date: "2026-05-19",
    categorie: "urgent",
    lu: false,
  },
  {
    id: "a3",
    titre: "Sortie pédagogique CE2",
    texte:
      "Les élèves de CE2 visiteront le musée d'histoire naturelle le 12 juin. Autorisation à retourner avant le 5 juin.",
    date: "2026-05-17",
    categorie: "pedagogique",
    lu: true,
  },
  {
    id: "a4",
    titre: "Nouveau règlement intérieur",
    texte:
      "Le règlement intérieur a été mis à jour. Consultez la rubrique dédiée pour en prendre connaissance.",
    date: "2026-05-12",
    categorie: "administratif",
    lu: true,
  },
];

export const menuSemaineActuelle: RepasJour[] = [
  {
    jour: "Lundi",
    date: "2026-05-25",
    entree: "Salade de tomates et maïs",
    plat: "Poulet rôti",
    accompagnement: "Pommes de terre vapeur",
    dessert: "Yaourt nature",
    allergenes: ["lactose"],
  },
  {
    jour: "Mardi",
    date: "2026-05-26",
    entree: "Carottes râpées",
    plat: "Poisson pané",
    accompagnement: "Riz pilaf",
    dessert: "Compote de pommes",
    allergenes: ["poisson", "gluten"],
  },
  {
    jour: "Mercredi",
    date: "2026-05-27",
    entree: "Concombre à la vinaigrette",
    plat: "Boulettes de bœuf à la sauce tomate",
    accompagnement: "Coquillettes",
    dessert: "Fromage blanc",
    allergenes: ["gluten", "lactose"],
  },
  {
    jour: "Jeudi",
    date: "2026-05-28",
    entree: "—",
    plat: "Fermeture exceptionnelle",
    accompagnement: "—",
    dessert: "—",
  },
  {
    jour: "Vendredi",
    date: "2026-05-29",
    entree: "Salade verte",
    plat: "Couscous merguez",
    accompagnement: "Légumes du couscous",
    dessert: "Salade de fruits",
    allergenes: ["gluten"],
  },
];

export const menuSemaineSuivante: RepasJour[] = [
  {
    jour: "Lundi",
    date: "2026-06-01",
    entree: "Taboulé",
    plat: "Lasagnes",
    accompagnement: "Salade verte",
    dessert: "Banane",
    allergenes: ["gluten", "lactose"],
  },
  {
    jour: "Mardi",
    date: "2026-06-02",
    entree: "Œuf mayonnaise",
    plat: "Escalope de dinde",
    accompagnement: "Purée de carottes",
    dessert: "Yaourt aux fruits",
    allergenes: ["œuf", "lactose"],
  },
  {
    jour: "Mercredi",
    date: "2026-06-03",
    entree: "Melon",
    plat: "Tajine de poulet",
    accompagnement: "Semoule",
    dessert: "Crème vanille",
    allergenes: ["gluten", "lactose"],
  },
  {
    jour: "Jeudi",
    date: "2026-06-04",
    entree: "Salade niçoise",
    plat: "Filet de cabillaud",
    accompagnement: "Haricots verts",
    dessert: "Pomme",
    allergenes: ["poisson"],
  },
  {
    jour: "Vendredi",
    date: "2026-06-05",
    entree: "Soupe de légumes",
    plat: "Pizza margherita",
    accompagnement: "Crudités",
    dessert: "Glace vanille",
    allergenes: ["gluten", "lactose"],
  },
];

export type Evaluation = {
  matiere: string;
  note: number;
  noteSur: number;
  appreciation: string;
  date: string;
};

export type BulletinEnfant = {
  enfant: string;
  palierId: PalierId;
  niveauId: string;
  section: SectionId;
  trimestre: string;
  moyenne: number;
  evaluations: Evaluation[];
};

export const bulletins: BulletinEnfant[] = [
  {
    enfant: "Sami",
    palierId: "primaire",
    niveauId: "ce2",
    section: "B",
    trimestre: "2ᵉ trimestre 2025-2026",
    moyenne: 15.2,
    evaluations: [
      { matiere: "Français", note: 16, noteSur: 20, appreciation: "Très bonne lecture, progrès en expression écrite.", date: "2026-05-15" },
      { matiere: "Mathématiques", note: 14, noteSur: 20, appreciation: "Bonne logique, attention aux étourderies.", date: "2026-05-12" },
      { matiere: "Sciences", note: 17, noteSur: 20, appreciation: "Curieux et participatif.", date: "2026-05-10" },
      { matiere: "Anglais", note: 13, noteSur: 20, appreciation: "À l'aise à l'oral.", date: "2026-05-08" },
      { matiere: "Arabe", note: 15, noteSur: 20, appreciation: "Bons progrès en lecture.", date: "2026-05-06" },
      { matiere: "Arts", note: 18, noteSur: 20, appreciation: "Excellent travail créatif.", date: "2026-05-05" },
      { matiere: "Sport", note: 15, noteSur: 20, appreciation: "Bon esprit d'équipe.", date: "2026-05-03" },
    ],
  },
  {
    enfant: "Lina",
    palierId: "maternelle",
    niveauId: "gs",
    section: "A",
    trimestre: "2ᵉ trimestre 2025-2026",
    moyenne: 16.8,
    evaluations: [
      { matiere: "Pré-lecture", note: 18, noteSur: 20, appreciation: "Reconnaît toutes les lettres, bravo !", date: "2026-05-14" },
      { matiere: "Écriture", note: 16, noteSur: 20, appreciation: "Belle écriture appliquée.", date: "2026-05-11" },
      { matiere: "Pré-calcul", note: 15, noteSur: 20, appreciation: "Maîtrise les nombres jusqu'à 20.", date: "2026-05-09" },
      { matiere: "Découverte du monde", note: 17, noteSur: 20, appreciation: "Très éveillée, pose beaucoup de questions.", date: "2026-05-06" },
      { matiere: "Arts", note: 18, noteSur: 20, appreciation: "Imagination débordante.", date: "2026-05-04" },
    ],
  },
  {
    enfant: "Yacine",
    palierId: "college",
    niveauId: "5e",
    section: "A",
    trimestre: "2ᵉ trimestre 2025-2026",
    moyenne: 13.5,
    evaluations: [
      { matiere: "Français", note: 12, noteSur: 20, appreciation: "Doit approfondir la grammaire.", date: "2026-05-15" },
      { matiere: "Mathématiques", note: 14, noteSur: 20, appreciation: "Travail sérieux en géométrie.", date: "2026-05-12" },
      { matiere: "SVT", note: 15, noteSur: 20, appreciation: "Très impliqué en classe.", date: "2026-05-10" },
      { matiere: "Physique-Chimie", note: 13, noteSur: 20, appreciation: "Doit poser plus de questions.", date: "2026-05-08" },
      { matiere: "Anglais", note: 14, noteSur: 20, appreciation: "Compréhension orale satisfaisante.", date: "2026-05-07" },
      { matiere: "Arabe", note: 16, noteSur: 20, appreciation: "Très bon niveau d'expression.", date: "2026-05-05" },
      { matiere: "Histoire-Géo", note: 11, noteSur: 20, appreciation: "Doit fournir plus de travail personnel.", date: "2026-05-03" },
      { matiere: "Sport", note: 14, noteSur: 20, appreciation: "Bon esprit sportif.", date: "2026-05-02" },
    ],
  },
];

export type Cours = {
  id: string;
  matiere: string;
  enseignant: string;
  salle: string;
  debut: string;
  fin: string;
  modifie?: boolean;
};

export type JourEdt = { jour: string; cours: Cours[] };

export const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

export type ClasseId = string; // forme: "palierId|niveauId|section" ex: "primaire|ce2|B"

export function classeId(palierId: PalierId, niveauId: string, section: SectionId): ClasseId {
  return `${palierId}|${niveauId}|${section}`;
}

export function parseClasseId(id: ClasseId): { palierId: PalierId; niveauId: string; section: SectionId } | null {
  const [palierId, niveauId, section] = id.split("|");
  if (!palierId || !niveauId || !section) return null;
  return { palierId: palierId as PalierId, niveauId, section: section as SectionId };
}

function cours(id: string, matiere: string, enseignant: string, salle: string, debut: string, fin: string, modifie = false): Cours {
  return { id, matiere, enseignant, salle, debut, fin, ...(modifie ? { modifie: true } : {}) };
}

// EDT par classe. Clé = classeId. Quelques classes pré-remplies en exemple ;
// les autres sont vides (l'admin doit les remplir).
export const emploisDuTempsParClasse: Record<ClasseId, JourEdt[]> = {
  [classeId("primaire", "ce2", "B")]: [
    {
      jour: "Lundi",
      cours: [
        cours("c1", "Français", "Mme Karim", "12", "08:30", "10:00"),
        cours("c2", "Mathématiques", "M. Dubois", "12", "10:15", "11:45"),
        cours("c3", "Récréation", "—", "Cour", "11:45", "12:00"),
        cours("c4", "Anglais", "Ms. Taylor", "08", "14:00", "15:00"),
        cours("c5", "Sport", "M. Lopez", "Gymnase", "15:15", "16:30"),
      ],
    },
    {
      jour: "Mardi",
      cours: [
        cours("c6", "Mathématiques", "M. Dubois", "12", "08:30", "10:00"),
        cours("c7", "Sciences", "Mme Petit", "Labo", "10:15", "11:45"),
        cours("c8", "Arts plastiques", "Mme Hayat", "Atelier", "14:00", "15:30", true),
      ],
    },
    {
      jour: "Mercredi",
      cours: [
        cours("c9", "Français", "Mme Karim", "12", "08:30", "10:00"),
        cours("c10", "Musique", "M. Renaud", "Salle musique", "10:15", "11:45"),
      ],
    },
    {
      jour: "Jeudi",
      cours: [
        cours("c11", "Français", "Mme Karim", "12", "08:30", "10:00"),
        cours("c12", "Histoire-Géo", "M. Saadi", "14", "10:15", "11:45"),
        cours("c13", "Mathématiques", "M. Dubois", "12", "14:00", "15:30"),
      ],
    },
    {
      jour: "Vendredi",
      cours: [
        cours("c14", "Anglais", "Ms. Taylor", "08", "08:30", "10:00"),
        cours("c15", "Sciences", "Mme Petit", "Labo", "10:15", "11:45"),
        cours("c16", "Sport", "M. Lopez", "Gymnase", "14:00", "16:00"),
      ],
    },
  ],
  [classeId("maternelle", "gs", "A")]: [
    {
      jour: "Lundi",
      cours: [
        cours("g1", "Accueil et regroupement", "Mme Saadia", "Salle GS", "08:30", "09:15"),
        cours("g2", "Atelier lecture", "Mme Saadia", "Salle GS", "09:15", "10:30"),
        cours("g3", "Récréation", "—", "Cour", "10:30", "11:00"),
        cours("g4", "Motricité", "M. Lopez", "Gymnase", "11:00", "11:45"),
      ],
    },
    {
      jour: "Mardi",
      cours: [
        cours("g5", "Accueil et regroupement", "Mme Saadia", "Salle GS", "08:30", "09:15"),
        cours("g6", "Atelier mathématiques", "Mme Saadia", "Salle GS", "09:15", "10:30"),
        cours("g7", "Récréation", "—", "Cour", "10:30", "11:00"),
        cours("g8", "Arts visuels", "Mme Hayat", "Atelier", "11:00", "11:45"),
      ],
    },
  ],
  [classeId("college", "5e", "A")]: [
    {
      jour: "Lundi",
      cours: [
        cours("y1", "Mathématiques", "M. Bachir", "201", "08:00", "09:00"),
        cours("y2", "Français", "Mme Belaid", "203", "09:00", "10:00"),
        cours("y3", "Récréation", "—", "Cour", "10:00", "10:15"),
        cours("y4", "Physique-Chimie", "M. Tahar", "Labo 2", "10:15", "11:15"),
        cours("y5", "Anglais", "Ms. Smith", "108", "11:15", "12:15"),
        cours("y6", "Histoire-Géo", "M. Saadi", "205", "14:00", "15:00"),
        cours("y7", "EPS", "M. Lopez", "Gymnase", "15:00", "17:00"),
      ],
    },
    {
      jour: "Mardi",
      cours: [
        cours("y8", "SVT", "Mme Petit", "Labo 1", "08:00", "09:00"),
        cours("y9", "Mathématiques", "M. Bachir", "201", "09:00", "10:00"),
        cours("y10", "Arabe", "M. Hadj", "207", "10:15", "11:15"),
        cours("y11", "Français", "Mme Belaid", "203", "11:15", "12:15"),
      ],
    },
  ],
};

// Helper : récupère l'EDT d'une classe (tableau vide si non défini)
export function getEdtClasse(palierId: PalierId, niveauId: string, section: SectionId): JourEdt[] {
  const id = classeId(palierId, niveauId, section);
  return emploisDuTempsParClasse[id] ?? [];
}

export type AlbumPhoto = {
  id: string;
  src: string; // URL réelle (http/blob/data) OU label affiché en vignette
  nom?: string;
};

export type Album = {
  id: string;
  titre: string;
  date: string;
  photos: AlbumPhoto[];
};

function photosFactices(albumId: string, n: number): AlbumPhoto[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${albumId}-p${i}`,
    src: `Photo ${i + 1}`,
    nom: `Photo ${i + 1}`,
  }));
}

export const albums: Album[] = [
  { id: "g1", titre: "Sortie au musée", date: "2026-05-18", photos: photosFactices("g1", 12) },
  { id: "g2", titre: "Spectacle de fin d'année", date: "2026-05-10", photos: photosFactices("g2", 24) },
  { id: "g3", titre: "Journée sportive", date: "2026-04-22", photos: photosFactices("g3", 18) },
  { id: "g4", titre: "Carnaval", date: "2026-03-14", photos: photosFactices("g4", 30) },
];

export type SectionReglement = { titre: string; paragraphes: string[] };

export const reglement: {
  version: string;
  miseAJour: string;
  sections: SectionReglement[];
} = {
  version: "v3.1",
  miseAJour: "2026-04-01",
  sections: [
    {
      titre: "1. Horaires",
      paragraphes: [
        "L'école est ouverte du lundi au vendredi de 8h00 à 17h30.",
        "L'accueil du matin débute à 8h15. Les cours commencent à 8h30 précises.",
        "Les retards répétés feront l'objet d'un rendez-vous avec la direction.",
      ],
    },
    {
      titre: "2. Absences",
      paragraphes: [
        "Toute absence doit être signalée le matin même par téléphone ou via l'application.",
        "Un justificatif écrit (médical le cas échéant) est demandé au retour de l'enfant.",
      ],
    },
    {
      titre: "3. Tenue et matériel",
      paragraphes: [
        "Les enfants doivent porter une tenue propre et adaptée à l'activité scolaire.",
        "Le matériel scolaire est fourni par la famille selon la liste remise en début d'année.",
      ],
    },
    {
      titre: "4. Vie collective",
      paragraphes: [
        "Le respect mutuel entre élèves, enseignants et personnel est la règle fondamentale.",
        "Toute forme de violence physique ou verbale est strictement interdite.",
      ],
    },
    {
      titre: "5. Sécurité",
      paragraphes: [
        "Les téléphones portables doivent rester éteints et rangés pendant les cours.",
        "Les objets de valeur sont déconseillés et restent sous la responsabilité des familles.",
      ],
    },
    {
      titre: "6. Communication école-famille",
      paragraphes: [
        "L'application « Espace Parents » est le canal officiel de communication.",
        "Les rendez-vous avec les enseignants se prennent via le secrétariat.",
      ],
    },
  ],
};

export const ecole = {
  nom: "École Les Racines du Futur",
  adresse: "12 avenue de l'Avenir, 75000 Ville",
  telephone: "+33 1 23 45 67 89",
  email: "contact@racinesdufutur.fr",
  horaires: "Lundi à vendredi · 8h00 – 17h30",
  reseauxSociaux: {
    facebook: "https://facebook.com/racinesdufutur",
    instagram: "https://instagram.com/racinesdufutur",
  },
};
