---
name: invoice
description: Describe when to use this prompt
---
Tu dois développer une application web complète de génération de factures, calquée sur le modèle de facture béninoise fourni (facture Syntaiz). L’application permettra à un vendeur (l’utilisateur) de gérer ses propres informations (IFU, adresse, contacts), de gérer une base de clients, et de créer des factures en quelques clics avec un aperçu en direct. La facture finale doit être visuellement identique à l’exemple, avec un QR code scannable contenant les informations du vendeur et la date de génération. Une bannière avec le drapeau du Bénin doit figurer en haut de la facture.

Stack technique imposée

Framework : Next.js (App Router)
Base de données : MySQL avec Prisma comme ORM (schéma embarqué)
UI / Styling : Tailwind CSS + composants shadcn/ui (pour gagner du temps)
QR Code : qrcode.react ou node-qrcode
Gestion des formulaires : React Hook Form + Zod (validation)
Conversion nombre en lettres : package number-to-words ou fonction personnalisée

Fonctionnalités attendues

1. Gestion du vendeur (profil unique)

L’utilisateur peut renseigner et modifier ses informations (car elles apparaissent sur chaque facture) :

Nom / raison sociale
IFU (obligatoire)
Adresse complète (rue, lot, maison, ville)
Contact (téléphone, email)
Une seule entrée en base (table Seller). À la première utilisation, un formulaire向导引导 la saisie.
2. Gestion des clients (CRUD)

Liste des clients avec possibilité d’ajouter, modifier, supprimer.
Champs client (obligatoires sauf mention contraire) :

Nom (ou raison sociale)
IFU (optionnel, car le client peut ne pas en avoir)
Adresse
Contact (téléphone)
Courriel
Lors de la création d’une facture, l’utilisateur peut sélectionner un client existant ou en créer un rapidement.
3. Création de facture

Interface en deux parties :

Formulaire de saisie (à gauche ou en haut)
Aperçu en direct de la facture (à droite ou en bas) qui se met à jour à chaque modification.
Champs du formulaire :

Sélection du client (dropdown + bouton “+ Nouveau client”)
Date de la facture (par défaut aujourd’hui, modifiable)
Numéro de facture généré automatiquement (format : EM + incrément, ex: EM0107355821). Stocker le dernier numéro utilisé pour incrémenter.
Tableau des articles (lignes dynamiques) :

Nom du produit/service
Quantité
Prix unitaire TTC (car la facture d’exemple ne détaille pas la TVA)
Montant total TTC calculé automatiquement (quantité × prix unitaire)
Possibilité d’ajouter / supprimer des lignes.
Groupe d’impôt : pour l’instant seul le groupe “A - EXONERE” est présent (exemple). Mais on peut prévoir un champ select avec d’autres groupes (B, C, …) si nécessaire. Le montant imposable est égal au total TTC (puisque exonéré). Les impôts sont à 0.
Type de paiement : select avec options (AUTRE, ESPECES, CARTE, etc.). Par défaut “AUTRE”.
Montant payé : initialisé au total TTC, modifiable (pour acompte).
Calculs automatiques :

Sous-total par ligne
Total TTC général
Total imposable (généralement = total TTC si exonéré)
Impôts (0 si exonéré)
Le montant total en lettres (ex: “cent quatre-vingt-seize mille sept cent quatre-vingt-sept francs CFA”).
La zone “Arrêté la présente facture à la somme de …”.
4. QR code

Généré dynamiquement pour chaque facture.
Contenu : un objet JSON ou une chaîne contenant les informations du vendeur (nom, IFU, adresse, contact) et la date de génération (au format ISO).
Le QR code doit être placé à un endroit visible sur la facture (par exemple en bas à droite, avant le code MCEcF).
Utiliser qrcode.react pour l’affichage côté client.
5. Bannière drapeau du Bénin

En haut de la facture, une bande horizontale aux couleurs du Bénin : vert, jaune, rouge (disposition classique : verticale ? Le drapeau du Bénin est une bande verticale verte à gauche, et deux bandes horizontales jaune et rouge à droite. Mais pour une bannière, on peut faire un dégradé ou trois bandes horizontales : vert, jaune, rouge de haut en bas. À clarifier : je propose trois bandes horizontales de même hauteur (vert, jaune, rouge) en en-tête de la facture, avec éventuellement un texte “RÉPUBLIQUE DU BÉNIN” en blanc par-dessus. L’utilisateur pourra adapter.
Largeur 100% de la facture, hauteur ~40px.
6. Export / Impression

Bouton “Imprimer” ou “Télécharger en PDF” (optionnel dans un premier temps, mais bien vu). L’aperçu en direct est déjà une étape.
7. Base de données (Prisma)

Modèles :

model Seller {
  id        String   @id @default(cuid())
  name      String
  ifu       String   @unique
  address   String
  contact   String   // téléphone
  email     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  invoices  Invoice[]
}

model Client {
  id        String   @id @default(cuid())
  name      String
  ifu       String?  // optionnel
  address   String
  contact   String   // téléphone
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  invoices  Invoice[]
}

model Invoice {
  id              String        @id @default(cuid())
  invoiceNumber   String        @unique // ex: EM0107355821
  date            DateTime      // date de la facture
  sellerId        String
  seller          Seller        @relation(fields: [sellerId], references: [id])
  clientId        String
  client          Client        @relation(fields: [clientId], references: [id])
  totalTTC        Float
  taxGroup        String        // "A - EXONERE" par défaut
  taxableAmount   Float         // total imposable
  taxAmount       Float         // montant des impôts (0 si exonéré)
  paymentType     String        // "AUTRE", "ESPECES", etc.
  paymentReceived Float         // montant payé
  notes           String?       // éventuel texte libre
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  items           InvoiceItem[]
}

model InvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
  description String
  quantity    Float
  unitPrice   Float    // prix unitaire TTC
  total       Float    // quantité * unitPrice
}


8. API Routes nécessaires

GET /api/seller : récupérer les infos vendeur (une seule ligne)
POST /api/seller : créer/mettre à jour le vendeur
GET /api/clients : lister tous les clients
POST /api/clients : créer un client
PUT /api/clients/[id] : modifier un client
DELETE /api/clients/[id] : supprimer un client
GET /api/invoices : lister les factures (optionnel)
POST /api/invoices : créer une facture (reçoit les données du formulaire)
GET /api/invoices/[id] : récupérer une facture (pour édition ?)
9. Interface utilisateur (pages)

Page d’accueil : tableau de bord simple avec liens vers les sections.
Page “Mon profil” (vendeur) : formulaire de saisie des infos.
Page “Clients” : liste + formulaire d’ajout/modification (modal ou page dédiée).
Page “Nouvelle facture” : c’est le cœur de l’appli. Doit contenir le formulaire et l’aperçu en direct côte à côte ou l’un en dessous de l’autre (responsive).
Page “Mes factures” (optionnelle) : liste des factures générées avec lien pour les visualiser.
10. Design de la facture (aperçu)

Respecter strictement la mise en page du PDF fourni :

En-tête : bannière drapeau du Bénin (vert, jaune, rouge horizontales).
En dessous : “HINKATI MONELLE NAOMI SONAGNON IFU : 0202289335483” (remplacé par les vraies infos du vendeur)
Titre “FACTURE DE VENTE” en gras, avec le numéro de facture, date, vendeur (SFE en ligne), adresse, contact, email.
Bloc “CLIENT” avec les infos du client sélectionné.
Tableau des articles avec les colonnes : #, Nom, Prix Unitaire, Quantité, Montant T.T.C.
Total TTC en dessous du tableau.
Section “VENTILATION DES IMPOTS” avec tableau : Groupe, Total Imposable, Impôts.
Section “RÉPARTITION DES PAIEMENTS” avec tableau : Type de paiement, Payé.
En dessous, la mention “Arrêté la présente facture à la somme de …” avec le montant en lettres.
Enfin, le code MCEcF / DGI (pour l’exemple, on peut mettre une chaîne fixe ou générée aléatoirement, mais l’important est le QR code).
Le QR code doit être placé juste avant ou après ce code, de préférence à droite.
Pour l’aperçu en direct, utiliser les mêmes composants que l’affichage final.
11. Contraintes supplémentaires

Les prix et totaux doivent être formatés avec l’espace comme séparateur de milliers (ex: 196 787).
Le montant en lettres doit être en français et se terminer par “CFA TTC”.
Le numéro de facture doit être incrémenté automatiquement (trouver le dernier numéro en base et ajouter 1, avec un format type EM suivi de 10 chiffres).
La date peut être modifiée, mais par défaut celle du jour.
Tous les formulaires doivent être validés côté client et serveur (Zod).
L’application doit être entièrement responsive (mobile-friendly).
12. Obligatoire : Génération de PDF avec @react-pdf/renderer ou html2pdf.
Génération de PDF avec @react-pdf/renderer ou html2pdf.
Historique des factures avec recherche/filtre.
Export CSV des factures.

