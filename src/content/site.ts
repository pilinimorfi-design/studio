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
  subtitle: "Χειροποίητα κεραμικά, πλασμένα στον τροχό με αγάπη για τη γη και το φως.",
  image: heroImage,
};

const about: AboutContent = {
  title: "Σχετικά με εμάς",
  paragraphs: [
    "Η Πήλινη Μορφή είναι ένα μικρό εργαστήριο όπου ο πηλός παίρνει σχήμα με υπομονή και φροντίδα. Κάθε κομμάτι πλάθεται στο χέρι, ψήνεται και υαλώνεται ξεχωριστά — γι' αυτό δεν υπάρχουν δύο ίδια.",
    "Πιστεύουμε στα αντικείμενα που ζουν μαζί μας: ένα φλιτζάνι για τον πρωινό καφέ, ένα βάζο για τα λουλούδια του κήπου. Μοιραζόμαστε επίσης την τέχνη μας μέσα από σεμινάρια για κάθε επίπεδο.",
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
