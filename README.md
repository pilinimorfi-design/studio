# Πήλινη Μορφή Studio

Δημιούργησε ένα responsive e-shop για ένα εργαστήριο αγγειοπλαστικής με το όνομα "Πήλινη Μορφή". Η αρχική σελίδα πρέπει να εμφανίζει τα προϊόντα σε περίοπτη θέση και να περιλαμβάνει μια ενότητα για "Σχετικά με Εμένα". Επίσης, προσθήκη ενός κουμπιού για σεμινάρια δια ζώσης και διαδικτυακά μέσω Video. Ο κώδικας πρέπει να είναι δομημένος ώστε να υποστηρίζει εύκολη ανάκτηση περιεχομένου από ένα εξωτερικό σύστημα διαχείρισης.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4e0cb627-fc49-51f5-a767-3b5fe33ca5c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? Install [Bun](https://bun.sh/docs/installation).

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

This project uses Bun exclusively: use `bun install`, `bun run` and `bunx`.
Never use `npm` or `npx`.

## Διαχείριση προϊόντων

Ο δημόσιος κατάλογος και η φόρμα διαχείρισης χρησιμοποιούν τη Supabase. Η φόρμα βρίσκεται στη διαδρομή `/admin/products` και επιτρέπει προσθήκη, επεξεργασία, δημοσίευση/απόσυρση και διαγραφή προϊόντων. Τα δημοσιευμένα προϊόντα εμφανίζονται στην αρχική σελίδα. Το καλάθι επισκέπτη αποθηκεύεται στη Supabase. Το checkout εμφανίζει επιλογές EveryPay/αντικαταβολής και BoxNow/ACS, αλλά η καταχώριση παραγγελίας και οι διασυνδέσεις παραμένουν ανενεργές μέχρι να ολοκληρωθούν οι εμπορικοί λογαριασμοί, οι τεχνικές προδιαγραφές και οι απαραίτητες αλλαγές στη βάση.

Για ενεργοποίηση:

- Εκτέλεσε τη μετανάστευση `supabase/migrations/20261108000000_create_products.sql` στο Supabase project.
- Εκτέλεσε τη μετανάστευση `supabase/migrations/20261108162000_add_product_weight.sql` για τη στήλη βάρους.
- Εκτέλεσε τη μετανάστευση `supabase/migrations/20261109160000_add_product_categories.sql` για τον πίνακα κατηγοριών και τη σύνδεσή του με τα προϊόντα. Δημιουργεί τις αρχικές κατηγορίες Μπολ, Πιάτο, Κούπα, Βάζο, Γλάστρα, Ρεσό και Τασάκι. Άνοιξε τη Supabase → SQL Editor, επικόλλησε το περιεχόμενο του αρχείου και εκτέλεσέ το πριν χρησιμοποιήσεις την ενημερωμένη φόρμα.
- Η φόρμα διαχείρισης φορτώνει τις κατηγορίες από τη Supabase και επιτρέπει ασφαλή προσθήκη νέων κατηγοριών με τον κωδικό διαχείρισης. Τα προϊόντα κρατούν σύνδεση `category_id`, ενώ το υπάρχον `product_type` συνεχίζει να ενημερώνεται για συμβατότητα με τον δημόσιο κατάλογο. Δεν απαιτείται μεταφορά των δοκιμαστικών καταχωρίσεων.
- Όρισε στον server τις μεταβλητές `PRODUCT_ADMIN_PASSWORD` (ισχυρός κωδικός φόρμας) και `SUPABASE_SERVICE_ROLE_KEY`. Μην εκθέσεις το service-role key σε μεταβλητή `VITE_*` ή στον browser.
- Η φόρμα δημιουργεί μοναδικό SKU και δημοσιεύει νέα προϊόντα στον κατάλογο από προεπιλογή. Τα προϊόντα Shopify δεν μεταφέρονται αυτόματα· καταχώρισέ τα στη Supabase μέσω της φόρμας.
- Εκτέλεσε τη μετανάστευση `supabase/migrations/20261108170000_create_cart_and_orders.sql` για τα καλάθια, τις παραγγελίες και τα αποθηκευμένα αντίγραφα ειδών παραγγελίας.
- Για πραγματικές πληρωμές/αποστολές, άνοιξε εμπορικούς λογαριασμούς και ζήτησε από EveryPay, ACS και BoxNow τις sandbox προδιαγραφές, credentials, callback/webhook οδηγίες, τιμοκαταλόγους και locker widget. Η εφαρμογή δεν επιτρέπει παραγγελίες/χρεώσεις μέχρι να υλοποιηθούν και να ελεγχθούν αυτές οι συμβάσεις API.
- Το BoxNow locker widget φορτώνεται από το επίσημο CDN v5 μόνο όταν οριστεί το δημόσιο `VITE_BOXNOW_PARTNER_ID`. Η σελίδα `/order-confirmation?orderId=<uuid>` εμφανίζει επιτυχία μόνο όταν η Supabase επιστρέφει `payment_status = paid`; απαιτείται ακόμα η ολοκλήρωση της ροής παραγγελίας/πληρωμής ώστε να γίνει redirect σε αυτή τη σελίδα.
- Στο checkout της ACS, η αναζήτηση Πόλης/Χωριού από τον Τ.Κ. χρησιμοποιεί Nominatim/OpenStreetMap, με προσωρινή αποθήκευση και περιορισμό ρυθμού. Η αναζήτηση γίνεται μόνο μετά την εισαγωγή πλήρους πενταψήφιου Τ.Κ.· ο χρήστης μπορεί να διορθώσει χειροκίνητα την πόλη. Για συμβατή εναλλακτική υπηρεσία μπορεί να οριστεί στον server η μεταβλητή `NOMINATIM_SEARCH_URL`.
