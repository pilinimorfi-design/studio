/**
 * Content layer. All editorial copy is read through these async getters so the
 * source can later be swapped for an external CMS (fetch here) without touching
 * any component. Products come from Shopify (see src/lib/shopify.ts).
 */
import heroImage from "@/assets/hero-pottery.jpg";
import aboutImage from "@/assets/about-hands.jpg";

export interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
}
export interface AboutContent {
  title: string;
  paragraphs: string[];
  image: string;
}
export interface Seminar {
  id: string;
  kind: "in-person" | "online";
  title: string;
  description: string;
  details: string[];
}

const hero: HeroContent = {
  eyebrow: "Εργαστήριο αγγειοπλαστικής",
  title: "Πήλινη Μορφή",
  subtitle: "Χειροποίητα κεραμικά πλασμένα στον τροχό με αγάπη στον πηλό και την δημιουργία.",
  image: heroImage,
};

const about: AboutContent = {
  title: "Σχετικά με εμάς",
  paragraphs: [
    "Στο εργαστήριο \"Πήλινη Μορφή\", η δημιουργία ξεκινά από τη μαγεία της χειροτεχνίας. Όλα άρχισαν όταν ήρθα για πρώτη φορά σε επαφή με τον τροχό της αγγειοπλαστικής. Εκείνη τη στιγμή, η αίσθηση του πηλού που δαμάζεται κάτω από τα δάχτυλα με συνεπήρε.",
    "Κάθε αντικείμενο που δημιουργώ κουβαλάει τη δική του έμπνευση και μοναδική ομορφιά. Με οδηγεί η αγάπη προς τον πηλό, δίνοντας σε κάθε δημιουργία μια ξεχωριστή ψυχή.",
    "Αυτή είναι η φιλοσοφία του εργαστηρίου \"Πήλινη Μορφή\", όπου κάθε κομμάτι αποτελεί μια ξεχωριστή έκφραση κεραμικής τέχνης.",
  ],
  image: aboutImage,
};

const seminars: Seminar[] = [
  {
    id: "in-person",
    kind: "in-person",
    title: "Σεμινάρια δια ζώσης",
    description: "Ελάτε στο εργαστήριο και δουλέψτε στον τροχό με καθοδήγηση, σε μικρές ομάδες.",
    details: ["Τροχός & χειροπλαστική", "Υλικά και ψήσιμο περιλαμβάνονται", "Για αρχάριους και προχωρημένους"],
  },
  {
    id: "online",
    kind: "online",
    title: "Διαδικτυακά σεμινάρια μέσω video",
    description: "Μάθετε από το σπίτι σας με ζωντανά μαθήματα και βιντεοσκοπημένες ενότητες.",
    details: ["Ζωντανές συνεδρίες μέσω video", "Πρόσβαση στα βίντεο όποτε θέλετε", "Οδηγός υλικών για το σπίτι"],
  },
];

export const siteContent = {
  async getHero(): Promise<HeroContent> {
    return hero;
  },
  async getAbout(): Promise<AboutContent> {
    return about;
  },
  async getSeminars(): Promise<Seminar[]> {
    return seminars;
  },
};
